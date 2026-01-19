import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// Normalize helper
const normalize = (v) => v.replace(/[\u2010-\u2015]/g, "-").trim();

// Helper to get student
const getStudent = async (db, studentId) => {
  return await db.collection("student").findOne({
    admission_no: normalize(studentId)
  });
};

/**
 * GET /api/student/:studentId/profile
 */
router.get("/:studentId/profile", async (req, res) => {
  try {
    console.log("Requested ID =", req.params.studentId);
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);

    console.log("Student Found =", student);

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET Homework Assigned to Student (by class + section)
 * This one works because homework IS in a separate collection
 */
router.get("/:studentId/homework", async (req, res) => {
  try {
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);

    if (!student) return res.status(404).json({ message: "Student not found" });

    const homework = await db
      .collection("homework")
      .find({
        class_section: `${student.class}-${student.section}`,
        status: "Active",
      })
      .sort({ assigned_date: -1 })
      .toArray();

    res.json(homework);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET Attendance - NOW RETURNS FROM STUDENT DOCUMENT
 */
router.get("/:studentId/attendance", async (req, res) => {
  try {
    const db = getDB(req);
    const studentId = req.params.studentId;

    //  Verify student exists
    const student = await db
      .collection("student")
      .findOne({ admission_no: studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch attendance from attendance collection
    const attendance = await db
      .collection("attendance")
      .find({ admission_no: studentId })
      .sort({ date: 1 })
      .toArray();

    res.json(attendance);
  } catch (err) {
    console.error("Attendance fetch error:", err);
    res.status(500).json({ message: err.message });
  }
});


/**
 * GET Exam Marks - NOW RETURNS FROM STUDENT DOCUMENT
 */
router.get("/:studentId/exams", async (req, res) => {
  try {
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);

    if (!student) return res.status(404).json({ message: "Student not found" });

    // Return exam_records array from student document
    res.json(student.exam_records || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET Fees / Payments - NOW RETURNS FROM STUDENT DOCUMENT
 */
router.get("/:studentId/payments", async (req, res) => {
  try {
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);

    if (!student) return res.status(404).json({ message: "Student not found" });

    // Return payment_history array from student document
    res.json(student.payment_history || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET Transport Details - NOW RETURNS FROM STUDENT DOCUMENT
 */
router.get("/:studentId/transport", async (req, res) => {
  try {
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);

    if (!student) return res.status(404).json({ message: "Student not found" });

    // Return transport object from student document
    res.json(student.transport || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET Timetable (based on class + section)
 * Assuming this IS in a separate collection
 */
router.get("/:studentId/timetable", async (req, res) => {
  try {
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const record = await db.collection("time_table").findOne({
      "0.class": student.class,
      "0.section": student.section,
    });

    if (!record) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // send only timetable object
    res.json(record["0"].timetable);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



/**
 * GET Announcements
 * Assuming this IS in a separate collection
 */
router.get("/:studentId/announcements", async (req, res) => {
  try {
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);

    if (!student) return res.status(404).json({ message: "Student not found" });

    const announcements = await db
      .collection("announcements")
      .find({
        $or: [
          { class_section: "All" },
          { class_section: `${student.class}-${student.section}` },
        ],
        status: "Active",
      })
      .sort({ created_at: -1 })
      .toArray();

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



export default router;