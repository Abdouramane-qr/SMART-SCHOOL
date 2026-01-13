import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { user, loading, signOut, hasPermission } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return { user, loading, signOut: handleSignOut, hasPermission };
}
