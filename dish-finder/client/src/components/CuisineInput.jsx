/**
 * CuisineInput Component
 * Text and voice input for cuisine type
 */

import { useState, useCallback } from 'react';
import VoiceInput from './VoiceInput';

const POPULAR_CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
  'Thai', 'American', 'Mediterranean', 'Korean', 'Vietnamese'
];

export default function CuisineInput({ value, onChange }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleVoiceResult = useCallback((transcript) => {
    // Clean up transcript and set as cuisine
    const cleaned = transcript.trim().replace(/[^\w\s]/g, '');
    onChange(cleaned);
  }, [onChange]);

  const filteredCuisines = POPULAR_CUISINES.filter(cuisine =>
    cuisine.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        What cuisine are you craving?
      </label>

      {/* Input with voice button */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="e.g., Italian, Mexican, Sushi..."
          className="input pr-16"
        />
        
        {/* Voice input button */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <VoiceInput 
            onResult={handleVoiceResult}
            placeholder="Speak cuisine"
          />
        </div>
      </div>

      {/* Quick suggestions */}
      {showSuggestions && filteredCuisines.length > 0 && (
        <div className="mt-2 p-2 bg-white rounded-xl border border-gray-200 shadow-lg animate-fade-in">
          <p className="text-xs text-gray-500 mb-2 px-2">Popular cuisines</p>
          <div className="flex flex-wrap gap-2">
            {filteredCuisines.slice(0, 6).map(cuisine => (
              <button
                key={cuisine}
                type="button"
                onClick={() => {
                  onChange(cuisine);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-primary-100 
                         rounded-full text-sm text-gray-700 hover:text-primary-700
                         transition-colors"
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular cuisines when empty */}
      {!value && !showSuggestions && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Quick picks</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CUISINES.slice(0, 5).map(cuisine => (
              <button
                key={cuisine}
                type="button"
                onClick={() => onChange(cuisine)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-primary-100 
                         rounded-full text-sm text-gray-700 hover:text-primary-700
                         transition-colors"
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
