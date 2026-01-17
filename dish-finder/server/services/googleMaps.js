/**
 * Google Maps API Service
 * Handles all interactions with Google Maps Places API
 */

import axios from 'axios';

const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search for restaurants using Google Places API
 */
export async function searchRestaurants(params) {
  const { latitude, longitude, cuisine, mealtime, apiKey } = params;

  // Build search query based on mealtime and cuisine
  const mealtimeKeywords = {
    breakfast: 'breakfast brunch',
    lunch: 'lunch',
    dinner: 'dinner',
    latenight: 'late night food'
  };

  const keyword = `${cuisine} ${mealtimeKeywords[mealtime] || ''} restaurant`;

  try {
    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/nearbysearch/json`, {
      params: {
        location: `${latitude},${longitude}`,
        radius: 5000, // 5km radius
        type: 'restaurant',
        keyword: keyword,
        key: apiKey,
        opennow: true // Only show currently open restaurants
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    // Return top 3 results sorted by rating
    const restaurants = response.data.results || [];
    return restaurants
      .sort((a, b) => {
        // Sort by rating first, then by number of reviews
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.user_ratings_total - a.user_ratings_total;
      })
      .slice(0, 3);
  } catch (error) {
    console.error('Error searching restaurants:', error.message);
    throw error;
  }
}

/**
 * Get detailed place information including reviews
 */
export async function getPlaceDetails(placeId, apiKey) {
  try {
    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,website,rating,reviews,price_level,user_ratings_total,opening_hours,photos,geometry',
        key: apiKey
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    console.error('Error getting place details:', error.message);
    throw error;
  }
}

/**
 * Geocode a zip code to coordinates
 */
export async function geocodeZipCode(zipCode, apiKey) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: zipCode,
        key: apiKey
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding error: ${response.data.status}`);
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    // Extract city and state from address components
    let city = '', state = '';
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      city,
      state
    };
  } catch (error) {
    console.error('Error geocoding zip code:', error.message);
    throw error;
  }
}

/**
 * Get photo URL from photo reference
 */
export function getPhotoUrl(photoReference, apiKey, maxWidth = 400) {
  if (!photoReference) return null;
  return `${GOOGLE_MAPS_BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

export default {
  searchRestaurants,
  getPlaceDetails,
  geocodeZipCode,
  getPhotoUrl
};
