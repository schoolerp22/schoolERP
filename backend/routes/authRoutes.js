import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateUser } from "../controllers/authController.js";

const router = express.Router();

router.get("/validate", verifyToken, validateUser);

export default router;
