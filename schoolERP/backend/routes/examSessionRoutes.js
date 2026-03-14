import express from "express";
import { ObjectId } from "mongodb";
import { CBSE_EXAM_TYPES } from "../utils/markingSchemeTemplates.js";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// Helper to get academic year safely
const currentAcademicYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    const start = now.getMonth() < 3 ? y - 1 : y;
    return `${start}-${start + 1}`;
};

/**
 * @route   POST /api/exam-sessions
 * @desc    Create a new exam session (e.g. FA1 2025-2026 for Class 9)
 */
router.post("/", async (req, res) => {
    try {
        const db = getDB(req);
        const {
            name,
            exam_type,
            academic_year,
            start_date,
            end_date,
            applicable_classes,
            term
        } = req.body;

        // Validation
        if (!name || !exam_type || !applicable_classes || !applicable_classes.length) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const year = academic_year || currentAcademicYear();

        // Find exam type metadata
        const typeMeta = CBSE_EXAM_TYPES.find(t => t.code === exam_type) || {};

        const session = {
            name,
            exam_type,
            term: term || typeMeta.term || null,
            academic_year: year,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null,
            applicable_classes: applicable_classes.map(c => String(c)),
            status: "Scheduled", // Scheduled, Active, Completed, Published
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await db.collection("exam_sessions").insertOne(session);

        res.status(201).json({
            message: "Exam session created successfully",
            session_id: result.insertedId,
            session
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/exam-sessions
 * @desc    Get exam sessions with filters
 */
router.get("/", async (req, res) => {
    try {
        const db = getDB(req);
        const { academic_year, class: className, status, term } = req.query;

        let query = {};

        if (academic_year) query.academic_year = academic_year;
        if (className) query.applicable_classes = String(className);
        if (status) query.status = status;
        if (term) query.term = parseInt(term);

        const sessions = await db.collection("exam_sessions")
            .find(query)
            .sort({ start_date: 1, created_at: -1 })
            .toArray();

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/exam-sessions/:sessionId
 * @desc    Get single exam session with its subjects
 */
router.get("/:sessionId", async (req, res) => {
    try {
        const db = getDB(req);
        const sessionId = req.params.sessionId;

        if (!ObjectId.isValid(sessionId)) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const session = await db.collection("exam_sessions").findOne({
            _id: new ObjectId(sessionId)
        });

        if (!session) {
            return res.status(404).json({ message: "Exam session not found" });
        }

        // Get subjects for this session
        const subjects = await db.collection("exam_subjects").find({
            exam_session_id: sessionId
        }).toArray();

        res.json({ ...session, subjects });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   POST /api/exam-sessions/:sessionId/subjects
 * @desc    Add subjects to an exam session
 */
router.post("/:sessionId/subjects", async (req, res) => {
    try {
        const db = getDB(req);
        const sessionId = req.params.sessionId;
        const { subjects } = req.body; // Array of { class, subject, max_marks, pass_marks, exam_date }

        if (!ObjectId.isValid(sessionId)) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        if (!Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ message: "Subjects array is required" });
        }

        const session = await db.collection("exam_sessions").findOne({
            _id: new ObjectId(sessionId)
        });

        if (!session) {
            return res.status(404).json({ message: "Exam session not found" });
        }

        const newSubjects = subjects.map(sub => ({
            exam_session_id: sessionId,
            class: String(sub.class),
            subject: sub.subject,
            max_marks: Number(sub.max_marks || 100),
            pass_marks: Number(sub.pass_marks || 33),
            exam_date: sub.exam_date ? new Date(sub.exam_date) : null,
            created_at: new Date()
        }));

        await db.collection("exam_subjects").insertMany(newSubjects);

        res.json({
            message: `${newSubjects.length} subjects added successfully`,
            session_id: sessionId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/exam-sessions/:sessionId/status
 * @desc    Update session status (e.g. to "Published" when results are out)
 */
router.put("/:sessionId/status", async (req, res) => {
    try {
        const db = getDB(req);
        const sessionId = req.params.sessionId;
        const { status } = req.body;

        if (!ObjectId.isValid(sessionId) || !status) {
            return res.status(400).json({ message: "Invalid session ID or status" });
        }

        await db.collection("exam_sessions").updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { status, updated_at: new Date() } }
        );

        res.json({ message: "Status updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
