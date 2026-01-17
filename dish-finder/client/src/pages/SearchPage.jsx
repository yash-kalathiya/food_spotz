/**
 * SearchPage Component
 * Main search interface with mealtime, location, and cuisine inputs
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MealtimeSelector from '../components/MealtimeSelector';
import LocationInput from '../components/LocationInput';
import CuisineInput from '../components/CuisineInput';
import { getRecentSearches } from '../utils/indexedDB';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function SearchPage({ location, locationError, requestLocation }) {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  
  // Form state
  const [mealtime, setMealtime] = useState(() => getCurrentMealtime());
  const [cuisine, setCuisine] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [useGPS, setUseGPS] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load recent searches
  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  // Handle search submission
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!cuisine) {
      alert('Please enter a cuisine type');
      return;
    }

    if (useGPS && !location) {
      alert('Please enable location access or enter a zip code');
      return;
    }

    if (!useGPS && zipCode.length !== 5) {
      alert('Please enter a valid 5-digit zip code');
      return;
    }

    setIsSearching(true);

    // Build search params
    const searchParams = new URLSearchParams({
      mealtime,
      cuisine,
      ...(useGPS && location 
        ? { lat: location.latitude, lng: location.longitude }
        : { zip: zipCode }
      )
    });

    // Navigate to results
    navigate(`/results?${searchParams.toString()}`);
  };

  // Quick search from history
  const handleQuickSearch = (search) => {
    setMealtime(search.mealtime);
    setCuisine(search.cuisine_type || search.cuisine);
    setZipCode(search.zip_code || search.zipCode || '');
    if (search.zip_code || search.zipCode) {
      setUseGPS(false);
    }
  };

  const canSearch = cuisine && (useGPS ? location : zipCode.length === 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="pt-12 pb-6 px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🍽️ Dish Finder
        </h1>
        <p className="text-gray-600">
          Discover the best restaurants & dishes near you
        </p>
        
        {/* Offline indicator */}
        {!isOnline && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Offline Mode
          </div>
        )}
      </header>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="px-4 space-y-6 pb-8">
        {/* Mealtime */}
        <div className="card p-4">
          <MealtimeSelector value={mealtime} onChange={setMealtime} />
        </div>

        {/* Location */}
        <div className="card p-4">
          <LocationInput
            zipCode={zipCode}
            onZipChange={setZipCode}
            gpsLocation={location}
            onRequestGPS={requestLocation}
            locationError={locationError}
            useGPS={useGPS}
            onToggleGPS={setUseGPS}
          />
        </div>

        {/* Cuisine */}
        <div className="card p-4">
          <CuisineInput value={cuisine} onChange={setCuisine} />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={!canSearch || isSearching}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Restaurants & Dishes
            </>
          )}
        </button>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Searches</h3>
            <div className="space-y-2">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickSearch(search)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 
                           hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                >
                  <span className="text-xl">
                    {getMealtimeIcon(search.mealtime)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {search.cuisine_type || search.cuisine}
                    </p>
                    <p className="text-sm text-gray-500">
                      {search.mealtime} • {search.zip_code || search.zipCode || 'GPS'}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// Helper functions
function getCurrentMealtime() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'latenight';
}

function getMealtimeIcon(mealtime) {
  const icons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    latenight: '🌃'
  };
  return icons[mealtime] || '🍽️';
}
