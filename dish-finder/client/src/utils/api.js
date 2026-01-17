/**
 * API Service
 * Handles all API calls with offline fallback support
 */

import { 
  getCachedSearch, 
  cacheSearchResults, 
  cacheRestaurant,
  getCachedRestaurant,
  queueOfflineSearch,
  saveRecentSearch
} from './indexedDB';

const API_BASE = '/api/v1';

/**
 * Search for restaurants
 * Uses cache-first strategy with network fallback
 */
export async function searchRestaurants(params) {
  const { zipCode, latitude, longitude, cuisine, mealtime } = params;

  // Try to get from cache first
  const cached = await getCachedSearch(params);
  if (cached) {
    console.log('📦 Returning cached results');
    return { source: 'cache', restaurants: cached };
  }

  // If offline, queue the search and return empty
  if (!navigator.onLine) {
    await queueOfflineSearch(params);
    return { 
      source: 'offline', 
      restaurants: [],
      message: 'Search queued for when you\'re back online'
    };
  }

  try {
    // Build request body matching backend SearchRequest model
    const requestBody = {
      mealtime: mealtime,
      cuisine: cuisine,
      location: zipCode || `${latitude},${longitude}`,
      latitude: latitude || null,
      longitude: longitude || null
    };

    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache the results
    await cacheSearchResults(params, data.restaurants);
    
    // Cache individual restaurants
    for (const restaurant of data.restaurants) {
      await cacheRestaurant(restaurant);
    }

    // Save to recent searches
    await saveRecentSearch({ zipCode, cuisine, mealtime });

    return data;
  } catch (error) {
    console.error('Search failed:', error);
    
    // Try cache as fallback
    const fallback = await getCachedSearch(params);
    if (fallback) {
      return { source: 'cache-fallback', restaurants: fallback };
    }
    
    throw error;
  }
}

/**
 * Get restaurant details
 */
export async function getRestaurantDetails(id) {
  // Try cache first
  const cached = await getCachedRestaurant(id);
  if (cached && !navigator.onLine) {
    return { source: 'cache', ...cached };
  }

  if (!navigator.onLine) {
    return cached || null;
  }

  try {
    const response = await fetch(`${API_BASE}/restaurants/${id}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the restaurant
    await cacheRestaurant(data);

    return { source: 'api', ...data };
  } catch (error) {
    console.error('Failed to get restaurant details:', error);
    
    // Fallback to cache
    return cached || null;
  }
}

/**
 * Get recent search history
 */
export async function getSearchHistory() {
  if (!navigator.onLine) {
    return { source: 'offline', history: [] };
  }

  try {
    const response = await fetch(`${API_BASE}/restaurants/history/recent`);
    const data = await response.json();
    return { source: 'api', ...data };
  } catch (error) {
    return { source: 'error', history: [] };
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus() {
  if (!navigator.onLine) {
    return { status: 'offline', pendingCount: 0 };
  }

  try {
    const response = await fetch(`${API_BASE}/sync/status`);
    return response.json();
  } catch (error) {
    return { status: 'error', pendingCount: 0 };
  }
}

/**
 * Get photo URL
 */
export function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference) return null;
  return `${API_BASE}/restaurants/photo/${photoReference}?maxwidth=${maxWidth}`;
}

export default {
  searchRestaurants,
  getRestaurantDetails,
  getSearchHistory,
  getSyncStatus,
  getPhotoUrl
};
