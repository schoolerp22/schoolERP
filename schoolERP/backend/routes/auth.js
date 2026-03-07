import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const getDB = (req) => req.app.locals.db;

// @route POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const db = getDB(req);
    const { userId, password, role: requestedRole } = req.body;

    if (!userId || !password)
      return res.status(400).json({ message: "User ID & Password required" });

    // check in all possible collections, starting with the requested role
    let user = null;
    let role = null;
    let uniqueId = null; // To store teacher_id, admission_no, or admin_id

    // Helper function to check a specific collection
    const checkCollection = async (collectionName, query, expectedRole, idField) => {
      const foundUser = await db.collection(collectionName).findOne(query);
      if (foundUser) {
        user = foundUser;
        role = foundUser.role || expectedRole;
        uniqueId = foundUser[idField];
        return true;
      }
      return false;
    };

    // If frontend requested a specific role, check that collection FIRST
    if (requestedRole === "parent") {
      await checkCollection("parents", { $or: [{ parent_id: userId }, { mobile: userId }, { email: userId }] }, "parent", "parent_id");
    } else if (requestedRole === "student") {
      await checkCollection("students", { admission_no: userId }, "student", "admission_no");
    } else if (requestedRole === "teacher") {
      await checkCollection("teachers", { teacher_id: userId }, "teacher", "teacher_id");
    } else if (requestedRole === "accountant") {
      await checkCollection("accountants", { accountant_id: userId }, "accountant", "accountant_id");
    } else if (requestedRole === "schoolAdmin") {
      await checkCollection("schoolAdmin", { admin_id: userId }, "schoolAdmin", "admin_id");
      if (!user) await checkCollection("admin", { admin_id: userId }, "schoolAdmin", "admin_id");
      if (!user) await checkCollection("admins", { admin_id: userId }, "schoolAdmin", "admin_id");
    } else if (requestedRole === "superAdmin") {
      await checkCollection("superAdmins", { super_admin_id: userId }, "superAdmin", "super_admin_id");
    }

    // Fallback: If no user found yet, check all in order
    if (!user) await checkCollection("teachers", { teacher_id: userId }, "teacher", "teacher_id");
    if (!user) await checkCollection("students", { admission_no: userId }, "student", "admission_no");
    if (!user) await checkCollection("schoolAdmin", { admin_id: userId }, "schoolAdmin", "admin_id");
    if (!user) await checkCollection("admin", { admin_id: userId }, "schoolAdmin", "admin_id");
    if (!user) await checkCollection("admins", { admin_id: userId }, "schoolAdmin", "admin_id");
    if (!user) await checkCollection("accountants", { accountant_id: userId }, "accountant", "accountant_id");
    if (!user) await checkCollection("superAdmins", { super_admin_id: userId }, "superAdmin", "super_admin_id");
    if (!user) await checkCollection("parents", { $or: [{ parent_id: userId }, { mobile: userId }, { email: userId }] }, "parent", "parent_id");

    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("---- LOGIN ATTEMPT ----");
    console.log("Requested Role:", requestedRole);
    console.log("Found Role:", role);
    console.log("User found?", !!user);
    if (user) console.log("User ID:", user._id);

    // Validate if the user's role matches the requested role from the frontend tab
    if (requestedRole && role !== requestedRole) {
      return res.status(401).json({ message: "Invalid credentials or role", debug: { requestedRole, actualRole: role, userId } });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials", debug: { isMatch, providedPass: password, dbPass: user.password } });

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