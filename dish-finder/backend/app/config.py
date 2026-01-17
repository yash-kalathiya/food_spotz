"""
Pydantic Settings for Dish Finder Backend
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment"""
    
    # TinyFish (mino.ai) API Configuration
    tinyfish_api_key: str = ""
    tinyfish_base_url: str = "https://mino.ai/v1"
    
    # WebShare Proxy Configuration
    proxies: str = ""  # Comma-separated list of proxy URLs
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./data/dishfinder.db"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Scraping defaults
    default_radius: int = 5000  # meters
    max_restaurants: int = 3
    max_dishes_per_restaurant: int = 3
    
    def get_proxy_list(self) -> List[str]:
        """Parse comma-separated proxies into a list"""
        if not self.proxies:
            return []
        return [p.strip() for p in self.proxies.split(",") if p.strip()]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()
