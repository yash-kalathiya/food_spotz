import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';
import { registerSW } from './utils/serviceWorker';
import { initDB } from './utils/indexedDB';

// Initialize IndexedDB for offline storage
initDB();

// Register service worker for PWA
registerSW();

// Auth0 configuration - read from environment
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

// Debug: Log Auth0 config (remove in production)
console.log('Auth0 Domain:', domain);
console.log('Auth0 Client ID:', clientId);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain || 'placeholder.auth0.com'}
      clientId={clientId || 'placeholder'}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);
