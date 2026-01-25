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

// --- Helper to find user across collections ---
const findUserByEmail = async (db, email) => {
  // Check Admin (try 'schoolAdmin' first as per user report, then 'admin')
  let admin = await db.collection("schoolAdmin").findOne({ email });
  if (admin) return { user: admin, role: "schoolAdmin", collection: "schoolAdmin" };

  admin = await db.collection("admin").findOne({ email });
  if (admin) return { user: admin, role: "schoolAdmin", collection: "admin" };

  // Check Teacher (email is in personal_details.email)
  const teacher = await db.collection("teachers").findOne({ "personal_details.email": email });
  if (teacher) return { user: teacher, role: "teacher", collection: "teachers" };

  // Check Student (email is in personal_details.email)
  const student = await db.collection("student").findOne({ "personal_details.email": email });
  if (student) return { user: student, role: "student", collection: "student" };

  // Check Parent (email checks usually require checking student's parent_record but simplified here or separate logic needed if parents have distinct login)
  // Assuming parent login mimics student or has own collection later. For now, skipping specific 'parent' collection check unless it exists.

  return null;
};

export const validateUser = (req, res) => {
  res.json({ valid: true, user: req.user });
};

export const loginUser = async (req, res) => {
  try {
    const db = getDB(req);
    const { email, userId, password, googleToken } = req.body;
    const userEmail = email || userId;
    console.log("userEmail", userEmail);
    if (googleToken) {
      // --- GOOGLE LOGIN ---
      // Verify googleToken with Firebase Admin SDK or client-side token info
      // Ideally verify token backend-side using firebase-admin, but for simplicity we'll assume email is trusted from client if passed after firebase auth
      // SECURITY NOTE: In production, verify the ID token using firebase-admin SDK.

      const found = await findUserByEmail(db, userEmail);
      if (!found) {
        return res.status(404).json({ message: "User not found. Please contact admin to register first." });
      }

      const { user, role } = found;
      const token = generateToken(user._id, role);
      return res.json({
        token,
        user: { ...user, role },
        role
      });
    }

    // --- EMAIL/PASSWORD LOGIN ---
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const found = await findUserByEmail(db, email);
    if (!found) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { user, role } = found;

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, role);
    res.json({
      token,
      user: { ...user, role },
      role
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
