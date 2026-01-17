import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Utensils, Zap, Loader2, Star, Navigation, ShoppingCart } from 'lucide-react';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchHistory();
    const now = new Date();
    setCurrentTime(now.toLocaleString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true 
    }));
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = async (item) => {
    setSelectedSearch(item);
    setIsLoadingResults(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealtime: item.mealtime,
          cuisine: item.cuisine,
          location: item.location,
        }),
      });
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError('Failed to load cached results');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleBackToList = () => {
    setSelectedSearch(null);
    setSearchResults(null);
  };

  // Show results view when a search is selected
  if (selectedSearch && searchResults) {
    const { restaurants, query } = searchResults;
    
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6 font-sans">
        {/* Header */}
        <header className="text-center mb-8 pt-4 relative">
          <button 
            onClick={handleBackToList}
            className="absolute left-0 top-4 p-3 bg-[#1E1E1E] rounded-2xl border border-gray-800 hover:border-yellow-800/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-yellow-500" />
          </button>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            CURATED
          </h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">⚡ Instant Results</p>
        </header>

        <div className="space-y-6 max-w-md mx-auto">
          {/* Search Summary Card */}
          <section className="bg-[#1E1E1E] p-5 rounded-3xl border border-gray-800 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="text-yellow-500" size={20} />
              <h2 className="font-semibold text-lg text-gray-200">Previously Curated</h2>
              <span className="ml-auto text-xs px-3 py-1 rounded-full font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                ⚡ FAST
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#2A2A2A] p-3 rounded-2xl text-center">
                <Clock size={16} className="text-yellow-500 mx-auto mb-1" />
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Occasion</p>
                <p className="text-sm font-semibold text-gray-200 capitalize">{query?.mealtime || '-'}</p>
              </div>
              <div className="bg-[#2A2A2A] p-3 rounded-2xl text-center">
                <MapPin size={16} className="text-yellow-500 mx-auto mb-1" />
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Location</p>
                <p className="text-sm font-semibold text-gray-200">{query?.location || '-'}</p>
              </div>
              <div className="bg-[#2A2A2A] p-3 rounded-2xl text-center">
                <Utensils size={16} className="text-yellow-500 mx-auto mb-1" />
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Cuisine</p>
                <p className="text-sm font-semibold text-gray-200 capitalize">{query?.cuisine || '-'}</p>
              </div>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-3">{currentTime}</p>
          </section>

          {/* Restaurant Cards */}
          {restaurants && restaurants.length > 0 ? (
            restaurants.map((restaurant, index) => (
              <section 
                key={index} 
                className="bg-[#1E1E1E] p-5 rounded-3xl border border-gray-800 shadow-xl hover:border-yellow-800/50 transition-colors"
              >
                {/* Restaurant Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center text-black font-black text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-yellow-500 truncate">{restaurant.name}</h3>
                    {restaurant.address && (
                      <p className="text-gray-500 text-xs truncate">{restaurant.address}</p>
                    )}
                  </div>
                </div>

                {/* Rating & Price Row */}
                {(restaurant.rating || restaurant.price_level) && (
                  <div className="flex items-center gap-3 mb-4">
                    {restaurant.rating && (
                      <div className="flex items-center gap-1 bg-[#2A2A2A] px-3 py-2 rounded-xl">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-gray-200">{restaurant.rating}</span>
                      </div>
                    )}
                    {restaurant.price_level && (
                      <div className="bg-[#2A2A2A] px-3 py-2 rounded-xl">
                        <span className="text-sm font-semibold text-yellow-400">{restaurant.price_level}</span>
                      </div>
                    )}
                    {restaurant.total_reviews && (
                      <span className="text-xs text-gray-500">({restaurant.total_reviews.toLocaleString()} reviews)</span>
                    )}
                  </div>
                )}
                
                {/* Top Dishes */}
                {restaurant.top_dishes && restaurant.top_dishes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                      🔥 Popular Dishes
                    </p>
                    <div className="space-y-2">
                      {restaurant.top_dishes.map((dish, idx) => {
                        const dishName = typeof dish === 'string' ? dish : dish.name;
                        return (
                          <div key={idx} className="flex items-center bg-[#2A2A2A] px-4 py-3 rounded-2xl">
                            <span className="text-yellow-600 mr-3">•</span>
                            <span className="flex-1 text-gray-300 text-sm">{dishName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const q = encodeURIComponent(`${restaurant.name} ${restaurant.address || ''}`);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2A2A2A] rounded-2xl text-gray-300 hover:bg-[#333] transition-colors"
                  >
                    <Navigation size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium">Directions</span>
                  </button>
                  <button 
                    onClick={() => {
                      const q = encodeURIComponent(`${restaurant.name} order online`);
                      window.open(`https://www.google.com/search?q=${q}`, '_blank');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2A2A2A] rounded-2xl text-gray-300 hover:bg-[#333] transition-colors"
                  >
                    <ShoppingCart size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium">Order</span>
                  </button>
                </div>
              </section>
            ))
          ) : (
            <section className="bg-[#1E1E1E] p-8 rounded-3xl border border-gray-800 shadow-xl text-center">
              <Utensils size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Restaurants Found</h3>
              <p className="text-gray-500 text-sm">This cached search has no results</p>
            </section>
          )}

          {/* Action Buttons */}
          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] active:scale-95 transition-transform"
          >
            FIND MORE FOOD
          </button>

          <button 
            onClick={handleBackToList}
            className="w-full py-5 bg-[#1E1E1E] border border-gray-800 text-gray-300 font-bold rounded-2xl hover:bg-[#2A2A2A] transition-colors"
          >
            ← Back to Curated List
          </button>
        </div>
      </div>
    );
  }

  // Loading results view
  if (isLoadingResults) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading curated results...</p>
        </div>
      </div>
    );
  }

  // History list view
  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 font-sans">
      {/* Header */}
      <header className="text-center mb-8 pt-4 relative">
        <button 
          onClick={() => navigate('/')}
          className="absolute left-0 top-4 p-3 bg-[#1E1E1E] rounded-2xl border border-gray-800 hover:border-yellow-800/50 transition-colors"
        >
          <ArrowLeft size={20} className="text-yellow-500" />
        </button>
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          CURATED
        </h1>
        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">Previously Searched</p>
      </header>

      <div className="space-y-6 max-w-md mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-yellow-500" />
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-2xl text-center">
            {error}
          </div>
        ) : history.length === 0 ? (
          <section className="bg-[#1E1E1E] p-8 rounded-3xl text-center border border-gray-800 shadow-xl">
            <Clock size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Curated Searches Yet</h3>
            <p className="text-gray-500 text-sm mb-6">Your search history will appear here for instant access</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(34,197,94,0.2)] active:scale-95 transition-transform"
            >
              START SEARCHING
            </button>
          </section>
        ) : (
          <>
            {/* Info Card */}
            <section className="bg-[#1E1E1E] p-4 rounded-3xl border border-gray-800 shadow-xl">
              <div className="flex items-center gap-3">
                <Zap className="text-yellow-500" size={20} />
                <div>
                  <p className="font-semibold text-gray-200">Instant Results</p>
                  <p className="text-xs text-gray-500">Tap any search to load cached results instantly</p>
                </div>
              </div>
            </section>

            {/* History Items */}
            {history.map((item, index) => (
              <button
                key={item.id || index}
                onClick={() => handleSelectHistory(item)}
                className="w-full bg-[#1E1E1E] p-5 rounded-3xl border border-gray-800 shadow-xl hover:border-yellow-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center text-black font-black text-lg flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-yellow-500 capitalize text-lg">{item.cuisine}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400 capitalize">{item.mealtime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} />
                      <span>{item.location}</span>
                      <span className="text-gray-600">•</span>
                      <span>{item.restaurant_count} spots</span>
                    </div>
                  </div>
                  <span className="text-xs text-yellow-500 bg-yellow-500/20 px-3 py-2 rounded-xl font-semibold">
                    ⚡ TAP
                  </span>
                </div>
              </button>
            ))}
          </>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-5 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] active:scale-95 transition-transform"
        >
          FIND MORE FOOD
        </button>
      </div>
    </div>
  );
};

export default HistoryPage;
