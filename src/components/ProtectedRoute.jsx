import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../context/useAuthStore";

export default function ProtectedRoute({ children, roleRequis }) {
  const { accessToken, utilisateur, aLeRole } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !utilisateur) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (roleRequis && !aLeRole(roleRequis)) {
    return <Navigate to="/non-autorise" replace />;
  }

  return children;
}
