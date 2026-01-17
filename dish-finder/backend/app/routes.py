"""
API Routes for Dish Finder
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid
import json
import logging

from app.models import (
    SearchRequest, 
    SearchResponse, 
    RestaurantResult,
    SearchHistoryItem
)
from app.database import (
    get_session,
    SearchRepository,
    RestaurantRepository,
    DishRepository,
    CacheRepository
)
from app.services.tinyfish import tinyfish_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_restaurants(
    request: SearchRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Search for restaurants using TinyFish to scrape Yelp.
    
    - **mealtime**: Time of day (breakfast, brunch, lunch, dinner, late_night)
    - **cuisine**: Type of cuisine (e.g., Italian, Mexican, Japanese)
    - **location**: Zip code or location name
    - **latitude/longitude**: Optional GPS coordinates
    
    Returns structured data with top 3 restaurants and their most mentioned dishes.
    """
    search_id = str(uuid.uuid4())[:12]
    
    try:
        # Check cache first
        cached_search_id = await CacheRepository.get_cached_search(
            session,
            request.location,
            request.cuisine,
            request.mealtime.value
        )
        
        if cached_search_id:
            logger.info(f"Cache hit for {request.cuisine} near {request.location}")
            
            # Get cached results
            cached_record = await SearchRepository.get_search_by_id(session, cached_search_id)
            if cached_record:
                cached_restaurants = await RestaurantRepository.get_restaurants_by_search(
                    session, cached_search_id
                )
                
                # Build response from cache
                restaurant_results = []
                for r in cached_restaurants:
                    dishes = await DishRepository.get_dishes_by_restaurant(session, r.id)
                    restaurant_results.append(RestaurantResult(
                        name=r.name,
                        address=r.address,
                        rating=r.rating,
                        total_reviews=r.total_reviews,
                        price_level=r.price_level,
                        phone=r.phone,
                        website=r.website,
                        hours=r.hours,
                        top_dishes=[{
                            "name": d.name,
                            "mention_count": d.mention_count,
                            "sentiment_score": d.sentiment_score,
                            "sample_review": d.sample_review
                        } for d in dishes],
                        cuisine_type=r.cuisine_type,
                        mealtime=r.mealtime,
                        source_url=r.source_url
                    ))
                
                return SearchResponse(
                    success=True,
                    source="cache",
                    search_id=cached_search_id,
                    query={
                        "mealtime": request.mealtime.value,
                        "cuisine": request.cuisine,
                        "location": request.location
                    },
                    restaurants=restaurant_results,
                    scraped_at=cached_record.created_at,
                    message="Results from cache"
                )
        
        # No cache - scrape using Yutori
        logger.info(f"Scraping {request.cuisine} restaurants near {request.location} for {request.mealtime.value}")
        
        # Use SSE streaming and collect final result
        final_result = None
        source_url = None
        
        async for event in tinyfish_service.scrape_restaurants_sse(
            cuisine=request.cuisine,
            location=request.location,
            mealtime=request.mealtime.value
        ):
            if event.get("type") == "COMPLETE":
                final_result = event.get("resultJson", {})
                logger.info(f"Scrape completed with status: {event.get('status')}")
            elif event.get("type") == "ERROR":
                raise HTTPException(
                    status_code=500,
                    detail=f"Scraping error: {event.get('message')}"
                )
        
        if not final_result:
            raise HTTPException(
                status_code=500,
                detail="No results from scraping"
            )
        
        # Parse the scraped results
        source_url = tinyfish_service._build_opentable_url(
            request.cuisine, request.location
        )
        
        restaurants = tinyfish_service.parse_scrape_result(
            final_result,
            request.cuisine,
            request.mealtime.value,
            source_url
        )
        
        # Store in database
        search_record = await SearchRepository.create_search(
            session=session,
            search_id=search_id,
            mealtime=request.mealtime.value,
            cuisine=request.cuisine,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            source="scrape",
            restaurant_count=len(restaurants),
            raw_response=final_result
        )
        
        # Store restaurants and dishes
        for r in restaurants:
            db_restaurant = await RestaurantRepository.create_restaurant(
                session=session,
                search_id=search_id,
                name=r.name,
                address=r.address,
                rating=r.rating,
                total_reviews=r.total_reviews,
                price_level=r.price_level,
                phone=r.phone,
                website=r.website,
                hours=r.hours,
                cuisine_type=r.cuisine_type,
                mealtime=r.mealtime,
                source_url=r.source_url
            )
            
            # Store dishes
            for dish in r.top_dishes:
                await DishRepository.create_dish(
                    session=session,
                    restaurant_id=db_restaurant.id,
                    name=dish.name,
                    mention_count=dish.mention_count,
                    sentiment_score=dish.sentiment_score,
                    sample_review=dish.sample_review
                )
        
        await session.commit()
        
        # Update cache
        await CacheRepository.set_cache(
            session,
            request.location,
            request.cuisine,
            request.mealtime.value,
            search_id,
            ttl_hours=1
        )
        
        return SearchResponse(
            success=True,
            source="scrape",
            search_id=search_id,
            query={
                "mealtime": request.mealtime.value,
                "cuisine": request.cuisine,
                "location": request.location
            },
            restaurants=restaurants,
            scraped_at=datetime.utcnow(),
            message=f"Found {len(restaurants)} restaurants"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )


