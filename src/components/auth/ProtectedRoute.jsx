import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"; 

export default function ProtectedRoute() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // MUST be <Outlet />, not {children}
  return <Outlet />; 
}