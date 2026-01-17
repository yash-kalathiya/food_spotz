/**
 * Service Worker Registration and Offline Sync Logic
 */

import { getPendingOfflineSearches, clearOfflineQueue } from './indexedDB';

/**
 * Register service worker for PWA support
 */
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, notify user
              dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}

/**
 * Sync offline operations when coming back online
 */
export async function syncOfflineData() {
  if (!navigator.onLine) return;
  
  try {
    const pendingSearches = await getPendingOfflineSearches();
    
    if (pendingSearches.length === 0) return;
    
    console.log(`📤 Syncing ${pendingSearches.length} offline searches...`);
    
    // Process each pending search
    for (const search of pendingSearches) {
      try {
        await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operations: [{ type: 'search', data: search }] })
        });
      } catch (err) {
        console.error('Failed to sync search:', err);
      }
    }
    
    // Clear the queue after successful sync
    await clearOfflineQueue();
    console.log('✅ Offline data synced');
    
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

/**
 * Request background sync if supported
 */
export async function requestBackgroundSync(tag = 'sync-searches') {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync requested:', tag);
    } catch (error) {
      console.error('Background sync failed:', error);
      // Fallback to immediate sync
      await syncOfflineData();
    }
  } else {
    // Fallback for browsers without Background Sync
    await syncOfflineData();
  }
}

/**
 * Listen for online/offline events and handle sync
 */
export function setupSyncListeners() {
  window.addEventListener('online', () => {
    console.log('📶 Back online - syncing data...');
    syncOfflineData();
  });

  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        console.log('Background sync completed');
        dispatchEvent(new CustomEvent('data-synced'));
      }
    });
  }
}

// Initialize sync listeners
if (typeof window !== 'undefined') {
  setupSyncListeners();
}

export default {
  registerSW,
  syncOfflineData,
  requestBackgroundSync,
  setupSyncListeners
};
