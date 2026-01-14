import express from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const router = express.Router();

// Middleware to get DB from app
const getDB = (req) => req.app.locals.db;

// @route   GET /api/teacher/:teacherId/profile
// @desc    Get teacher profile
router.get("/:teacherId/profile", async (req, res) => {
  try {
    const db = getDB(req);
    const teacher = await db.collection("teachers").findOne({ 
      teacher_id: req.params.teacherId 
    });
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/students
// @desc    Get all students assigned to teacher
router.get("/:teacherId/students", async (req, res) => {
  try {
    const db = getDB(req);
    
    // First get teacher's assigned classes
    const teacher = await db.collection("teachers").findOne({ 
      teacher_id: req.params.teacherId 
    });
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    // Extract class-section combinations
    const classQuery = teacher.assigned_classes.map(ac => ({
      class: ac.class,
      section: ac.section
    }));
    
    // Get all students from those classes
    const students = await db.collection("students").find({
      $or: classQuery
    }).toArray();
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/students/:classSection
// @desc    Get students by specific class-section
router.get("/:teacherId/students/:classSection", async (req, res) => {
  try {
    const db = getDB(req);
    const [classNum, section] = req.params.classSection.split("-");
    
    const students = await db.collection("student").find({
      class: classNum,
      section: section
    }).toArray();
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/attendance
// @desc    Mark attendance for students
router.post("/:teacherId/attendance", async (req, res) => {
  try {
    const db = getDB(req);
    const { date, classSection, attendance } = req.body;
    // attendance: [{ admission_no: "2026-001", status: "Present" }, ...]
    
    const attendanceRecords = attendance.map(att => ({
      admission_no: att.admission_no,
      date: new Date(date),
      status: att.status,
      marked_by: req.params.teacherId,
      class_section: classSection,
      created_at: new Date()
    }));
    
    // Insert into attendance collection (create if doesn't exist)
    const result = await db.collection("attendance").insertMany(attendanceRecords);
    
    res.json({ 
      message: "Attendance marked successfully", 
      count: result.insertedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/attendance/:date/:classSection
// @desc    Get attendance for a specific date and class
router.get("/:teacherId/attendance/:date/:classSection", async (req, res) => {
  try {
    const db = getDB(req);
    const { date, classSection } = req.params;
    
    const attendance = await db.collection("attendance").find({
      date: new Date(date),
      class_section: classSection
    }).toArray();
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/homework
// @desc    Assign homework to class
router.post("/:teacherId/homework", async (req, res) => {
  try {
    const db = getDB(req);
    const { classSection, subject, topic, dueDate, description } = req.body;
    
    const homework = {
      teacher_id: req.params.teacherId,
      class_section: classSection,
      subject,
      topic,
      description,
      due_date: new Date(dueDate),
      assigned_date: new Date(),
      status: "Active"
    };
    
    const result = await db.collection("homework").insertOne(homework);
    
    // Also update teacher's homework_assigned array
    await db.collection("teachers").updateOne(
      { teacher_id: req.params.teacherId },
      { 
        $push: { 
          homework_assigned: {
            class: classSection,
            topic,
            due_date: dueDate
          }
        }
      }
    );
    
    res.json({ 
      message: "Homework assigned successfully", 
      homeworkId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/homework
// @desc    Get all homework assigned by teacher
router.get("/:teacherId/homework", async (req, res) => {
  try {
    const db = getDB(req);
    
    const homework = await db.collection("homework").find({
      teacher_id: req.params.teacherId
    }).sort({ assigned_date: -1 }).toArray();
    
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/announcement
// @desc    Create announcement
router.post("/:teacherId/announcement", async (req, res) => {
  try {
    const db = getDB(req);
    const { title, message, classSection, priority } = req.body;
    
    const announcement = {
      teacher_id: req.params.teacherId,
      title,
      message,
      class_section: classSection || "All",
      priority: priority || "Normal",
      created_at: new Date(),
      status: "Active"
    };
    
    const result = await db.collection("announcements").insertOne(announcement);
    
    res.json({ 
      message: "Announcement created successfully", 
      announcementId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/announcements
// @desc    Get all announcements by teacher
router.get("/:teacherId/announcements", async (req, res) => {
  try {
    const db = getDB(req);
    
    const announcements = await db.collection("announcements").find({
      teacher_id: req.params.teacherId
    }).sort({ created_at: -1 }).toArray();
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/leave-approval
// @desc    Approve/reject student leave request
router.post("/:teacherId/leave-approval", async (req, res) => {
  try {
    const db = getDB(req);
    const { leaveId, status, remarks } = req.body;
    // status: "Approved" or "Rejected"
    
    const result = await db.collection("leave_requests").updateOne(
      { _id: new ObjectId(leaveId) },
      { 
        $set: {
          status,
          approved_by: req.params.teacherId,
          approval_date: new Date(),
          remarks: remarks || ""
        }
      }
    );
    
    res.json({ 
      message: `Leave request ${status.toLowerCase()}`, 
      modified: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/leave-requests
// @desc    Get pending leave requests for teacher's classes
router.get("/:teacherId/leave-requests", async (req, res) => {
  try {
    const db = getDB(req);
    
    // Get teacher's classes
    const teacher = await db.collection("teachers").findOne({ 
      teacher_id: req.params.teacherId 
    });
    
    const classQuery = teacher.assigned_classes.map(ac => ({
      class: ac.class,
      section: ac.section
    }));
    
    // Get students from those classes
    const students = await db.collection("students").find({
      $or: classQuery
    }).toArray();
    
    const studentAdmissionNos = students.map(s => s.admission_no);
    
    // Get leave requests from those students
    const leaveRequests = await db.collection("leave_requests").find({
      admission_no: { $in: studentAdmissionNos },
      status: "Pending"
    }).sort({ request_date: -1 }).toArray();
    
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/dashboard-stats
// @desc    Get dashboard statistics
router.get("/:teacherId/dashboard-stats", async (req, res) => {
  try {
    const db = getDB(req);
    
    // Get teacher info
    const teacher = await db.collection("teachers").findOne({ 
      teacher_id: req.params.teacherId 
    });
    
    const classQuery = teacher.assigned_classes.map(ac => ({
      class: ac.class,
      section: ac.section
    }));
    
    // Total students
    const totalStudents = await db.collection("students").countDocuments({
      $or: classQuery
    });
    
    // Pending leave requests
    const students = await db.collection("students").find({
      $or: classQuery
    }).toArray();
    const studentAdmissionNos = students.map(s => s.admission_no);
    
    const pendingLeaves = await db.collection("leave_requests").countDocuments({
      admission_no: { $in: studentAdmissionNos },
      status: "Pending"
    });
    
    // Active homework
    const activeHomework = await db.collection("homework").countDocuments({
      teacher_id: req.params.teacherId,
      status: "Active",
      due_date: { $gte: new Date() }
    });
    
    // Today's attendance marked
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendanceMarked = await db.collection("attendance").countDocuments({
      marked_by: req.params.teacherId,
      date: { $gte: today }
    });
    
    res.json({
      totalStudents,
      pendingLeaves,
      activeHomework,
      attendanceMarked,
      assignedClasses: teacher.assigned_classes.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/teacher/:teacherId/reset-student-password
router.post("/:teacherId/reset-student-password", async (req, res) => {
  try {
    const db = getDB(req);
    const { admission_no, newPassword } = req.body;

    if (!admission_no || !newPassword)
      return res.status(400).json({ message: "Student id & password required" });

    // verify teacher has access to this student
    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId,
    });

    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const student = await db.collection("students").findOne({ admission_no });

    if (!student) return res.status(404).json({ message: "Student not found" });

    // ensure student belongs to teacher assigned classes
    const allowed = teacher.assigned_classes.some(
      (c) => c.class === student.class && c.section === student.section
    );

    if (!allowed)
      return res
        .status(403)
        .json({ message: "You cannot reset password of this student" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.collection("students").updateOne(
      { admission_no },
      { $set: { password: hashed } }
    );

    res.json({ message: "Student password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;