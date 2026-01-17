"""
Dish Finder Backend - FastAPI Application
Web scraping service using TinyFish AI for Google Maps restaurant discovery
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import get_settings
from app.database import init_database
from app.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("🚀 Starting Dish Finder Backend...")
    await init_database()
    logger.info("✅ Application started successfully")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down Dish Finder Backend...")


# Create FastAPI app
app = FastAPI(
    title="Dish Finder API",
    description="""
    🍽️ **Dish Finder Backend API**
    
    A web scraping service that uses TinyFish AI to search Google Maps for restaurants
    based on meal time, cuisine type, and location.
    
    ## Features
    
    * **Smart Search** - Search restaurants by cuisine, location, and meal time
    * **AI-Powered Scraping** - Uses TinyFish AI to extract structured data from Google Maps
    * **Top Dishes** - Automatically identifies most mentioned dishes from reviews
    * **Caching** - Results are cached to reduce API calls
    * **Real-time Streaming** - SSE endpoint for progress updates
    
    ## Usage
    
    1. Send a POST request to `/api/v1/search` with mealtime, cuisine, and location
    2. Receive structured restaurant data with top dishes
    3. Use `/api/v1/search/stream` for real-time progress updates
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Dish Finder API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
