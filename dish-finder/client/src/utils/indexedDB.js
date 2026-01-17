import { openDB } from 'idb';

const DB_NAME = 'dish-finder-db';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB for client-side caching
 */
export async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store for cached restaurant searches
        if (!db.objectStoreNames.contains('searches')) {
          const searchStore = db.createObjectStore('searches', { keyPath: 'key' });
          searchStore.createIndex('zipCode', 'zipCode');
          searchStore.createIndex('timestamp', 'timestamp');
        }

        // Store for individual restaurants
        if (!db.objectStoreNames.contains('restaurants')) {
          const restaurantStore = db.createObjectStore('restaurants', { keyPath: 'id' });
          restaurantStore.createIndex('zipCode', 'zipCode');
        }

        // Store for offline search queue
        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
        }

        // Store for user preferences
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }

        // Store for recent searches
        if (!db.objectStoreNames.contains('recentSearches')) {
          const recentStore = db.createObjectStore('recentSearches', { keyPath: 'id', autoIncrement: true });
          recentStore.createIndex('timestamp', 'timestamp');
        }
      }
    });
    
    console.log('✅ IndexedDB initialized');
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }
}

/**
 * Get database instance
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION);
}

/**
 * Cache search results
 */
export async function cacheSearchResults(searchParams, results) {
  const db = await getDB();
  const key = generateSearchKey(searchParams);
  
  await db.put('searches', {
    key,
    ...searchParams,
    results,
    timestamp: Date.now()
  });
}

/**
 * Get cached search results
 */
export async function getCachedSearch(searchParams) {
  const db = await getDB();
  const key = generateSearchKey(searchParams);
  const cached = await db.get('searches', key);
  
  if (cached) {
    // Check if cache is still valid (1 hour)
    const isValid = Date.now() - cached.timestamp < 60 * 60 * 1000;
    if (isValid) {
      return cached.results;
    }
  }
  
  return null;
}

/**
 * Cache individual restaurant
 */
export async function cacheRestaurant(restaurant) {
  const db = await getDB();
  await db.put('restaurants', {
    ...restaurant,
    cachedAt: Date.now()
  });
}

/**
 * Get cached restaurant
 */
export async function getCachedRestaurant(id) {
  const db = await getDB();
  return db.get('restaurants', id);
}

/**
 * Get all cached restaurants for a zip code
 */
export async function getCachedRestaurantsByZip(zipCode) {
  const db = await getDB();
  return db.getAllFromIndex('restaurants', 'zipCode', zipCode);
}

/**
 * Add search to offline queue
 */
export async function queueOfflineSearch(searchParams) {
  const db = await getDB();
  await db.add('offlineQueue', {
    ...searchParams,
    timestamp: Date.now()
  });
}

/**
 * Get pending offline searches
 */
export async function getPendingOfflineSearches() {
  const db = await getDB();
  return db.getAll('offlineQueue');
}

/**
 * Clear offline queue
 */
export async function clearOfflineQueue() {
  const db = await getDB();
  const tx = db.transaction('offlineQueue', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

/**
 * Save recent search
 */
export async function saveRecentSearch(searchParams) {
  const db = await getDB();
  
  // Keep only last 10 searches
  const allSearches = await db.getAllFromIndex('recentSearches', 'timestamp');
  if (allSearches.length >= 10) {
    await db.delete('recentSearches', allSearches[0].id);
  }
  
  await db.add('recentSearches', {
    ...searchParams,
    timestamp: Date.now()
  });
}

/**
 * Get recent searches
 */
export async function getRecentSearches() {
  const db = await getDB();
  const searches = await db.getAllFromIndex('recentSearches', 'timestamp');
  return searches.reverse().slice(0, 5);
}

/**
 * Save user preference
 */
export async function savePreference(key, value) {
  const db = await getDB();
  await db.put('preferences', { key, value });
}

/**
 * Get user preference
 */
export async function getPreference(key) {
  const db = await getDB();
  const pref = await db.get('preferences', key);
  return pref?.value;
}

/**
 * Clear all cached data
 */
export async function clearAllCache() {
  const db = await getDB();
  const tx = db.transaction(['searches', 'restaurants'], 'readwrite');
  await tx.objectStore('searches').clear();
  await tx.objectStore('restaurants').clear();
  await tx.done;
}

/**
 * Generate unique key for search
 */
function generateSearchKey(params) {
  const { zipCode, latitude, longitude, cuisine, mealtime } = params;
  const locationKey = zipCode || `${latitude?.toFixed(2)}_${longitude?.toFixed(2)}`;
  return `${locationKey}_${cuisine}_${mealtime}`;
}

export default {
  initDB,
  cacheSearchResults,
  getCachedSearch,
  cacheRestaurant,
  getCachedRestaurant,
  getCachedRestaurantsByZip,
  queueOfflineSearch,
  getPendingOfflineSearches,
  clearOfflineQueue,
  saveRecentSearch,
  getRecentSearches,
  savePreference,
  getPreference,
  clearAllCache
};
