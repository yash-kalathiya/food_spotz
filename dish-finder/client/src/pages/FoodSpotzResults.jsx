import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, ShoppingCart, Utensils, Clock, MapPin, Star, Zap } from 'lucide-react';

const FoodSpotzResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchResults = location.state?.searchResults;
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true 
    }));
  }, []);

  if (!searchResults) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6 flex items-center justify-center font-sans">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-gray-800">
            <Utensils size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-200 mb-2">No Results Found</h2>
            <p className="text-gray-500 mb-6">Start a new search to find amazing food spots</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] active:scale-95 transition-transform"
            >
              FIND FOOD NOW
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { restaurants, query, source } = searchResults;

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
          FOOD SPOTZ
        </h1>
        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">Your Results</p>
      </header>

      <div className="space-y-6 max-w-md mx-auto">
        
        {/* Search Summary Card */}
        <section className="bg-[#1E1E1E] p-5 rounded-3xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Zap className={source === 'cache' ? 'text-green-500' : 'text-yellow-500'} size={20} />
            <h2 className="font-semibold text-lg text-gray-200">
              {source === 'cache' ? 'Previously Curated' : 'Fresh Results'}
            </h2>
            <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${
              source === 'cache' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {source === 'cache' ? '⚡ FAST' : '🔍 NEW'}
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
        {restaurants.length === 0 ? (
          <section className="bg-[#1E1E1E] p-8 rounded-3xl border border-gray-800 shadow-xl text-center">
            <Utensils size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Restaurants Found</h3>
            <p className="text-gray-500 text-sm">Try a different location or cuisine type</p>
          </section>
        ) : (
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
                      <span className="text-sm font-semibold text-green-400">{restaurant.price_level}</span>
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
                        <div 
                          key={idx} 
                          className="flex items-center bg-[#2A2A2A] px-4 py-3 rounded-2xl"
                        >
                          <span className="text-yellow-600 mr-3">•</span>
                          <span className="flex-1 text-gray-300 text-sm">{dishName}</span>
                          {typeof dish === 'object' && dish.mention_count && (
                            <span className="text-[10px] text-gray-500 bg-[#1E1E1E] px-2 py-1 rounded-lg">
                              {dish.mention_count}x
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No dishes fallback */}
              {(!restaurant.top_dishes || restaurant.top_dishes.length === 0) && (
                <p className="text-gray-500 text-sm italic mb-4">No specific dishes highlighted</p>
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
        )}

        {/* Action Buttons */}
        <button 
          onClick={() => navigate('/')}
          className="w-full py-5 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] active:scale-95 transition-transform"
        >
          FIND MORE FOOD
        </button>

        <button 
          onClick={() => navigate('/history')}
          className="w-full py-5 bg-gradient-to-r from-green-500 to-green-700 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(34,197,94,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          ⚡ PREVIOUSLY CURATED - FAST!
        </button>
      </div>
    </div>
  );
};

export default FoodSpotzResults;
