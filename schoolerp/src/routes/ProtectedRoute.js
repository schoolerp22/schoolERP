import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
const { isAuthenticated, role, loading } = useSelector(
  (state) => state.auth || {}
);


  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
