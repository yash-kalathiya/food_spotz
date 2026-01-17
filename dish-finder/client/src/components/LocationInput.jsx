/**
 * LocationInput Component
 * GPS/Zip code location input with toggle
 */

import { useState } from 'react';

export default function LocationInput({ 
  zipCode, 
  onZipChange, 
  gpsLocation, 
  onRequestGPS,
  locationError,
  useGPS,
  onToggleGPS 
}) {
  const [localZip, setLocalZip] = useState(zipCode || '');

  const handleZipChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setLocalZip(value);
    if (value.length === 5) {
      onZipChange(value);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Your Location
      </label>

      {/* GPS/Zip Toggle */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-3">
        <button
          type="button"
          onClick={() => onToggleGPS(true)}
          className={`
            flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
            ${useGPS 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            GPS
          </span>
        </button>
        <button
          type="button"
          onClick={() => onToggleGPS(false)}
          className={`
            flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
            ${!useGPS 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Zip Code
          </span>
        </button>
      </div>

      {/* GPS Location Display */}
      {useGPS && (
        <div>
          {gpsLocation ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Location detected</span>
              <span className="text-xs text-green-600 ml-auto">
                ({gpsLocation.latitude.toFixed(4)}, {gpsLocation.longitude.toFixed(4)})
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequestGPS}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl
                       text-gray-600 hover:border-primary-400 hover:text-primary-600
                       transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Tap to detect location
            </button>
          )}
          {locationError && (
            <p className="mt-2 text-sm text-red-500">{locationError}</p>
          )}
        </div>
      )}

      {/* Zip Code Input */}
      {!useGPS && (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localZip}
          onChange={handleZipChange}
          placeholder="Enter 5-digit zip code"
          className="input text-center text-lg tracking-widest"
          maxLength={5}
        />
      )}
    </div>
  );
}
