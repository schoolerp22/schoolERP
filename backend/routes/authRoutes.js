import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
    validateUser,
    loginUser,
    forgotPassword,
    verifyOTP,
    resetPassword
} from "../controllers/authController.js";

const router = express.Router();

router.get("/validate", verifyToken, validateUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
