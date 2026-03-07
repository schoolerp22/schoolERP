import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendSignupSuccessEmail, sendOTPEmail } from "../utils/emailService.js";

const getDB = (req) => req.app.locals.db;

const generateToken = (id, role, schoolId) => {
  return jwt.sign(
    { id, role, schoolId: schoolId || 'default_school' },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "30d" }
  );
};

// --- Helper to find user by ID/Email and Role ---
const findUser = async (db, loginId, role) => {
  const id = String(loginId).trim();
  const isEmail = id.includes("@");
  // Use case-insensitive regex for email
  const idRegex = isEmail ? new RegExp(`^${id}$`, "i") : id;

  // Handle numeric IDs (like mobile numbers or admission numbers stored as Numbers)
  const idAsNum = Number(id);
  const isNumeric = !isNaN(idAsNum) && id !== "" && id.match(/^\d+$/);

  console.log(`[AUTH] Searching for user: "${id}", Role: "${role || 'Auto-detect'}", isEmail: ${isEmail}, isNumeric: ${isNumeric}`);

  // Helper to check singular/plural collection names
  const checkCol = async (singular, plural, query, roleLabel) => {
    let user = await db.collection(plural).findOne(query);
    if (user) {
      console.log(`[AUTH] Found in plural collection: "${plural}"`);
      return { user, role: roleLabel, collection: plural };
    }
    user = await db.collection(singular).findOne(query);
    if (user) {
      console.log(`[AUTH] Found in singular collection: "${singular}"`);
      return { user, role: roleLabel, collection: singular };
    }
    return null;
  };

  if (role === 'student') {
    const $or = [{ "creds.id": id }, { admission_no: id }, { "personal_details.email": idRegex }];
    if (isNumeric) $or.push({ admission_no: idAsNum });
    return await checkCol("student", "students", { $or }, "student");
  }

  if (role === 'teacher') {
    const $or = [{ "creds.id": id }, { teacher_id: id }, { "personal_details.email": idRegex }];
    if (isNumeric) $or.push({ teacher_id: idAsNum });
    return await checkCol("teacher", "teachers", { $or }, "teacher");
  }

  if (role === 'schoolAdmin') {
    const $or = [{ admin_id: id }, { email: idRegex }];
    if (isNumeric) $or.push({ admin_id: idAsNum });
    let found = await checkCol("schoolAdmin", "schoolAdmins", { $or }, "schoolAdmin");
    if (!found) found = await checkCol("admin", "admins", { $or }, "schoolAdmin");
    return found;
  }

  if (role === 'accountant') {
    const $or = [{ accountant_id: id }, { email: idRegex }, { admin_id: id }];
    if (isNumeric) {
      $or.push({ accountant_id: idAsNum });
      $or.push({ admin_id: idAsNum });
    }
    let found = await checkCol("accountant", "accountants", { $or }, "accountant");
    if (!found) found = await db.collection("admin").findOne({ $or, role: "accountant" });
    if (found && !found.user) return { user: found, role: "accountant", collection: "admin" };
    return found;
  }

  if (role === 'parent') {
    const $or = [{ parent_id: id }, { mobile: id }, { email: idRegex }];
    if (isNumeric) {
      $or.push({ mobile: idAsNum });
      $or.push({ parent_id: idAsNum });
    }
    return await checkCol("parent", "parents", { $or }, "parent");
  }

  // Fallback: Global Search
  if (!role) {
    console.log(`[AUTH] No role specified, checking all collections...`);
    // Build generic numeric query if applicable
    const mobileQuery = isNumeric ? { $or: [{ mobile: id }, { mobile: idAsNum }] } : { mobile: id };
    const admissionNoQuery = isNumeric ? { $or: [{ admission_no: id }, { admission_no: idAsNum }] } : { admission_no: id };

    // Admins
    let found = await db.collection("schoolAdmin").findOne({ $or: [{ email: idRegex }, { admin_id: id }, ...(isNumeric ? [{ admin_id: idAsNum }] : [])] });
    if (found) return { user: found, role: found.role || "schoolAdmin", collection: "schoolAdmin" };
    found = await db.collection("admin").findOne({ $or: [{ email: idRegex }, { admin_id: id }, ...(isNumeric ? [{ admin_id: idAsNum }] : [])] });
    if (found) return { user: found, role: found.role || "schoolAdmin", collection: "admin" };

    // Teacher
    found = await db.collection("teachers").findOne({ $or: [{ "personal_details.email": idRegex }, { teacher_id: id }, { "creds.id": id }, ...(isNumeric ? [{ teacher_id: idAsNum }] : [])] });
    if (found) return { user: found, role: "teacher", collection: "teachers" };

    // Student
    found = await db.collection("student").findOne({ $or: [{ "personal_details.email": idRegex }, admissionNoQuery, { "creds.id": id }] });
    if (found) return { user: found, role: "student", collection: "student" };

    // Parent
    found = await db.collection("parents").findOne({ $or: [{ email: idRegex }, mobileQuery, { parent_id: id }, ...(isNumeric ? [{ parent_id: idAsNum }] : [])] });
    if (found) return { user: found, role: "parent", collection: "parents" };
  }

  console.log(`[AUTH] User not found for ID: "${id}"`);
  return null;
};

