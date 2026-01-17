import { useAuth0 } from "@auth0/auth0-react";
import { LogOut } from "lucide-react";

const LogoutButton = ({ className = "" }) => {
  const { logout, isLoading } = useAuth0();
  
  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 py-3 px-6 bg-[#2A2A2A] text-gray-300 font-medium rounded-2xl border border-gray-700 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50 ${className}`}
    >
      <LogOut size={18} />
      {isLoading ? "Loading..." : "Sign Out"}
    </button>
  );
};

export default LogoutButton;
