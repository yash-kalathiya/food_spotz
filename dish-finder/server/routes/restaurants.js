/**
 * Restaurant API Routes
 * Handles search, caching, and restaurant data retrieval
 */

import express from 'express';
import {
  RestaurantRepo,
  DishRepo,
  ReviewRepo,
  ZipLocationRepo,
  SearchHistoryRepo
} from '../db/schema.js';
import googleMaps from '../services/googleMaps.js';
import dishAnalyzer from '../services/dishAnalyzer.js';

const router = express.Router();

/**
 * POST /api/restaurants/search
 * Search for restaurants by location and cuisine
 * Supports both GPS coordinates and zip code
 */
router.post('/search', async (req, res) => {
  try {
    const { mealtime, cuisine, zipCode, latitude, longitude } = req.body;

    // Validate required fields
    if (!mealtime || !cuisine) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['mealtime', 'cuisine', 'zipCode or latitude/longitude']
      });
    }

    let coords = { latitude, longitude };
    let zip = zipCode;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // If using GPS coordinates, we still need a zip for caching
    // In production, you'd reverse geocode to get the zip
    if (!zipCode && latitude && longitude) {
      zip = `${Math.round(latitude * 100)}_${Math.round(longitude * 100)}`; // Pseudo zip for GPS
    }

    // Try to get from cache first
    const cacheCheck = RestaurantRepo.isCacheFresh(zip, cuisine.toLowerCase(), mealtime);
    
    if (cacheCheck.count >= 3) {
      console.log(`📦 Serving from cache: ${zip}, ${cuisine}, ${mealtime}`);
      
      const cachedRestaurants = RestaurantRepo.getByZipAndCuisine(
        zip,
        cuisine.toLowerCase(),
        mealtime
      );

      // Get dishes for each restaurant
      const results = cachedRestaurants.map(restaurant => {
        const dishes = DishRepo.getByRestaurant(restaurant.id);
        return {
          ...restaurant,
          topDishes: dishes
        };
      });

      // Update search history
      SearchHistoryRepo.upsert({
        zip_code: zip,
        cuisine_type: cuisine.toLowerCase(),
        mealtime
      });

      return res.json({
        source: 'cache',
        restaurants: results
      });
    }

    // If we have a zip code, geocode it
    if (zipCode && (!latitude || !longitude)) {
      console.log(`🌍 Geocoding zip code: ${zipCode}`);
      const location = await googleMaps.geocodeZipCode(zipCode, apiKey);
      coords = location;

      // Cache the zip location
      ZipLocationRepo.upsert({
        zip_code: zipCode,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        state: location.state
      });
    }

    // Search Google Maps for restaurants
    console.log(`🔍 Searching Google Maps: ${cuisine} for ${mealtime}`);
    const googleResults = await googleMaps.searchRestaurants({
      latitude: coords.latitude,
      longitude: coords.longitude,
      cuisine,
      mealtime,
      apiKey
    });

    // Get details and analyze dishes for each restaurant
    const results = [];
    
    for (const place of googleResults) {
      // Get detailed place info including reviews
      const details = await googleMaps.getPlaceDetails(place.place_id, apiKey);
      
      // Analyze reviews for top dishes
      const topDishes = dishAnalyzer.getTopDishes(details.reviews || []);
      
      const restaurantId = `${zip}_${place.place_id}`;
      
      // Cache restaurant
      RestaurantRepo.upsert({
        id: restaurantId,
        place_id: place.place_id,
        name: details.name,
        address: details.formatted_address,
        zip_code: zip,
        cuisine_type: cuisine.toLowerCase(),
        mealtime,
        rating: details.rating,
        price_level: details.price_level || 0,
        total_ratings: details.user_ratings_total,
        latitude: details.geometry?.location?.lat,
        longitude: details.geometry?.location?.lng,
        photo_reference: details.photos?.[0]?.photo_reference || null,
        is_open_now: details.opening_hours?.open_now ? 1 : 0,
        phone: details.formatted_phone_number || null,
        website: details.website || null
      });

      // Cache reviews
      if (details.reviews) {
        for (const review of details.reviews) {
          ReviewRepo.insert({
            restaurant_id: restaurantId,
            author_name: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.time
          });
        }
      }

      // Cache dishes
      for (const dish of topDishes) {
        DishRepo.upsert({
          restaurant_id: restaurantId,
          dish_name: dish.dishName,
          mention_count: dish.mentionCount,
          average_sentiment: dish.averageSentiment,
          sample_review: dish.sampleReview
        });
      }

      results.push({
        id: restaurantId,
        place_id: place.place_id,
        name: details.name,
        address: details.formatted_address,
        rating: details.rating,
        price_level: details.price_level,
        total_ratings: details.user_ratings_total,
        phone: details.formatted_phone_number,
        website: details.website,
        photo_reference: details.photos?.[0]?.photo_reference,
        is_open_now: details.opening_hours?.open_now,
        topDishes
      });
    }

    // Update search history
    SearchHistoryRepo.upsert({
      zip_code: zip,
      cuisine_type: cuisine.toLowerCase(),
      mealtime
    });

    res.json({
      source: 'api',
      restaurants: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search restaurants',
      message: error.message
    });
  }
});

/**
 * GET /api/restaurants/:id
 * Get restaurant details by ID (from cache)
 */
router.get('/:id', (req, res) => {
  try {
    const restaurant = RestaurantRepo.getById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const dishes = DishRepo.getByRestaurant(req.params.id);
    const reviews = ReviewRepo.getByRestaurant(req.params.id);

    res.json({
      ...restaurant,
      topDishes: dishes,
      reviews
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/restaurants/cached/:zipCode
 * Get all cached restaurants for a zip code
 */
router.get('/cached/:zipCode', (req, res) => {
  try {
    const restaurants = RestaurantRepo.getByZip(req.params.zipCode);
    
    const results = restaurants.map(restaurant => {
      const dishes = DishRepo.getByRestaurant(restaurant.id);
      return { ...restaurant, topDishes: dishes };
    });

    res.json({ restaurants: results });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/restaurants/history/recent
 * Get recent search history
 */
router.get('/history/recent', (req, res) => {
  try {
    const history = SearchHistoryRepo.getRecent();
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/restaurants/photo/:reference
 * Proxy photo requests to avoid exposing API key
 */
router.get('/photo/:reference', async (req, res) => {
  try {
    const photoUrl = googleMaps.getPhotoUrl(
      req.params.reference,
      process.env.GOOGLE_MAPS_API_KEY,
      req.query.maxwidth || 400
    );

    if (!photoUrl) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Redirect to Google's photo URL
    res.redirect(photoUrl);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
