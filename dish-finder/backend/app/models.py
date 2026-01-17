"""
Pydantic Models for API Request/Response
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MealTime(str, Enum):
    """Supported meal times"""
    BREAKFAST = "breakfast"
    BRUNCH = "brunch"
    LUNCH = "lunch"
    DINNER = "dinner"
    LATE_NIGHT = "late_night"


class SearchRequest(BaseModel):
    """Request model for restaurant search"""
    mealtime: MealTime = Field(..., description="Time of day for the meal")
    cuisine: str = Field(..., min_length=2, max_length=100, description="Type of cuisine (e.g., Italian, Mexican)")
    location: str = Field(..., min_length=2, description="Zip code or location name")
    latitude: Optional[float] = Field(None, description="Optional GPS latitude")
    longitude: Optional[float] = Field(None, description="Optional GPS longitude")
    
    class Config:
        json_schema_extra = {
            "example": {
                "mealtime": "dinner",
                "cuisine": "Italian",
                "location": "94105"
            }
        }


class DishInfo(BaseModel):
    """Top dish information from reviews"""
    name: str
    mention_count: int = 1
    sentiment_score: float = Field(default=0.5, ge=0.0, le=1.0)
    sample_review: Optional[str] = None


class RestaurantResult(BaseModel):
    """Restaurant information from scraping"""
    name: str
    address: str
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    price_level: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    hours: Optional[str] = None
    top_dishes: List[DishInfo] = []
    cuisine_type: str
    mealtime: str
    source_url: Optional[str] = None


class SearchResponse(BaseModel):
    """Response model for restaurant search"""
    success: bool
    source: str = Field(..., description="'cache' or 'scrape'")
    search_id: str
    query: dict
    restaurants: List[RestaurantResult]
    scraped_at: datetime
    message: Optional[str] = None


class SearchHistoryItem(BaseModel):
    """Search history entry"""
    id: int
    mealtime: str
    cuisine: str
    location: str
    restaurant_count: int
    searched_at: datetime


class TinyFishProgress(BaseModel):
    """Progress event from TinyFish SSE"""
    type: str
    run_id: Optional[str] = None
    purpose: Optional[str] = None
    status: Optional[str] = None
    result_json: Optional[dict] = None
    streaming_url: Optional[str] = None
    timestamp: Optional[str] = None
