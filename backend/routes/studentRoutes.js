import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// Normalize helper
const normalize = (v) => v.replace(/[\u2010-\u2015]/g, "-").trim();

// Helper to get student
const getStudent = async (db, studentId) => {
  // Check if studentId is a valid ObjectId (24 hex chars)
  if (ObjectId.isValid(studentId) && String(studentId).length === 24) {
    const student = await db.collection("student").findOne({ _id: new ObjectId(studentId) });
    if (student) return student;
  }

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
    const student = await getStudent(db, studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch attendance from attendance collection
    const attendance = await db
      .collection("attendance")
      .find({ admission_no: student.admission_no })
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
      return res.json({ message: "Timetable not present" });
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



// @route   POST /api/student/:studentId/leave
// @desc    Apply for leave
router.post("/:studentId/leave", async (req, res) => {
  try {
    const db = getDB(req);
    const { from_date, to_date, reason, type } = req.body;

    // Get student details
    const student = await getStudent(db, req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const leaveRequest = {
      admission_no: student.admission_no, // Link via admission_no as usual
      student_id: new ObjectId(student._id),
      student_name: `${student.personal_details.first_name} ${student.personal_details.last_name}`,
      class: student.class,
      section: student.section,

      from_date: new Date(from_date),
      to_date: new Date(to_date),
      reason,
      type: type || "General",

      status: "Pending", // Pending, Approved, Rejected
      request_date: new Date()
    };

    const result = await db.collection("leave_requests").insertOne(leaveRequest);

    res.json({
      message: "Leave application submitted successfully",
      leaveId: result.insertedId
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/student/:studentId/leaves
// @desc    Get student's leave history
router.get("/:studentId/leaves", async (req, res) => {
  try {
    const db = getDB(req);
    const student = await getStudent(db, req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const leaves = await db.collection("leave_requests")
      .find({ admission_no: student.admission_no })
      .sort({ request_date: -1 })
      .toArray();

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;