import { useAuth0 } from "@auth0/auth0-react";
import { Utensils, ShieldCheck } from "lucide-react";
import LoginButton from "./LoginButton";

const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6 flex items-center justify-center font-sans">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-red-800">
            <ShieldCheck size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-200 mb-2">Authentication Error</h2>
            <p className="text-gray-500 mb-6">{error.message}</p>
            <LoginButton className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6 flex items-center justify-center font-sans">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-gray-800 shadow-xl">
            <Utensils size={48} className="text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
              FOOD SPOTZ
            </h1>
            <p className="text-gray-500 text-sm uppercase tracking-widest mb-6">
              Discover Amazing Food
            </p>
            <div className="bg-[#2A2A2A] p-6 rounded-2xl mb-6">
              <p className="text-gray-300 mb-4">Sign in to discover the best restaurants and dishes near you</p>
              <ul className="text-left text-sm text-gray-400 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-500">✓</span> Personalized recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-500">✓</span> Save your favorite spots
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-500">✓</span> Access search history
                </li>
              </ul>
            </div>
            <LoginButton className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthGuard;
