/**
 * Sync API Routes
 * Handles offline sync operations
 */

import express from 'express';
import { SyncQueueRepo, RestaurantRepo, DishRepo } from '../db/schema.js';

const router = express.Router();

/**
 * GET /api/sync/status
 * Get sync status and pending operations count
 */
router.get('/status', (req, res) => {
  try {
    const pending = SyncQueueRepo.getPending();
    res.json({
      pendingCount: pending.length,
      lastSync: new Date().toISOString(),
      status: 'online'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sync/push
 * Push offline operations to server
 */
router.post('/push', (req, res) => {
  try {
    const { operations } = req.body;

    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({ error: 'Invalid operations array' });
    }

    const results = [];
    
    for (const op of operations) {
      try {
        SyncQueueRepo.add({
          operation: op.type,
          data: JSON.stringify(op.data)
        });
        results.push({ id: op.id, status: 'synced' });
      } catch (err) {
        results.push({ id: op.id, status: 'failed', error: err.message });
      }
    }

    res.json({ results });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sync/pull/:zipCode
 * Pull cached data for offline use
 */
router.get('/pull/:zipCode', (req, res) => {
  try {
    const { zipCode } = req.params;

    // Get all restaurants for this zip code
    const restaurants = RestaurantRepo.getByZip(zipCode);
    
    // Get dishes for each restaurant
    const data = restaurants.map(restaurant => {
      const dishes = DishRepo.getByRestaurant(restaurant.id);
      return { ...restaurant, topDishes: dishes };
    });

    res.json({
      zipCode,
      restaurants: data,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sync/clear
 * Clear synced operations
 */
router.post('/clear', (req, res) => {
  try {
    SyncQueueRepo.clearSynced();
    res.json({ status: 'cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
