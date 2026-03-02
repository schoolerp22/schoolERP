import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// Apply auth to all routes
router.use(verifyToken);



// Multer for logo/stamp uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "./uploads/school-settings";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/admin/school-settings
router.get("/", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const schoolId = req.user.schoolId || req.user.id;

        // Try exact match first, then fall back to any settings doc (single-school setup)
        let settings = await db.collection("school_settings").findOne({ schoolId });
        if (!settings || Object.keys(settings).length <= 2) {
            // Fall back to the most recently updated settings doc
            const all = await db.collection("school_settings")
                .find({})
                .sort({ updatedAt: -1 })
                .limit(1)
                .toArray();
            if (all.length > 0 && Object.keys(all[0]).length > 2) {
                settings = all[0];
            }
        }

        res.json(settings || { schoolId });
    } catch (err) {
        res.status(500).json({ message: "Error fetching settings", error: err.message });
    }
});

// PUT /api/admin/school-settings
router.put("/", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        // Always derive schoolId from the token — never trust what the frontend sends
        const schoolId = req.user.schoolId || req.user.id;

        if (!schoolId) {
            return res.status(400).json({ message: "Cannot determine school identity from token" });
        }

        // Strip immutable/derived fields before $set
        const { _id, schoolId: _sid, updatedAt: _u, ...rest } = req.body;
        const updates = { ...rest, schoolId, updatedAt: new Date() };

        await db.collection("school_settings").updateOne(
            { schoolId },
            { $set: updates },
            { upsert: true }
        );

        const saved = await db.collection("school_settings").findOne({ schoolId });
        res.json({ message: "Settings saved successfully", settings: saved });
    } catch (err) {
        res.status(500).json({ message: "Error saving settings", error: err.message });
    }
});

// POST /api/admin/school-settings/upload
// Handles: logo, favicon, principalSignature, schoolStamp
router.post(
    "/upload",
    authorizeRoles("schoolAdmin", "superAdmin"),
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "favicon", maxCount: 1 },
        { name: "principalSignature", maxCount: 1 },
        { name: "schoolStamp", maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const db = getDB(req);
            const schoolId = req.user.schoolId || req.user.admin_id;
            const updates = {};

            for (const [field, files] of Object.entries(req.files || {})) {
                if (files[0]) {
                    updates[field] = `/uploads/school-settings/${files[0].filename}`;
                }
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ message: "No files uploaded" });
            }

            await db.collection("school_settings").updateOne(
                { schoolId },
                { $set: { ...updates, schoolId, updatedAt: new Date() } },
                { upsert: true }
            );

            res.json({ message: "Files uploaded successfully", paths: updates });
        } catch (err) {
            res.status(500).json({ message: "Error uploading files", error: err.message });
        }
    }
);

export default router;
