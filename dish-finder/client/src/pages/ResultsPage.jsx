/**
 * ResultsPage Component
 * Displays search results with top 3 restaurants and their dishes
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import LoadingState from '../components/LoadingState';
import { searchRestaurants } from '../utils/api';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);

  // Extract search params
  const mealtime = searchParams.get('mealtime');
  const cuisine = searchParams.get('cuisine');
  const zipCode = searchParams.get('zip');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  useEffect(() => {
    if (!mealtime || !cuisine) {
      navigate('/');
      return;
    }

    fetchResults();
  }, [mealtime, cuisine, zipCode, lat, lng]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        mealtime,
        cuisine,
        ...(zipCode ? { zipCode } : { latitude: parseFloat(lat), longitude: parseFloat(lng) })
      };

      const result = await searchRestaurants(params);
      setRestaurants(result.restaurants);
      setSource(result.source);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  // Format display location
  const locationDisplay = zipCode || (lat && lng ? 'Current Location' : 'Unknown');

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 safe-top">
        <div className="flex items-center px-4 py-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 ml-2">
            <h1 className="font-semibold text-gray-900">{cuisine}</h1>
            <p className="text-sm text-gray-500">{mealtime} • {locationDisplay}</p>
          </div>
          <button
            onClick={fetchResults}
            className="p-2 text-primary-500 hover:text-primary-600"
            disabled={loading}
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Source indicator */}
      {source && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            {source === 'cache' && (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-gray-600">From saved results</span>
              </>
            )}
            {source === 'api' && (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">Fresh results</span>
              </>
            )}
            {source === 'offline' && (
              <>
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-gray-600">Offline - search queued</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-4 py-4">
        {loading ? (
          <LoadingState count={3} />
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Oops!</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchResults}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find {cuisine} restaurants for {mealtime} in your area.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Try Different Search
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Top {restaurants.length} Results
            </h2>
            
            {restaurants.map((restaurant, index) => (
              <RestaurantCard 
                key={restaurant.id || index} 
                restaurant={restaurant} 
                rank={index + 1}
              />
            ))}

            {/* Refresh hint */}
            <p className="text-center text-sm text-gray-500 pt-4">
              Pull down to refresh or tap the refresh button
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
