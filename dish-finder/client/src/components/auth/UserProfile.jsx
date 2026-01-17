import { useAuth0 } from "@auth0/auth0-react";
import { User } from "lucide-react";

const UserProfile = ({ compact = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-8 h-8 rounded-full bg-[#2A2A2A] animate-pulse" />
        {!compact && <span className="text-sm">Loading...</span>}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {user.picture ? (
          <img 
            src={user.picture} 
            alt={user.name || 'User'} 
            className="w-8 h-8 rounded-full border-2 border-yellow-500"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
            <User size={16} className="text-black" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800">
      {user.picture ? (
        <img 
          src={user.picture} 
          alt={user.name || 'User'} 
          className="w-14 h-14 rounded-full border-2 border-yellow-500"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
          <User size={24} className="text-black" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-200 truncate">{user.name}</p>
        <p className="text-sm text-gray-500 truncate">{user.email}</p>
      </div>
    </div>
  );
};

export default UserProfile;
