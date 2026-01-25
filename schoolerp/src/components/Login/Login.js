import { useState } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { loginSuccess } from "../../feature/auth/authSlice";
import { useNavigate } from "react-router-dom";
const API_URL = `${process.env.REACT_APP_API_URL}/api/auth`;
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      dispatch(
        loginSuccess({
          user: res.data.user,
          role: res.data.role,
          token: res.data.token,
        })
      );

      if (res.data.role === "teacher") navigate("/dashboard/teacher");
      if (res.data.role === "student") navigate("/dashboard/student");
      if (res.data.role === "superAdmin")
        navigate("/dashboard/super-admin");
      if (res.data.role === "schoolAdmin")
        navigate("/dashboard/school-admin");
      if (res.data.role === "parent") navigate("/dashboard/parent");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
