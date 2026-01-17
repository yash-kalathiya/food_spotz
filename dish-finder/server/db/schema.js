/**
 * Database Schema for Dish Finder
 * Using sql.js (pure JavaScript SQLite) for Node.js v25+ compatibility
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/dishfinder.db');

let db = null;
let SQL = null;

/**
 * Initialize sql.js and database
 */
export async function initializeDatabase() {
  // Initialize SQL.js
  SQL = await initSqlJs();
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS zip_locations (
      zip_code TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      city TEXT,
      state TEXT,
      cached_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      place_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      zip_code TEXT NOT NULL,
      cuisine_type TEXT,
      mealtime TEXT,
      rating REAL,
      price_level INTEGER,
      total_ratings INTEGER,
      latitude REAL,
      longitude REAL,
      photo_reference TEXT,
      is_open_now INTEGER,
      phone TEXT,
      website TEXT,
      cached_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_restaurants_zip_cuisine 
    ON restaurants(zip_code, cuisine_type, mealtime)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id TEXT NOT NULL,
      dish_name TEXT NOT NULL,
      mention_count INTEGER DEFAULT 1,
      average_sentiment REAL DEFAULT 0.5,
      sample_review TEXT,
      cached_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(restaurant_id, dish_name)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_dishes_restaurant 
    ON dishes(restaurant_id)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id TEXT NOT NULL,
      author_name TEXT,
      rating INTEGER,
      text TEXT,
      time INTEGER,
      cached_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zip_code TEXT NOT NULL,
      cuisine_type TEXT,
      mealtime TEXT,
      search_count INTEGER DEFAULT 1,
      last_searched INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(zip_code, cuisine_type, mealtime)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      synced INTEGER DEFAULT 0
    )
  `);

  // Save database
  saveDatabase();
  
  console.log('✅ Database schema initialized');
}

/**
 * Save database to file
 */
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Get database instance
 */
export function getDb() {
  return db;
}

/**
 * Repository functions for data access
 */
export const ZipLocationRepo = {
  upsert(data) {
    db.run(`
      INSERT INTO zip_locations (zip_code, latitude, longitude, city, state, cached_at)
      VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(zip_code) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        city = excluded.city,
        state = excluded.state,
        cached_at = strftime('%s', 'now')
    `, [data.zip_code, data.latitude, data.longitude, data.city, data.state]);
    saveDatabase();
  },

  getByZip(zipCode) {
    const stmt = db.prepare('SELECT * FROM zip_locations WHERE zip_code = ?');
    stmt.bind([zipCode]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },
  
  getAll() {
    const results = [];
    const stmt = db.prepare('SELECT * FROM zip_locations ORDER BY cached_at DESC');
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
};

export const RestaurantRepo = {
  upsert(data) {
    db.run(`
      INSERT INTO restaurants (
        id, place_id, name, address, zip_code, cuisine_type, mealtime,
        rating, price_level, total_ratings, latitude, longitude,
        photo_reference, is_open_now, phone, website, cached_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(place_id) DO UPDATE SET
        name = excluded.name,
        address = excluded.address,
        rating = excluded.rating,
        price_level = excluded.price_level,
        total_ratings = excluded.total_ratings,
        is_open_now = excluded.is_open_now,
        phone = excluded.phone,
        website = excluded.website,
        cached_at = strftime('%s', 'now')
    `, [
      data.id, data.place_id, data.name, data.address, data.zip_code,
      data.cuisine_type, data.mealtime, data.rating, data.price_level,
      data.total_ratings, data.latitude, data.longitude, data.photo_reference,
      data.is_open_now, data.phone, data.website
    ]);
    saveDatabase();
  },

  getByZipAndCuisine(zipCode, cuisineType, mealtime) {
    const results = [];
    const stmt = db.prepare(`
      SELECT * FROM restaurants 
      WHERE zip_code = ? AND cuisine_type = ? AND mealtime = ?
      ORDER BY rating DESC, total_ratings DESC
      LIMIT 3
    `);
    stmt.bind([zipCode, cuisineType, mealtime]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getByZip(zipCode) {
    const results = [];
    const stmt = db.prepare(`
      SELECT * FROM restaurants 
      WHERE zip_code = ?
      ORDER BY rating DESC, total_ratings DESC
    `);
    stmt.bind([zipCode]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getById(id) {
    const stmt = db.prepare('SELECT * FROM restaurants WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  isCacheFresh(zipCode, cuisineType, mealtime) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM restaurants 
      WHERE zip_code = ? AND cuisine_type = ? AND mealtime = ?
      AND cached_at > (strftime('%s', 'now') - 3600)
    `);
    stmt.bind([zipCode, cuisineType, mealtime]);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }
};

