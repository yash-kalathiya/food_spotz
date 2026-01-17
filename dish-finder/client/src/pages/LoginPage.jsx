import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, Utensils } from 'lucide-react';

const LoginPage = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const login = () => {
    loginWithRedirect();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-3xl mb-4">
            <Utensils size={40} className="text-black" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            FOOD SPOTZ
          </h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest">Find your flavor</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-yellow-500" size={24} />
            <h2 className="font-semibold text-xl text-gray-200">Secure Sign In</h2>
          </div>

          <p className="text-gray-400 mb-8">
            Sign in with your Auth0 account to access personalized restaurant recommendations and save your favorite spots.
          </p>

          <button
            onClick={login}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(59,130,246,0.2)] active:scale-95 transition-transform disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In with Auth0
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Protected by Auth0 Security
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-[#1E1E1E]/50 p-4 rounded-2xl">
            <p className="text-yellow-500 font-bold text-lg">🔒</p>
            <p className="text-gray-400 text-xs mt-1">Secure</p>
          </div>
          <div className="bg-[#1E1E1E]/50 p-4 rounded-2xl">
            <p className="text-yellow-500 font-bold text-lg">⚡</p>
            <p className="text-gray-400 text-xs mt-1">Fast</p>
          </div>
          <div className="bg-[#1E1E1E]/50 p-4 rounded-2xl">
            <p className="text-yellow-500 font-bold text-lg">🍕</p>
            <p className="text-gray-400 text-xs mt-1">Delicious</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