export const validateUser = async (req, res) => {
  try {
    const db = getDB(req);
    const { id, role } = req.user; // from token (id is _id)

    if (!id) return res.status(401).json({ valid: false, message: "Invalid token data" });

    const objId = new ObjectId(id);
    let user = null;

    if (role === 'teacher') {
      user = await db.collection("teachers").findOne({ _id: objId });
      if (!user) user = await db.collection("teacher").findOne({ _id: objId });
    } else if (role === 'student') {
      user = await db.collection("student").findOne({ _id: objId });
      if (!user) user = await db.collection("students").findOne({ _id: objId });
    } else if (role === 'schoolAdmin') {
      user = await db.collection("schoolAdmin").findOne({ _id: objId });
      if (!user) user = await db.collection("schoolAdmins").findOne({ _id: objId });
      if (!user) user = await db.collection("admin").findOne({ _id: objId });
      if (!user) user = await db.collection("admins").findOne({ _id: objId });
    } else if (role === 'accountant') {
      user = await db.collection("accountants").findOne({ _id: objId });
      if (!user) user = await db.collection("accountant").findOne({ _id: objId });
      if (!user) user = await db.collection("admin").findOne({ _id: objId, role: "accountant" });
    } else if (role === 'parent') {
      user = await db.collection("parents").findOne({ _id: objId });
      if (!user) user = await db.collection("parent").findOne({ _id: objId });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    // Return full user with role
    res.json({ valid: true, user: { ...user, role } });

  } catch (error) {
    console.error("Validate User Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- Helper to find user by Email across all roles (Case-Insensitive) ---
const findUserByEmail = async (db, email) => {
  const normalizedEmail = String(email).trim();
  const emailRegex = new RegExp(`^${normalizedEmail}$`, "i");

  // Helper to check singular/plural
  const checkByEmail = async (singular, plural, query, roleLabel) => {
    let user = await db.collection(plural).findOne(query);
    if (user) return { user, role: roleLabel, collection: plural };
    user = await db.collection(singular).findOne(query);
    if (user) return { user, role: roleLabel, collection: singular };
    return null;
  };

  // Check Admin
  let found = await checkByEmail("schoolAdmin", "schoolAdmins", { email: emailRegex }, "schoolAdmin");
  if (!found) found = await checkByEmail("admin", "admins", { email: emailRegex }, "schoolAdmin");
  if (found) return found;

  // Check Teacher
  found = await checkByEmail("teacher", "teachers", { "personal_details.email": emailRegex }, "teacher");
  if (found) return found;

  // Check Student
  found = await checkByEmail("student", "students", { "personal_details.email": emailRegex }, "student");
  if (found) return found;

  // Check Parent
  found = await checkByEmail("parent", "parents", { email: emailRegex }, "parent");
  if (found) return found;

  return null;
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
      const schoolId = user.schoolId || user.admin_no || user.admin_id || 'default_school';
      const token = generateToken(user._id, foundRole, schoolId);
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

    // Derive schoolId from user document
    const schoolId = user.schoolId || user.admin_no || user.admin_id || 'default_school';
    const token = generateToken(user._id, foundRole, schoolId);
    res.json({
      token,
      user: { ...user, role: foundRole, schoolId },
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
    const { user, collection, role } = found;

    // Verify OTP again just in case
    if (user.resetPasswordOTP !== otp || new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({ message: "Invalid or Expired request" });
    }

    const updateData = {
      $unset: { resetPasswordOTP: "", resetPasswordExpires: "" }
    };

    // For students and teachers using 'creds' object with plain text
    if ((role === 'student' || role === 'teacher') && user.creds) {
      updateData.$set = { "creds.password": newPassword };
    } else {
      // For Admins or others using hashed passwords
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.$set = { password: hashedPassword };
    }

    // Update password and clear OTP fields
    await db.collection(collection).updateOne({ _id: user._id }, updateData);

    res.json({ message: "Password reset successfully. You can now login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
