import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function RoleRoute({ allowed }) {
  const { role } = useSelector((state) => state.auth);

  return allowed.includes(role)
    ? <Outlet />
    : <Navigate to="/unauthorized" replace />;
}
