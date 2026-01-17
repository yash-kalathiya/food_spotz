/**
 * Auth0 Configuration
 * Replace these values with your Auth0 application settings
 */

const auth0Config = {
  // Your Auth0 tenant domain (e.g., your-tenant.auth0.com)
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'your-tenant.auth0.com',
  
  // Your Auth0 application's Client ID
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-client-id',
  
  // API audience for accessing protected APIs (optional)
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
  
  // Redirect URI after login
  redirectUri: window.location.origin,
};

export default auth0Config;
