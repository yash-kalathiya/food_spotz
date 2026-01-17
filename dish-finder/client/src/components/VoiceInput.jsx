/**
 * VoiceInput Component
 * Voice-to-text input button with visual feedback
 */

import { useVoiceInput } from '../hooks/useVoiceInput';
import { useEffect } from 'react';

export default function VoiceInput({ onResult, placeholder = "Tap to speak" }) {
  const { 
    isListening, 
    transcript, 
    error, 
    isSupported, 
    startListening, 
    stopListening 
  } = useVoiceInput();

  // Pass transcript to parent when finalized
  useEffect(() => {
    if (transcript && !isListening) {
      onResult(transcript);
    }
  }, [transcript, isListening, onResult]);

  if (!isSupported) {
    return null; // Hide if not supported
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          ${isListening 
            ? 'bg-primary-500 text-white voice-active scale-110' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
          }
        `}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          // Animated microphone when listening
          <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        ) : (
          // Static microphone
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Listening indicator */}
      {isListening && (
        <div className="mt-3 text-center animate-fade-in">
          <p className="text-sm text-primary-600 font-medium">Listening...</p>
          {transcript && (
            <p className="text-gray-600 mt-1 max-w-[200px] truncate">
              "{transcript}"
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && !isListening && (
        <p className="mt-2 text-xs text-red-500 text-center max-w-[200px]">
          {error}
        </p>
      )}
    </div>
  );
}
