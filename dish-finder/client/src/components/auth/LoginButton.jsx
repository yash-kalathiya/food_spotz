import { useAuth0 } from "@auth0/auth0-react";
import { LogIn } from "lucide-react";

const LoginButton = ({ className = "" }) => {
  const { loginWithRedirect, isLoading } = useAuth0();
  
  return (
    <button 
      onClick={() => loginWithRedirect()} 
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] active:scale-95 transition-transform disabled:opacity-50 ${className}`}
    >
      <LogIn size={18} />
      {isLoading ? "Loading..." : "Sign In"}
    </button>
  );
};

export default LoginButton;