@router.post("/search/stream")
async def search_restaurants_stream(
    request: SearchRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Search for restaurants with real-time progress streaming.
    
    Returns Server-Sent Events (SSE) with progress updates and final results.
    """
    async def generate():
        search_id = str(uuid.uuid4())[:12]
        
        try:
            # Send start event
            yield f"data: {json.dumps({'type': 'STARTED', 'search_id': search_id})}\n\n"
            
            # Stream Yutori events
            final_result = None
            
            async for event in tinyfish_service.scrape_restaurants_sse(
                cuisine=request.cuisine,
                location=request.location,
                mealtime=request.mealtime.value
            ):
                # Forward progress events
                yield f"data: {json.dumps(event)}\n\n"
                
                if event.get("type") == "COMPLETE":
                    final_result = event.get("resultJson", {})
            
            if final_result:
                # Parse and send final structured result
                source_url = tinyfish_service._build_opentable_url(
                    request.cuisine, request.location
                )
                
                restaurants = tinyfish_service.parse_scrape_result(
                    final_result,
                    request.cuisine,
                    request.mealtime.value,
                    source_url
                )
                
                # Store in database (get a fresh session)
                async for db_session in get_session():
                    await SearchRepository.create_search(
                        session=db_session,
                        search_id=search_id,
                        mealtime=request.mealtime.value,
                        cuisine=request.cuisine,
                        location=request.location,
                        source="scrape",
                        restaurant_count=len(restaurants),
                        raw_response=final_result
                    )
                    
                    for r in restaurants:
                        db_restaurant = await RestaurantRepository.create_restaurant(
                            session=db_session,
                            search_id=search_id,
                            name=r.name,
                            address=r.address,
                            rating=r.rating,
                            total_reviews=r.total_reviews,
                            price_level=r.price_level,
                            phone=r.phone,
                            website=r.website,
                            hours=r.hours,
                            cuisine_type=r.cuisine_type,
                            mealtime=r.mealtime,
                            source_url=r.source_url
                        )
                        
                        for dish in r.top_dishes:
                            await DishRepository.create_dish(
                                session=db_session,
                                restaurant_id=db_restaurant.id,
                                name=dish.name,
                                mention_count=dish.mention_count,
                                sentiment_score=dish.sentiment_score,
                                sample_review=dish.sample_review
                            )
                    
                    await db_session.commit()
                    break
                
                # Send final result
                response = SearchResponse(
                    success=True,
                    source="scrape",
                    search_id=search_id,
                    query={
                        "mealtime": request.mealtime.value,
                        "cuisine": request.cuisine,
                        "location": request.location
                    },
                    restaurants=restaurants,
                    scraped_at=datetime.utcnow(),
                    message=f"Found {len(restaurants)} restaurants"
                )
                
                yield f"data: {json.dumps({'type': 'RESULT', 'data': response.model_dump(mode='json')})}\n\n"
            
        except Exception as e:
            logger.exception(f"Stream search failed: {e}")
            yield f"data: {json.dumps({'type': 'ERROR', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@router.get("/search/{search_id}", response_model=SearchResponse)
async def get_search_result(
    search_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get a previous search result by ID"""
    record = await SearchRepository.get_search_by_id(session, search_id)
    
    if not record:
        raise HTTPException(status_code=404, detail="Search not found")
    
    restaurants = await RestaurantRepository.get_restaurants_by_search(session, search_id)
    
    restaurant_results = []
    for r in restaurants:
        dishes = await DishRepository.get_dishes_by_restaurant(session, r.id)
        restaurant_results.append(RestaurantResult(
            name=r.name,
            address=r.address,
            rating=r.rating,
            total_reviews=r.total_reviews,
            price_level=r.price_level,
            phone=r.phone,
            website=r.website,
            hours=r.hours,
            top_dishes=[{
                "name": d.name,
                "mention_count": d.mention_count,
                "sentiment_score": d.sentiment_score,
                "sample_review": d.sample_review
            } for d in dishes],
            cuisine_type=r.cuisine_type,
            mealtime=r.mealtime,
            source_url=r.source_url
        ))
    
    return SearchResponse(
        success=True,
        source=record.source,
        search_id=search_id,
        query={
            "mealtime": record.mealtime,
            "cuisine": record.cuisine,
            "location": record.location
        },
        restaurants=restaurant_results,
        scraped_at=record.created_at,
        message="Retrieved from database"
    )


@router.get("/history", response_model=list[SearchHistoryItem])
async def get_search_history(
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """Get recent search history"""
    records = await SearchRepository.get_recent_searches(session, limit)
    
    return [
        SearchHistoryItem(
            id=r.id,
            mealtime=r.mealtime,
            cuisine=r.cuisine,
            location=r.location,
            restaurant_count=r.restaurant_count,
            searched_at=r.created_at
        )
        for r in records
    ]


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "dish-finder-backend"
    }
