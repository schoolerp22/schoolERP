import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendSignupSuccessEmail, sendOTPEmail } from "../utils/emailService.js";

const getDB = (req) => req.app.locals.db;

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "30d",
  });
};

// --- Helper to find user by ID/Email and Role ---
const findUser = async (db, loginId, role) => {
  // Normalize string (remove special hyphens etc if copied from docs)
  const id = String(loginId).trim();
  const isEmail = id.includes("@");

  if (role === 'student') {
    // Search by creds.id, admission_no, or email
    const query = {
      $or: [
        { "creds.id": id },
        { admission_no: id },
        { "personal_details.email": id }
      ]
    };
    const student = await db.collection("student").findOne(query);
    if (student) return { user: student, role: "student", collection: "student" };
  }

  if (role === 'teacher') {
    // Search by teacher_id or email
    const query = {
      $or: [
        { "creds.id": id },
        { teacher_id: id },
        { "personal_details.email": id }
      ]
    };
    const teacher = await db.collection("teachers").findOne(query);
    if (teacher) return { user: teacher, role: "teacher", collection: "teachers" };
  }

  if (role === 'schoolAdmin') {
    // Search by admin_id/username or email 
    const query = {
      $or: [
        { admin_id: id },
        { email: id }
      ]
    };

    let admin = await db.collection("schoolAdmin").findOne(query);
    if (admin) return { user: admin, role: "schoolAdmin", collection: "schoolAdmin" };

    // Also check generic 'admin' collection just in case
    admin = await db.collection("admin").findOne(query);
    if (admin) return { user: admin, role: "schoolAdmin", collection: "admin" };
  }

  // Fallback: If no role specified or not found in specific role, try global search (legacy behavior)
  if (!role) {
    let admin = await db.collection("schoolAdmin").findOne({ email: id });
    if (admin) return { user: admin, role: "schoolAdmin", collection: "schoolAdmin" };

    admin = await db.collection("admin").findOne({ email: id });
    if (admin) return { user: admin, role: "schoolAdmin", collection: "admin" };

    const teacher = await db.collection("teachers").findOne({ "personal_details.email": id });
    if (teacher) return { user: teacher, role: "teacher", collection: "teachers" };

    const student = await db.collection("student").findOne({ "personal_details.email": id });
    if (student) return { user: student, role: "student", collection: "student" };
  }

  return null;
};

export const validateUser = (req, res) => {
  res.json({ valid: true, user: req.user });
};

export const loginUser = async (req, res) => {
  try {
    const db = getDB(req);
    const { email, userId, password, googleToken, role } = req.body; // Added role
    const loginId = userId || email;

    console.log(`Login Attempt: ID=${loginId}, Role=${role || 'Auto-detect'}`);

    if (googleToken) {
      // --- GOOGLE LOGIN ---
      // For google login, we usually rely on email.
      const found = await findUser(db, loginId, role);
      if (!found) {
        return res.status(404).json({ message: "User not found. Please contact admin to register first." });
      }

      const { user, role: foundRole } = found;
      const token = generateToken(user._id, foundRole);
      return res.json({
        token,
        user: { ...user, role: foundRole },
        role: foundRole
      });
    }

    // --- ID/PASSWORD LOGIN ---
    if (!loginId || !password) {
      return res.status(400).json({ message: "User ID/Email and password required" });
    }

    const found = await findUser(db, loginId, role);
    if (!found) {
      return res.status(401).json({ message: "Invalid credentials or role" });
    }

    const { user, role: foundRole } = found;

    // Verify Password
    let isMatch = false;

    // Special check for Student or Teacher with 'creds' object
    if ((foundRole === 'student' || foundRole === 'teacher') && user.creds && user.creds.password) {
      // Direct string comparison as per user request (plain text or specific format)
      if (String(user.creds.password) === String(password)) {
        isMatch = true;
      }
    }

    // Fallback to bcrypt if not matched above (or not student with creds)
    if (!isMatch) {
      isMatch = await bcrypt.compare(password, user.password || "");
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, foundRole);
    res.json({
      token,
      user: { ...user, role: foundRole },
      role: foundRole
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const db = getDB(req);
    const { email } = req.body;
    const found = await findUserByEmail(db, email);

    if (!found) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    const { user, collection } = found;

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Save OTP to DB
    await db.collection(collection).updateOne(
      { _id: user._id },
      { $set: { resetPasswordOTP: otp, resetPasswordExpires: otpExpires } }
    );

    // Send Email
    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const db = getDB(req);
    const { email, otp } = req.body;
    const found = await findUserByEmail(db, email);

    if (!found) return res.status(404).json({ message: "User not found" });

    const { user } = found;

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    res.json({ message: "OTP Verified", valid: true });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const db = getDB(req);
    const { email, otp, newPassword } = req.body;
    const found = await findUserByEmail(db, email);

    if (!found) return res.status(404).json({ message: "User not found" });
    const { user, collection } = found;

    // Verify OTP again just in case
    if (user.resetPasswordOTP !== otp || new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({ message: "Invalid or Expired request" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP fields
    await db.collection(collection).updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordOTP: "", resetPasswordExpires: "" }
      }
    );

    res.json({ message: "Password reset successfully. You can now login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
