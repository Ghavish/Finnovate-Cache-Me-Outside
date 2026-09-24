import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  // Remember where the user was going, so login can send them back there.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  // MUST be <Outlet />, not {children}
  return <Outlet />;
}
