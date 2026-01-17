# 🍽️ Dish Finder

A mobile-first Progressive Web App (PWA) for discovering top restaurants and their best dishes based on mealtime, location, and cuisine preferences. Features offline support with intelligent caching.

## 🎯 Features

- **Smart Search**: Find restaurants by mealtime (breakfast/lunch/dinner/late night), location (GPS or zip code), and cuisine type
- **Voice Input**: Speak your cuisine preference using Web Speech API
- **Top Dishes Analysis**: AI-powered analysis of reviews to identify each restaurant's top 3 rated dishes
- **Offline Support**: Full PWA with IndexedDB caching and Service Worker for offline access
- **Mobile-First Design**: Responsive UI built with React and Tailwind CSS
- **Fast Performance**: Server-side caching with SQLite for instant repeat searches

## 🏗️ Architecture

```
dish-finder/
├── client/                    # React Frontend (Vite + Tailwind)
│   ├── public/
│   │   ├── sw.js             # Service Worker
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── BottomNav.jsx
│   │   │   ├── CuisineInput.jsx
│   │   │   ├── DishBadge.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── LocationInput.jsx
│   │   │   ├── MealtimeSelector.jsx
│   │   │   ├── OfflineBanner.jsx
│   │   │   ├── RestaurantCard.jsx
│   │   │   └── VoiceInput.jsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useLocation.js
│   │   │   ├── useOnlineStatus.js
│   │   │   └── useVoiceInput.js
│   │   ├── pages/            # Page components
│   │   │   ├── ResultsPage.jsx
│   │   │   ├── RestaurantPage.jsx
│   │   │   └── SearchPage.jsx
│   │   ├── utils/            # Utility functions
│   │   │   ├── api.js
│   │   │   ├── indexedDB.js
│   │   │   └── serviceWorker.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
├── server/                    # Express Backend
│   ├── db/
│   │   └── schema.js         # SQLite schema & repositories
│   ├── routes/
│   │   ├── restaurants.js    # Restaurant API routes
│   │   └── sync.js           # Offline sync routes
│   ├── services/
│   │   ├── dishAnalyzer.js   # NLP dish extraction
│   │   └── googleMaps.js     # Google Maps API
│   └── index.js              # Server entry point
│
├── package.json              # Root package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Maps API Key with Places API enabled

### Installation

1. **Clone and install dependencies:**
```bash
cd dish-finder
npm run install:all
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your Google Maps API key
```

3. **Start development servers:**
```bash
npm run dev
```

This starts:
- Backend API at `http://localhost:3001`
- Frontend at `http://localhost:5173`

## 📡 API Routes

### Restaurant Search
```
POST /api/restaurants/search
Body: {
  mealtime: "lunch" | "dinner" | "breakfast" | "latenight",
  cuisine: "Italian",
  zipCode?: "90210",           // OR
  latitude?: 34.0522,          // GPS coords
  longitude?: -118.2437
}

Response: {
  source: "api" | "cache",
  restaurants: [{
    id, name, address, rating, price_level,
    total_ratings, phone, website, photo_reference,
    is_open_now,
    topDishes: [{ dishName, mentionCount, averageSentiment }]
  }]
}
```

### Get Restaurant Details
```
GET /api/restaurants/:id

Response: {
  ...restaurant,
  topDishes: [...],
  reviews: [...]
}
```

### Sync Status
```
GET /api/sync/status

Response: {
  status: "online" | "offline",
  pendingCount: 0,
  lastSync: "2024-01-01T00:00:00.000Z"
}
```

### Pull Cached Data for Offline
```
GET /api/sync/pull/:zipCode

Response: {
  zipCode: "90210",
  restaurants: [...],
  syncedAt: "..."
}
```

## 💾 Database Schema

### SQLite Tables

| Table | Purpose |
|-------|---------|
| `zip_locations` | Cache geocoded zip codes |
| `restaurants` | Restaurant data keyed by zip+place_id |
| `dishes` | Extracted top dishes per restaurant |
| `reviews` | Cached reviews for offline analysis |
| `search_history` | Track search patterns |
| `sync_queue` | Offline operations queue |

### IndexedDB Stores (Client-Side)

| Store | Purpose |
|-------|---------|
| `searches` | Cached search results |
| `restaurants` | Individual restaurant cache |
| `offlineQueue` | Pending offline searches |
| `recentSearches` | Recent search history |
| `preferences` | User settings |

## 🔊 Voice Input Integration

The app uses the Web Speech API for voice-to-text:

```jsx
// Usage in components
import { useVoiceInput } from '../hooks/useVoiceInput';

function MyComponent() {
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    isSupported 
  } = useVoiceInput();
  
  // transcript updates in real-time as user speaks
}
```

**Supported features:**
- Real-time transcription
- Visual feedback during listening
- Graceful degradation if not supported
- Error handling for permission denials

## 📴 Offline Sync Logic

### Cache-First Strategy (Static Assets)
1. Check cache for asset
2. Return cached if found, fetch in background to update
3. If not cached, fetch from network and cache

### Network-First Strategy (API Calls)
1. Try network request first
2. Cache successful responses
3. Fall back to cached response if offline
4. Queue failed requests for later sync

### Background Sync
```javascript
// When coming back online
window.addEventListener('online', async () => {
  // Get pending searches from IndexedDB
  const pending = await getPendingOfflineSearches();
  
  // Sync each to server
  for (const search of pending) {
    await fetch('/api/sync/push', { ... });
  }
  
  // Clear queue
  await clearOfflineQueue();
});
```

## 🎨 UI/UX Features

- **Mobile-First**: Touch-optimized with safe area handling
- **Animations**: Smooth transitions and micro-interactions
- **Loading States**: Skeleton loaders for perceived performance
- **Offline Indicator**: Banner when connection lost
- **Pull-to-Refresh**: Native feel on mobile
- **Voice Button**: Visual feedback during listening

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `CACHE_TTL` | Cache duration (minutes) | 60 |

### Tailwind Customization

Edit `client/tailwind.config.js` to customize:
- Primary color (default: orange-500)
- Custom animations
- Font family

## 📱 PWA Features

- **Installable**: Add to home screen
- **Offline**: Works without network
- **Fast**: Service worker caching
- **Responsive**: Mobile-first design
- **Notifications**: Push notification ready

## 🧪 Testing

```bash
# Run backend tests
npm test

# Test offline mode
# 1. Open DevTools > Network > Offline
# 2. Try searching - should use cached data
# 3. Come back online - pending searches sync
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure `GOOGLE_MAPS_API_KEY`
3. Set up SSL for service worker (required for production PWA)

## 📄 License

MIT

---

Built with ❤️ using React, Express, SQLite, and the Google Maps API
