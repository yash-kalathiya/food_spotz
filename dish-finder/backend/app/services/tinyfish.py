"""
TinyFish Scraping Service
Handles web scraping of OpenTable using TinyFish (mino.ai) API
Two-phase approach: 1) Get restaurants with popular dishes, 2) Get dishes for each restaurant
Uses WebShare proxy servers for reliable scraping
"""
import httpx
import json
import asyncio
import random
from typing import List, Optional, AsyncGenerator
from datetime import datetime
import logging

from app.config import get_settings
from app.models import RestaurantResult, DishInfo

logger = logging.getLogger(__name__)
settings = get_settings()


class TinyFishService:
    """Service to interact with TinyFish (mino.ai) API for OpenTable scraping"""
    
    def __init__(self):
        self.api_key = settings.tinyfish_api_key
        self.base_url = settings.tinyfish_base_url
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        self.proxy_list = settings.get_proxy_list()
        logger.info(f"TinyFish initialized with {len(self.proxy_list)} proxies")
    
    def _get_random_proxy(self) -> Optional[dict]:
        """Get a random proxy from the WebShare proxy list"""
        if not self.proxy_list:
            return None
        
        proxy_url = random.choice(self.proxy_list)
        # Parse proxy URL: http://username:password@host:port
        return {
            "server": proxy_url
        }
    
    def _build_proxy_config(self) -> dict:
        """Build proxy configuration for TinyFish API"""
        proxy = self._get_random_proxy()
        if proxy:
            logger.info(f"Using proxy: {proxy['server'][:30]}...")
            return {
                "enabled": True,
                "server": proxy["server"]
            }
        else:
            # Fallback to TinyFish's built-in proxy
            return {
                "enabled": True,
                "country_code": "US"
            }
    
    def _build_opentable_url(self, cuisine: str, location: str) -> str:
        """Build OpenTable search URL"""
        return "https://www.opentable.com"
    
    # ========== PHASE 1: Get Restaurants with Popular Dishes ==========
    
    def _build_restaurants_goal(self, cuisine: str, location: str, mealtime: str) -> str:
        """Build goal to find top 3 restaurants with their popular dishes"""
        return f"""Go to opentable.com and search for "{cuisine} restaurants" near "{location}" for {mealtime}.

For each of the top 3 restaurants in the search results:
1. Click on the restaurant to view its full page
2. Get: Restaurant name, full address, rating (out of 5), number of reviews, price range ($, $$, $$$, $$$$)
3. Find 3 popular dishes by checking:
   - "Menu" section for featured/highlighted items
   - "Photos" section for dish images with names
   - Reviews that mention specific dishes positively

Return JSON in this exact format:
{{
    "restaurants": [
        {{
            "name": "Restaurant Name",
            "address": "Full Address",
            "rating": 4.5,
            "review_count": 500,
            "price_level": "$$",
            "popular_dishes": ["Dish 1", "Dish 2", "Dish 3"]
        }}
    ]
}}

Return exactly 3 top-rated {cuisine} restaurants from OpenTable. For each restaurant, include exactly 3 popular dishes that diners recommend. Only return actual dish names, not descriptions."""
    
    # ========== PHASE 2: Get Dishes for a Restaurant (Fallback) ==========
    
    def _build_dishes_goal(self, restaurant_name: str, location: str) -> str:
        """Build goal to find popular dishes for a specific restaurant (fallback method)"""
        return f"""Go to opentable.com and search for "{restaurant_name}" near "{location}".
Click on the restaurant page to view details.

Look for popular dishes or menu items on the restaurant page. Check:
1. "Menu" section - look for highlighted or featured dishes
2. "Photos" section - look at dish photos and their names
3. Reviews section - find dishes that are frequently mentioned positively

Extract exactly 3 popular dish names that diners recommend.

Return JSON in this exact format:
{{
    "restaurant_name": "{restaurant_name}",
    "popular_dishes": ["Dish 1", "Dish 2", "Dish 3"]
}}

Return exactly 3 popular dish names. Only return actual dish names from the menu, not descriptions."""
    
    # ========== API Call Helper ==========
    
    async def _call_tinyfish_sse(self, url: str, goal: str) -> dict:
        """Make a TinyFish SSE API call and wait for result"""
        payload = {
            "url": url,
            "goal": goal,
            "browser_profile": "stealth",
            "proxy_config": self._build_proxy_config()
        }
        
        logger.info(f"TinyFish request: {goal[:100]}...")
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/automation/run-sse",
                headers=self.headers,
                json=payload
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"TinyFish API error: {response.status_code} - {error_text}")
                    raise Exception(f"TinyFish API error: {response.status_code}")
                
                final_result = None
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            
                            if data.get("type") == "PROGRESS":
                                logger.info(f"Progress: {data.get('purpose', 'Working...')}")
                            elif data.get("type") == "COMPLETE":
                                logger.info(f"Completed: {data.get('status')}")
                                final_result = data.get("resultJson", {})
                            elif data.get("type") == "ERROR":
                                raise Exception(f"TinyFish error: {data.get('message')}")
                                
                        except json.JSONDecodeError:
                            continue
                
                if not final_result:
                    raise Exception("No result from TinyFish")
                
                return final_result
    
    # ========== Main Scraping Methods ==========
    
    async def scrape_restaurants_only(self, cuisine: str, location: str, mealtime: str) -> List[dict]:
        """Get list of restaurants with their popular dishes in a single call"""
        logger.info(f"Finding top 3 {cuisine} restaurants with dishes near {location}")
        
        goal = self._build_restaurants_goal(cuisine, location, mealtime)
        
        result = await self._call_tinyfish_sse(self._build_opentable_url(cuisine, location), goal)
        
        restaurants = result.get("restaurants", [])
        logger.info(f"Found {len(restaurants)} restaurants with dishes")
        
        return restaurants[:3]
    
    async def scrape_dishes_for_restaurant(self, restaurant_name: str, location: str) -> List[str]:
        """Fallback: Get popular dishes for a single restaurant if not included in initial scrape"""
        logger.info(f"Fetching dishes for '{restaurant_name}' (fallback)")
        
        goal = self._build_dishes_goal(restaurant_name, location)
        
        try:
            result = await self._call_tinyfish_sse(self._build_opentable_url("", location), goal)
            dishes = result.get("popular_dishes", [])
            logger.info(f"Found {len(dishes)} dishes for {restaurant_name}")
            return dishes[:3]
        except Exception as e:
            logger.warning(f"Failed to get dishes for {restaurant_name}: {e}")
            return []
    
    async def scrape_restaurants(self, cuisine: str, location: str, mealtime: str) -> dict:
        """
        Full scrape: Get restaurants with their popular dishes
        Now done in a single API call for efficiency
        """
        # Get restaurants with dishes in one call
        restaurants = await self.scrape_restaurants_only(cuisine, location, mealtime)
        
        if not restaurants:
            return {"restaurants": []}
        
        # Check if any restaurants are missing dishes and fetch them as fallback
        for restaurant in restaurants:
            if not restaurant.get("popular_dishes"):
                logger.info(f"Restaurant {restaurant.get('name')} missing dishes, fetching...")
                dishes = await self.scrape_dishes_for_restaurant(restaurant.get("name", ""), location)
                restaurant["popular_dishes"] = dishes
        
        return {"restaurants": restaurants}
    
    async def scrape_restaurants_sse(
        self, 
        cuisine: str, 
        location: str, 
        mealtime: str
    ) -> AsyncGenerator[dict, None]:
        """
        Scrape restaurants with progress updates (SSE streaming)
        Now fetches restaurants with dishes in a single efficient call
        """
        yield {"type": "PROGRESS", "purpose": "Searching for top restaurants with popular dishes on OpenTable..."}
        
        try:
            # Get restaurants with their popular dishes in one call
            restaurants = await self.scrape_restaurants_only(cuisine, location, mealtime)
            
            if not restaurants:
                yield {"type": "ERROR", "message": "No restaurants found"}
                return
            
            yield {
                "type": "PROGRESS", 
                "purpose": f"Found {len(restaurants)} restaurants with their popular dishes!"
            }
            
            # Check for any missing dishes and fetch as fallback
            for i, restaurant in enumerate(restaurants):
                if not restaurant.get("popular_dishes"):
                    name = restaurant.get("name", "Unknown")
                    yield {
                        "type": "PROGRESS",
                        "purpose": f"Fetching dishes for {name} ({i+1}/{len(restaurants)})..."
                    }
                    dishes = await self.scrape_dishes_for_restaurant(name, location)
                    restaurant["popular_dishes"] = dishes
            
            yield {"type": "PROGRESS", "purpose": "Processing results..."}
            
            yield {
                "type": "COMPLETE",
                "status": "COMPLETED",
                "resultJson": {"restaurants": restaurants}
            }
            
        except Exception as e:
            logger.error(f"Scrape failed: {e}")
            yield {"type": "ERROR", "message": str(e)}
    
    def parse_scrape_result(
        self, 
        result_json: dict, 
        cuisine: str, 
        mealtime: str,
        source_url: str
    ) -> List[RestaurantResult]:
        """Parse TinyFish result into structured RestaurantResult objects"""
        restaurants = []
        
        raw_restaurants = result_json.get("restaurants", [])
        if not raw_restaurants and "output" in result_json:
            raw_restaurants = result_json["output"].get("restaurants", [])
        
        logger.info(f"Parsing {len(raw_restaurants)} restaurants")
        
        for r in raw_restaurants[:settings.max_restaurants]:
            try:
                # Parse dishes
                top_dishes = []
                for dish_name in r.get("popular_dishes", [])[:settings.max_dishes_per_restaurant]:
                    if isinstance(dish_name, str):
                        top_dishes.append(DishInfo(
                            name=dish_name,
                            mention_count=1,
                            sentiment_score=0.8,
                            sample_review=None
                        ))
                    elif isinstance(dish_name, dict):
                        top_dishes.append(DishInfo(
                            name=dish_name.get("name", "Unknown"),
                            mention_count=1,
                            sentiment_score=0.8,
                            sample_review=None
                        ))
                
                logger.info(f"Restaurant {r.get('name')}: {len(top_dishes)} dishes")
                
                restaurant = RestaurantResult(
                    name=r.get("name", "Unknown Restaurant"),
                    address=r.get("address", "Address not available"),
                    rating=r.get("rating"),
                    total_reviews=r.get("review_count") or r.get("total_reviews"),
                    price_level=r.get("price_level"),
                    phone=r.get("phone"),
                    website=r.get("website"),
                    hours=r.get("hours"),
                    top_dishes=top_dishes,
                    cuisine_type=cuisine,
                    mealtime=mealtime,
                    source_url=source_url
                )
                restaurants.append(restaurant)
            except Exception as e:
                logger.warning(f"Failed to parse restaurant: {e}")
                continue
        
        return restaurants


# Singleton instance
tinyfish_service = TinyFishService()
