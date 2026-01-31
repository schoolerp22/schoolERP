import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, googleLogin, clearError } from "../feature/auth/authSlice";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { User, School, GraduationCap, Eye, EyeOff } from "lucide-react"; // Icons for tabs

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get auth state
  const { isAuthenticated, role: userRole, loading, error } = useSelector((state) => state.auth);

  // Local state
  const [role, setRole] = useState("student"); // Default role
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Set role based on URL if provided (e.g. /login/teacher)
  useEffect(() => {
    if (location.pathname.includes("teacher")) setRole("teacher");
    else if (location.pathname.includes("admin")) setRole("schoolAdmin");
    else if (location.pathname.includes("student")) setRole("student");
  }, [location]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === "schoolAdmin") navigate("/dashboard/school-admin");
      else if (userRole === "teacher") navigate("/dashboard/teacher");
      else if (userRole === "student") navigate("/dashboard/student");
      else if (userRole === "parent") navigate("/dashboard/parent");
      else if (userRole === "superAdmin") navigate("/dashboard/super-admin");
    }

    if (error) {
      // Clear error after 3 seconds
      setTimeout(() => dispatch(clearError()), 3000);
    }
  }, [isAuthenticated, userRole, navigate, error, dispatch]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Dispatch login action with userId (which can be ID or email) and role
    dispatch(loginUser({ userId, password, role }));
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      const token = await result.user.getIdToken();
      const email = result.user.email;

      // Send BOTH email and token
      dispatch(googleLogin({ email, googleToken: token }));

    } catch (err) {
      console.error("Google Sign-in Error:", err);
    }
  };

  const getPlaceholder = () => {
    switch (role) {
      case "student": return "Admission Number / Email";
      case "teacher": return "Teacher ID / Email";
      case "schoolAdmin": return "Admin ID / Email";
      default: return "User ID";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">

        <div className="mb-6">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            School ERP Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select your role to login
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-2 text-center flex items-center justify-center gap-2 ${role === "student" ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold" : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setRole("student")}
          >
            <GraduationCap size={18} /> Student
          </button>
          <button
            className={`flex-1 py-2 text-center flex items-center justify-center gap-2 ${role === "teacher" ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold" : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setRole("teacher")}
          >
            <User size={18} /> Teacher
          </button>
          <button
            className={`flex-1 py-2 text-center flex items-center justify-center gap-2 ${role === "schoolAdmin" ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold" : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setRole("schoolAdmin")}
          >
            <School size={18} /> Admin
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              {getPlaceholder()}
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={`Enter ${getPlaceholder()}`}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : `Login as ${role === 'schoolAdmin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <img
                className="h-5 w-auto mr-2"
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
              />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
