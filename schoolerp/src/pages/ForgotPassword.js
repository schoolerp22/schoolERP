import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, verifyOTP, resetPasswordAction, clearError } from "../feature/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";

export default function ForgotPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, message } = useSelector((state) => state.auth);

    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (error) {
            setTimeout(() => dispatch(clearError()), 3000);
        }
    }, [error, dispatch]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        const res = await dispatch(forgotPassword(email));
        if (res.meta.requestStatus === "fulfilled") {
            setStep(2);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const res = await dispatch(verifyOTP({ email, otp }));
        if (res.meta.requestStatus === "fulfilled") {
            setStep(3);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        const res = await dispatch(resetPasswordAction({ email, otp, newPassword }));
        if (res.meta.requestStatus === "fulfilled") {
            alert("Password reset successfully! Please login.");
            navigate("/login");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {step === 1 && "Forgot Password"}
                        {step === 2 && "Verify OTP"}
                        {step === 3 && "Reset Password"}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 1 && "Enter your email to receive an OTP"}
                        {step === 2 && `Enter the OTP sent to ${email}`}
                        {step === 3 && "Create a new password"}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                        {message}
                    </div>
                )}

                {/* STEP 1: Email Input */}
                {step === 1 && (
                    <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
                        <input
                            type="email"
                            required
                            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP Input */}
                {step === 2 && (
                    <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
                        <input
                            type="text"
                            required
                            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest text-2xl"
                            placeholder="000000"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                        <div className="text-center">
                            <button type="button" onClick={() => setStep(1)} className="text-sm text-indigo-600 hover:text-indigo-500">
                                Resend OTP / Change Email
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: New Password */}
                {step === 3 && (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <input
                            type="password"
                            required
                            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-4"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            required
                            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}

                <div className="flex items-center justify-center mt-6">
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Back to Login
                    </Link>
                </div>

            </div>
        </div>
    );
}
