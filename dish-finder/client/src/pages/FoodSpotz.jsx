import React, { useState } from 'react';
import { Mic, MapPin, ChevronDown, Utensils, Clock, Map, Loader2, User, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const FoodSpotz = () => {
  const [meal, setMeal] = useState('');
  const [zip, setZip] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [isListening, setIsListening] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  
  // Auth0 hook
  const { user, isAuthenticated, isLoading: authLoading, loginWithRedirect, logout } = useAuth0();

  // Voice Recognition Setup
  const handleVoiceInput = (target) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    setIsListening(target);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (target === 'meal') setMeal(transcript);
      if (target === 'zip') setZip(transcript.replace(/\s/g, ''));
      if (target === 'cuisine') setCuisine(transcript);
      setIsListening(null);
    };

    recognition.onerror = () => setIsListening(null);
    recognition.start();
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setZip(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
    });
  };

  const handleSearch = async () => {
    if (!meal || !zip || !cuisine) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealtime: meal,
          cuisine: cuisine,
          location: zip,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Search failed');
      }

      // Navigate to results with the data
      navigate('/results', { state: { searchResults: data } });
    } catch (err) {
      setError(err.message || 'Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 font-sans">
      {/* Header */}
      <header className="text-center mb-10 pt-8 relative">
        {/* User Profile Button */}
        <div className="absolute right-0 top-4">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-[#1E1E1E] px-4 py-2 rounded-2xl border border-gray-800 hover:border-yellow-800/50 transition-colors"
          >
            {isAuthenticated && user?.picture ? (
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full border-2 border-yellow-500" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
            )}
            <span className="text-sm text-gray-300 max-w-[100px] truncate hidden sm:block">
              {isAuthenticated ? (user?.name || user?.email || 'User') : 'Anonymous'}
            </span>
          </button>
          
          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#1E1E1E] rounded-2xl border border-gray-800 shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-gray-800">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    {user.picture ? (
                      <img src={user.picture} alt="" className="w-12 h-12 rounded-full border-2 border-yellow-500" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
                        <User size={20} className="text-black" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-200 truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-200">Anonymous User</p>
                      <p className="text-xs text-gray-500">Sign in to save preferences</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-2">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout({ logoutParams: { returnTo: window.location.origin } });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      loginWithRedirect();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-colors"
                  >
                    <LogIn size={18} />
                    <span>Sign In with Auth0</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          FOOD SPOTZ
        </h1>
        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">Find your flavor</p>
      </header>

      <div className="space-y-6 max-w-md mx-auto">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* Section 1: Meal Selection */}
        <section className="bg-[#1E1E1E] p-5 rounded-3xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-yellow-500" size={20} />
            <h2 className="font-semibold text-lg text-gray-200">The Occasion</h2>
          </div>
          <div className="relative flex gap-2">
            <select 
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className="w-full bg-[#2A2A2A] border-none rounded-2xl py-4 px-4 appearance-none focus:ring-2 focus:ring-yellow-500 transition-all text-gray-300"
            >
              <option value="">What's the timing?</option>
              <option value="breakfast">Breakfast</option>
              <option value="brunch">Brunch</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="late_night">Late Night</option>
            </select>
            <button 
              onClick={() => handleVoiceInput('meal')}
              className={`p-4 rounded-2xl transition-all ${isListening === 'meal' ? 'bg-red-500 animate-pulse' : 'bg-yellow-600'}`}
            >
              <Mic size={20} className="text-black" />
            </button>
          </div>
        </section>

        {/* Section 2: Location */}
        <section className="bg-[#1E1E1E] p-5 rounded-3xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Map className="text-yellow-500" size={20} />
            <h2 className="font-semibold text-lg text-gray-200">Current Coordinates</h2>
          </div>
          <div className="space-y-3">
            <button 
              onClick={getLocation}
              className="w-full flex items-center justify-center gap-2 bg-[#2A2A2A] text-yellow-500 py-3 rounded-2xl border border-dashed border-yellow-800/50 hover:bg-[#333]"
            >
              <MapPin size={16} /> Use My Location
            </button>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Enter ZIP"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full bg-[#2A2A2A] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-yellow-500 transition-all text-gray-300"
              />
              <button 
                onClick={() => handleVoiceInput('zip')}
                className={`p-4 rounded-2xl transition-all ${isListening === 'zip' ? 'bg-red-500 animate-pulse' : 'bg-yellow-600'}`}
              >
                <Mic size={20} className="text-black" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Cuisine */}
        <section className="bg-[#1E1E1E] p-5 rounded-3xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Utensils className="text-yellow-500" size={20} />
            <h2 className="font-semibold text-lg text-gray-200">I am craving...</h2>
          </div>
          <div className="relative flex gap-2">
            <select 
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full bg-[#2A2A2A] border-none rounded-2xl py-4 px-4 appearance-none focus:ring-2 focus:ring-yellow-500 transition-all text-gray-300"
            >
              <option value="">Pick your poison</option>
              <option value="american">American</option>
              <option value="chinese">Chinese</option>
              <option value="thai">Thai</option>
              <option value="mexican">Mexican</option>
              <option value="mediterranean">Mediterranean</option>
              <option value="indian">Indian</option>
              <option value="italian">Italian</option>
              <option value="japanese">Japanese</option>
              <option value="korean">Korean</option>
              <option value="vietnamese">Vietnamese</option>
            </select>
            <button 
              onClick={() => handleVoiceInput('cuisine')}
              className={`p-4 rounded-2xl transition-all ${isListening === 'cuisine' ? 'bg-red-500 animate-pulse' : 'bg-yellow-600'}`}
            >
              <Mic size={20} className="text-black" />
            </button>
          </div>
        </section>

        <button 
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full py-5 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold rounded-2xl mt-4 shadow-[0_10px_20px_rgba(234,179,8,0.2)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              SEARCHING...
            </>
          ) : (
            'FIND FOOD NOW'
          )}
        </button>

        <button 
          onClick={() => navigate('/history')}
          className="w-full py-5 bg-gradient-to-r from-green-500 to-green-700 text-black font-bold rounded-2xl mt-3 shadow-[0_10px_20px_rgba(34,197,94,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          ⚡ PREVIOUSLY CURATED - FAST!
        </button>
      </div>
    </div>
  );
};

export default FoodSpotz;
