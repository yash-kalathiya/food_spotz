"""
Database Schema and Repository for Dish Finder
Using SQLAlchemy async with aiosqlite
"""
import os
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.future import select
import json
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create base class for models
Base = declarative_base()


class SearchRecord(Base):
    """Record of a search request"""
    __tablename__ = "search_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    search_id = Column(String(64), unique=True, index=True)
    mealtime = Column(String(50), nullable=False)
    cuisine = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    source = Column(String(20), default="scrape")  # 'scrape' or 'cache'
    restaurant_count = Column(Integer, default=0)
    raw_response = Column(Text, nullable=True)  # Store raw TinyFish response
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    restaurants = relationship("Restaurant", back_populates="search_record", cascade="all, delete-orphan")


class Restaurant(Base):
    """Restaurant information"""
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    search_id = Column(String(64), ForeignKey("search_records.search_id"), index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500))
    rating = Column(Float)
    total_reviews = Column(Integer)
    price_level = Column(String(10))
    phone = Column(String(50))
    website = Column(String(500))
    hours = Column(String(200))
    cuisine_type = Column(String(100))
    mealtime = Column(String(50))
    source_url = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    search_record = relationship("SearchRecord", back_populates="restaurants")
    dishes = relationship("Dish", back_populates="restaurant", cascade="all, delete-orphan")


class Dish(Base):
    """Top dish information from reviews"""
    __tablename__ = "dishes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), index=True)
    name = Column(String(200), nullable=False)
    mention_count = Column(Integer, default=1)
    sentiment_score = Column(Float, default=0.5)
    sample_review = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="dishes")


class CacheEntry(Base):
    """Cache for search results by location/cuisine/mealtime"""
    __tablename__ = "cache_entries"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    cache_key = Column(String(256), unique=True, index=True)  # hash of location+cuisine+mealtime
    search_id = Column(String(64), ForeignKey("search_records.search_id"))
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


# Database engine and session
_engine = None
_async_session_maker = None


async def init_database():
    """Initialize database and create tables"""
    global _engine, _async_session_maker
    
    # Ensure data directory exists
    db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
    if db_path.startswith("./"):
        db_path = db_path[2:]
    
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    
    # Create async engine
    _engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        future=True
    )
    
    # Create all tables
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session maker
    _async_session_maker = sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    logger.info("✅ Database initialized successfully")


async def get_session() -> AsyncSession:
    """Get a database session"""
    if _async_session_maker is None:
        await init_database()
    
    async with _async_session_maker() as session:
        yield session


class SearchRepository:
    """Repository for search-related database operations"""
    
    @staticmethod
    async def create_search(
        session: AsyncSession,
        search_id: str,
        mealtime: str,
        cuisine: str,
        location: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        source: str = "scrape",
        restaurant_count: int = 0,
        raw_response: Optional[dict] = None
    ) -> SearchRecord:
        """Create a new search record"""
        record = SearchRecord(
            search_id=search_id,
            mealtime=mealtime,
            cuisine=cuisine,
            location=location,
            latitude=latitude,
            longitude=longitude,
            source=source,
            restaurant_count=restaurant_count,
            raw_response=json.dumps(raw_response) if raw_response else None
        )
        session.add(record)
        await session.commit()
        return record
    
    @staticmethod
    async def get_search_by_id(session: AsyncSession, search_id: str) -> Optional[SearchRecord]:
        """Get search record by ID"""
        result = await session.execute(
            select(SearchRecord).where(SearchRecord.search_id == search_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_recent_searches(session: AsyncSession, limit: int = 10) -> List[SearchRecord]:
        """Get recent search records"""
        result = await session.execute(
            select(SearchRecord)
            .order_by(SearchRecord.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()


class RestaurantRepository:
    """Repository for restaurant-related database operations"""
    
    @staticmethod
    async def create_restaurant(
        session: AsyncSession,
        search_id: str,
        name: str,
        address: str,
        rating: Optional[float] = None,
        total_reviews: Optional[int] = None,
        price_level: Optional[str] = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        hours: Optional[str] = None,
        cuisine_type: Optional[str] = None,
        mealtime: Optional[str] = None,
        source_url: Optional[str] = None
    ) -> Restaurant:
        """Create a new restaurant record"""
        restaurant = Restaurant(
            search_id=search_id,
            name=name,
            address=address,
            rating=rating,
            total_reviews=total_reviews,
            price_level=price_level,
            phone=phone,
            website=website,
            hours=hours,
            cuisine_type=cuisine_type,
            mealtime=mealtime,
            source_url=source_url
        )
        session.add(restaurant)
        await session.flush()
        return restaurant
    
    @staticmethod
    async def get_restaurants_by_search(session: AsyncSession, search_id: str) -> List[Restaurant]:
        """Get all restaurants for a search"""
        result = await session.execute(
            select(Restaurant).where(Restaurant.search_id == search_id)
        )
        return result.scalars().all()


class DishRepository:
    """Repository for dish-related database operations"""
    
    @staticmethod
    async def create_dish(
        session: AsyncSession,
        restaurant_id: int,
        name: str,
        mention_count: int = 1,
        sentiment_score: float = 0.5,
        sample_review: Optional[str] = None
    ) -> Dish:
        """Create a new dish record"""
        dish = Dish(
            restaurant_id=restaurant_id,
            name=name,
            mention_count=mention_count,
            sentiment_score=sentiment_score,
            sample_review=sample_review
        )
        session.add(dish)
        await session.flush()
        return dish
    
    @staticmethod
    async def get_dishes_by_restaurant(session: AsyncSession, restaurant_id: int) -> List[Dish]:
        """Get all dishes for a restaurant"""
        result = await session.execute(
            select(Dish).where(Dish.restaurant_id == restaurant_id)
        )
        return result.scalars().all()


class CacheRepository:
    """Repository for cache-related database operations"""
    
    @staticmethod
    def generate_cache_key(location: str, cuisine: str, mealtime: str) -> str:
        """Generate a cache key from search parameters"""
        import hashlib
        key_string = f"{location.lower().strip()}:{cuisine.lower().strip()}:{mealtime.lower().strip()}"
        return hashlib.sha256(key_string.encode()).hexdigest()[:64]
    
    @staticmethod
    async def get_cached_search(
        session: AsyncSession, 
        location: str, 
        cuisine: str, 
        mealtime: str
    ) -> Optional[str]:
        """Get cached search_id if exists and not expired"""
        cache_key = CacheRepository.generate_cache_key(location, cuisine, mealtime)
        
        result = await session.execute(
            select(CacheEntry)
            .where(CacheEntry.cache_key == cache_key)
            .where(CacheEntry.expires_at > datetime.utcnow())
        )
        entry = result.scalar_one_or_none()
        
        if entry:
            return entry.search_id
        return None
    
    @staticmethod
    async def set_cache(
        session: AsyncSession,
        location: str,
        cuisine: str,
        mealtime: str,
        search_id: str,
        ttl_hours: int = 1
    ):
        """Set cache entry for search results"""
        from datetime import timedelta
        
        cache_key = CacheRepository.generate_cache_key(location, cuisine, mealtime)
        expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)
        
        # Check if entry exists
        result = await session.execute(
            select(CacheEntry).where(CacheEntry.cache_key == cache_key)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.search_id = search_id
            existing.expires_at = expires_at
        else:
            entry = CacheEntry(
                cache_key=cache_key,
                search_id=search_id,
                expires_at=expires_at
            )
            session.add(entry)
        
        await session.commit()
