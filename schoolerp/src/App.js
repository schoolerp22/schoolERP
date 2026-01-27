import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { validateToken } from "./feature/auth/authSlice";

// Dashboards
import SuperAdminDashboard from "./dashboards/SuperAdmin/SuperAdminDashboard";
import SchoolAdminDashboard from "./dashboards/SchoolAdmin/SchoolAdminDashboard";
import TeacherDashboard from "./dashboards/Teacher/TeacherDashboard";
import StudentDashboard from "./dashboards/Student/StudentDashboard";
import ParentDashboard from "./dashboards/Parent/ParentDashboard";

import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(validateToken());
  }, [dispatch]);
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/login/student" element={<Login />} />
        <Route path="/login/teacher" element={<Login />} />
        <Route path="/login/admin" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* must be logged in */}
        <Route element={<ProtectedRoute />}>

          {/* Super Admin */}
          <Route element={<RoleRoute allowed={["superAdmin"]} />}>
            <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
          </Route>

          {/* School Admin */}
          <Route element={<RoleRoute allowed={["schoolAdmin"]} />}>
            <Route path="/dashboard/school-admin" element={<SchoolAdminDashboard />} />
          </Route>

          {/* Teacher */}
          <Route element={<RoleRoute allowed={["teacher"]} />}>
            <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
          </Route>

          {/* Student */}
          <Route element={<RoleRoute allowed={["student"]} />}>
            <Route path="/dashboard/student" element={<StudentDashboard />} />
          </Route>

          {/* Parent */}
          <Route element={<RoleRoute allowed={["parent"]} />}>
            <Route path="/dashboard/parent" element={<ParentDashboard />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
