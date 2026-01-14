import { useDispatch } from "react-redux";
import { loginSuccess } from "../feature/auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    dispatch(
      loginSuccess({
        user: { name: "Test User" },
        role,
        token: "dummy_jwt_token",
      })
    );

    // Redirect by role
    if (role === "superAdmin") navigate("/dashboard/super-admin");
    if (role === "schoolAdmin") navigate("/dashboard/school-admin");
    if (role === "teacher") navigate("/dashboard/teacher");
    if (role === "student") navigate("/dashboard/student");
    if (role === "parent") navigate("/dashboard/parent");
  };

  return (
    <div>
      <h1>Login Page</h1>

      <button onClick={() => handleLogin("superAdmin")}>Login Super Admin</button>
      <button onClick={() => handleLogin("schoolAdmin")}>Login School Admin</button>
      <button onClick={() => handleLogin("teacher")}>Login Teacher</button>
      <button onClick={() => handleLogin("student")}>Login Student</button>
      <button onClick={() => handleLogin("parent")}>Login Parent</button>
    </div>
  );
}
