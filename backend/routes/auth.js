import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const getDB = (req) => req.app.locals.db;

// @route POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const db = getDB(req);
    const { userId, password } = req.body;

    if (!userId || !password)
      return res.status(400).json({ message: "User ID & Password required" });

    // check in all possible collections
    const user =
      (await db.collection("teachers").findOne({ teacher_id: userId })) ||
      (await db.collection("students").findOne({ admission_no: userId })) ||
      (await db.collection("admins").findOne({ admin_id: userId }));

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: userId, role: user.role || "student" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login Successful",
      token,
      role: user.role || "student",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
