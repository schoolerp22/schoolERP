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
    let user = null;
    let role = null;
    let uniqueId = null; // To store teacher_id, admission_no, or admin_id

    user = await db.collection("teachers").findOne({ teacher_id: userId });
    if (user) {
      role = "teacher";
      uniqueId = user.teacher_id; // "T-115"
    }

    if (!user) {
      user = await db.collection("students").findOne({ admission_no: userId });
      if (user) {
        role = "student";
        uniqueId = user.admission_no; // "2026-001"
      }
    }

    if (!user) {
      // Check schoolAdmin collection
      user = await db.collection("schoolAdmin").findOne({ admin_id: userId });
      if (user) {
        role = user.role || "schoolAdmin";
        uniqueId = user.admin_id;
      }
    }

    if (!user) {
      // Check admin collection
      user = await db.collection("admin").findOne({ admin_id: userId });
      if (user) {
        role = user.role || "schoolAdmin";
        uniqueId = user.admin_id;
      }
    }

    if (!user) {
      // Check admins collection (legacy/backwards compatibility)
      user = await db.collection("admins").findOne({ admin_id: userId });
      if (user) {
        role = user.role || "schoolAdmin";
        uniqueId = user.admin_id;
      }
    }

    if (!user) {
      // Check accountants collection
      user = await db.collection("accountants").findOne({ accountant_id: userId });
      if (user) {
        role = "accountant";
        uniqueId = user.accountant_id; // "ACC-001"
      }
    }

    if (!user) {
      // Check superAdmin collection
      user = await db.collection("superAdmins").findOne({ super_admin_id: userId });
      if (user) {
        role = "superAdmin";
        uniqueId = user.super_admin_id; // "SA-001"
      }
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Create JWT with MongoDB _id, role, and schoolId
    // In this system, admin_no acts as the schoolId context for students/teachers
    let schoolId = user.schoolId || user.admin_no || user.admin_id || "default_school";
    if (role === 'superAdmin') schoolId = 'super_admin_global';

    const token = jwt.sign(
      {
        id: user._id.toString(), // MongoDB ObjectId
        role: role,
        schoolId: schoolId
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Add role and uniqueId to user object
    const userResponse = {
      ...user,
      role,
      teacher_id: role === "teacher" ? uniqueId : undefined,
      admission_no: role === "student" ? uniqueId : undefined,
      admin_id: role === "schoolAdmin" ? uniqueId : undefined,
      accountant_id: role === "accountant" ? uniqueId : undefined,
      super_admin_id: role === "superAdmin" ? uniqueId : undefined,
      schoolId: schoolId
    };

    res.json({
      message: "Login Successful",
      token,
      role,
      user: userResponse,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;