export const DishRepo = {
  upsert(data) {
    db.run(`
      INSERT INTO dishes (restaurant_id, dish_name, mention_count, average_sentiment, sample_review, cached_at)
      VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(restaurant_id, dish_name) DO UPDATE SET
        mention_count = dishes.mention_count + excluded.mention_count,
        average_sentiment = excluded.average_sentiment,
        sample_review = excluded.sample_review,
        cached_at = strftime('%s', 'now')
    `, [data.restaurant_id, data.dish_name, data.mention_count, data.average_sentiment, data.sample_review]);
    saveDatabase();
  },

  getByRestaurant(restaurantId) {
    const results = [];
    const stmt = db.prepare(`
      SELECT * FROM dishes 
      WHERE restaurant_id = ?
      ORDER BY mention_count DESC, average_sentiment DESC
      LIMIT 3
    `);
    stmt.bind([restaurantId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getTopDishesForRestaurants(zipCode) {
    const results = [];
    const stmt = db.prepare(`
      SELECT d.*, r.name as restaurant_name
      FROM dishes d
      JOIN restaurants r ON d.restaurant_id = r.id
      WHERE r.zip_code = ?
      ORDER BY d.mention_count DESC, d.average_sentiment DESC
    `);
    stmt.bind([zipCode]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
};

export const ReviewRepo = {
  insert(data) {
    try {
      db.run(`
        INSERT OR IGNORE INTO reviews (restaurant_id, author_name, rating, text, time, cached_at)
        VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
      `, [data.restaurant_id, data.author_name, data.rating, data.text, data.time]);
      saveDatabase();
    } catch (e) {
      // Ignore duplicate inserts
    }
  },

  getByRestaurant(restaurantId) {
    const results = [];
    const stmt = db.prepare(`
      SELECT * FROM reviews 
      WHERE restaurant_id = ?
      ORDER BY time DESC
      LIMIT 50
    `);
    stmt.bind([restaurantId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
};

export const SearchHistoryRepo = {
  upsert(data) {
    db.run(`
      INSERT INTO search_history (zip_code, cuisine_type, mealtime, search_count, last_searched)
      VALUES (?, ?, ?, 1, strftime('%s', 'now'))
      ON CONFLICT(zip_code, cuisine_type, mealtime) DO UPDATE SET
        search_count = search_history.search_count + 1,
        last_searched = strftime('%s', 'now')
    `, [data.zip_code, data.cuisine_type, data.mealtime]);
    saveDatabase();
  },

  getRecent() {
    const results = [];
    const stmt = db.prepare(`
      SELECT * FROM search_history 
      ORDER BY last_searched DESC 
      LIMIT 10
    `);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getPopular() {
    const results = [];
    const stmt = db.prepare(`
      SELECT * FROM search_history 
      ORDER BY search_count DESC 
      LIMIT 10
    `);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
};

export const SyncQueueRepo = {
  add(data) {
    db.run(`
      INSERT INTO sync_queue (operation, data) VALUES (?, ?)
    `, [data.operation, data.data]);
    saveDatabase();
  },

  getPending() {
    const results = [];
    const stmt = db.prepare(`
      SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC
    `);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  markSynced(id) {
    db.run('UPDATE sync_queue SET synced = 1 WHERE id = ?', [id]);
    saveDatabase();
  },

  clearSynced() {
    db.run('DELETE FROM sync_queue WHERE synced = 1');
    saveDatabase();
  }
};

export default { initializeDatabase, getDb };
