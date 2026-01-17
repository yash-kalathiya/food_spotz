# Dish Finder Python Backend

A FastAPI backend that uses TinyFish AI to scrape Google Maps for restaurant discovery.

## Features

- 🔍 **Smart Search**: Search restaurants by cuisine, location (zip/city), and meal time
- 🤖 **AI-Powered Scraping**: Uses TinyFish (mino.ai) to extract structured data from Google Maps
- 🍕 **Top Dishes**: Automatically identifies most mentioned dishes from reviews
- 💾 **Caching**: Results cached in SQLite for instant future access
- 📡 **Real-time Streaming**: SSE endpoint for live progress updates

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your TinyFish API key from https://mino.ai/api-keys
```

### 4. Run the Server

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python directly
python -m app.main
```

## API Endpoints

### POST `/api/v1/search`
Search for restaurants (blocking, returns final result)

```json
{
  "mealtime": "dinner",
  "cuisine": "Italian",
  "location": "94105"
}
```

### POST `/api/v1/search/stream`
Search with real-time progress streaming (SSE)

### GET `/api/v1/search/{search_id}`
Retrieve previous search results

### GET `/api/v1/history`
Get recent search history

### GET `/api/v1/health`
Health check endpoint

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Schema

- **search_records**: Search queries and metadata
- **restaurants**: Restaurant information from scraping
- **dishes**: Top dishes extracted from reviews
- **cache_entries**: Cache for quick repeated searches

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TINYFISH_API_KEY` | Your TinyFish API key | Required |
| `TINYFISH_BASE_URL` | TinyFish API URL | `https://mino.ai/v1` |
| `DATABASE_URL` | SQLite database path | `sqlite+aiosqlite:///./data/dishfinder.db` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Enable debug mode | `true` |
