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

    // Extract class-section combinations with correct field paths and NUR capability
    const classQuery = teacher.assigned_classes.map(ac => ({
      "academic.current_class": isNaN(Number(ac.class)) ? ac.class : Number(ac.class),
      "academic.section": ac.section
    }));

    // Get all students from those classes
    const students = await db.collection("student").find({
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

    const [classNum, section] = req.params.classSection.split(/[-_]/);

    const classVal = isNaN(Number(classNum)) ? classNum : Number(classNum);

    let query = {
      "academic.current_class": classVal
    };

    if (section && section !== "undefined" && section !== "null") {
      query["academic.section"] = section;
    }

    const students = await db
      .collection("student")
      .find(query)
      .toArray();

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
    const teacherId = req.params.teacherId;

    //  Fetch teacher details
    const teacher = await db
      .collection("teachers")
      .findOne({ teacher_id: teacherId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacherName = teacher.personal_details?.name
      || `${teacher.personal_details?.first_name || ""} ${teacher.personal_details?.last_name || ""}`.trim();

    //  Prepare attendance records
    const attendanceRecords = attendance.map(att => ({
      admission_no: att.admission_no,
      date: new Date(date),
      status: att.status,
      class_section: classSection,

      // store both
      marked_by_id: teacherId,
      marked_by_name: teacherName,

      created_at: new Date()
    }));

    //  Insert records
    const result = await db
      .collection("attendance")
      .insertMany(attendanceRecords);

    res.json({
      message: "Attendance marked successfully",
      count: result.insertedCount
    });

  } catch (error) {
    console.error("Attendance insert error:", error);
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

// @route   GET /api/teacher/:teacherId/attendance-summary
// @desc    Get detailed attendance analytics (Full Year, Graphs, Top/Bottom)
router.get("/:teacherId/attendance-summary", async (req, res) => {
  try {
    const db = getDB(req);
    const { classSection } = req.query;

    if (!classSection) {
      return res.status(400).json({ message: "Class section is required" });
    }

    // 1. Get Class Total Students (Corrected for String/Number classes)
    const [classNum, section] = classSection.split("-");
    const classVal = isNaN(Number(classNum)) ? classNum : Number(classNum);

    const students = await db.collection("student").find({
      "academic.current_class": classVal,
      "academic.section": section
    }).toArray();

    if (students.length === 0) {
      return res.json({
        class_average: 0,
        total_school_days: 0,
        distribution: { below75: 0, between75and90: 0, above90: 0 },
        student_stats: []
      });
    }

    // 2. Get All Attendance Records for this Class
    const { range, startDate, endDate, month, year } = req.query;
    let dateFilter = {};

    if (range === "weekly") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = { date: { $gte: sevenDaysAgo } };
    } else if (range === "monthly") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { date: { $gte: thirtyDaysAgo } };
    } else if (range === "custom" && startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    } else if (range === "month" && month) {
      const targetYear = year || new Date().getFullYear();
      const startOfMonth = new Date(targetYear, month - 1, 1);
      const endOfMonth = new Date(targetYear, month, 0, 23, 59, 59, 999);
      dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    const attendanceRecords = await db.collection("attendance").find({
      class_section: classSection,
      ...dateFilter
    }).toArray();

    // 3. Calculate "Total School Days" (Count unique dates)
    const uniqueDates = new Set(attendanceRecords.map(a => new Date(a.date).toDateString()));
    const totalSchoolDays = uniqueDates.size;

    if (totalSchoolDays === 0) {
      return res.json({
        class_average: 0,
        total_school_days: 0,
        distribution: { below75: 0, between75and90: 0, above90: 0 },
        student_stats: []
      });
    }

    // 4. Calculate Stats per Student
    const studentStats = students.map(student => {
      const studentRecords = attendanceRecords.filter(r => r.admission_no === student.admission_no);
      const presentDays = studentRecords.filter(r => r.status === 'Present').length;

      // Find absent dates
      const absentRecords = studentRecords.filter(r => r.status === 'Absent');
      const absentDates = absentRecords.map(r => new Date(r.date).toISOString().split('T')[0]);

      // Percentage
      const percentage = ((presentDays / totalSchoolDays) * 100).toFixed(1);

      return {
        admission_no: student.admission_no,
        name: student.personal_details ? `${student.personal_details.first_name} ${student.personal_details.last_name}` : "Unknown",
        roll_no: student.academic?.roll_no || "N/A",
        present_days: presentDays,
        total_days: totalSchoolDays,
        absent_days: totalSchoolDays - presentDays,
        percentage: Number(percentage),
        absent_dates: absentDates
      };
    });

    // 5. Calculate Class Average
    const totalPercentage = studentStats.reduce((sum, s) => sum + s.percentage, 0);
    const classAverage = studentStats.length ? (totalPercentage / studentStats.length).toFixed(1) : 0;

    // 6. Distribution
    const distribution = {
      below75: studentStats.filter(s => s.percentage < 75).length,
      between75and90: studentStats.filter(s => s.percentage >= 75 && s.percentage < 90).length,
      above90: studentStats.filter(s => s.percentage >= 90).length
    };

    res.json({
      class_average: classAverage,
      total_school_days: totalSchoolDays,
      distribution,
      student_stats: studentStats
    });

  } catch (error) {
    console.error("Attendance Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/homework
// @desc    Assign homework to class
router.post("/:teacherId/homework", async (req, res) => {
  try {
    const db = getDB(req);
    const { classSection, subject, topic, dueDate, description, teacher } = req.body;
    if (!teacher || !teacher.id || !teacher.name) {
      return res.status(400).json({ message: "Teacher details are required" });
    }

    const homework = {
      teacher_id: req.params.teacherId,
      class_section: classSection,
      teacher: {
        id: teacher.id,
        name: teacher.name
      },
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
            subject,
            topic,
            due_date: new Date(dueDate)
          }
        }
      }
    );

    res.status(201).json({
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

    const {
      title,
      message,
      classSection,
      priority,
      teacher // ✅ destructure teacher
    } = req.body;

    const announcement = {
      teacher: {
        id: teacher?.id || req.params.teacherId,
        name: teacher?.name || "Unknown Teacher"
      },

      title,
      message,
      class_section: classSection || "All",
      priority: priority || "Normal",

      created_at: new Date(),
      status: "Active"
    };

    const result = await db
      .collection("announcements")
      .insertOne(announcement);

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

    const announcements = await db
      .collection("announcements")
      .find({
        $or: [
          { teacher_id: req.params.teacherId },
          { "teacher.id": req.params.teacherId }
        ]
      })
      .sort({ created_at: -1 })
      .toArray();


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

    // Fetch teacher's name for storage
    const teacher = await db.collection("teachers").findOne({ teacher_id: req.params.teacherId });
    const teacherName = teacher ? (teacher.personal_details?.name || `${teacher.personal_details?.first_name || ""} ${teacher.personal_details?.last_name || ""}`.trim()) : "Teacher";

    const result = await db.collection("leave_requests").updateOne(
      { _id: new ObjectId(leaveId) },
      {
        $set: {
          status,
          approved_by: req.params.teacherId,
          approved_by_name: teacherName,
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
// @desc    Get pending leave requests for teacher's classes with full student data
router.get("/:teacherId/leave-requests", async (req, res) => {
  try {
    const db = getDB(req);

    // Get teacher's classes
    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId
    });

    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const classQuery = teacher.assigned_classes.map(ac => ({
      class: ac.class,
      section: ac.section
    }));

    // Get students from those classes to get their admission numbers
    const students = await db.collection("student").find({
      $or: teacher.assigned_classes.map(ac => ({
        "academic.current_class": isNaN(Number(ac.class)) ? ac.class : Number(ac.class),
        "academic.section": ac.section
      }))
    }).toArray();

    const studentAdmissionNos = students.map(s => s.admission_no);

    // Get leave requests from those students
    const leaveRequests = await db.collection("leave_requests").find({
      admission_no: { $in: studentAdmissionNos },
      status: "Pending"
    }).sort({ request_date: -1 }).toArray();

    // Map student names and roll numbers for cleaner display
    const enrichedRequests = leaveRequests.map(req => {
      const student = students.find(s => s.admission_no === req.admission_no);
      return {
        ...req,
        student_name: student ? `${student.personal_details.first_name} ${student.personal_details.last_name}` : req.student_name,
        roll_no: student?.academic?.roll_no || "N/A",
        class_section: `${student?.academic?.current_class || req.class}-${student?.academic?.section || req.section}`
      };
    });

    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/leave-history
// @desc    Get all leave history for teacher's students
router.get("/:teacherId/leave-history", async (req, res) => {
  try {
    const db = getDB(req);
    const teacher = await db.collection("teachers").findOne({ teacher_id: req.params.teacherId });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const classQuery = teacher.assigned_classes.map(ac => ({
      class: ac.class,
      section: ac.section
    }));

    const students = await db.collection("student").find({
      $or: teacher.assigned_classes.map(ac => ({
        "academic.current_class": isNaN(Number(ac.class)) ? ac.class : Number(ac.class),
        "academic.section": ac.section
      }))
    }).toArray();
    const studentAdmissionNos = students.map(s => s.admission_no);

    const history = await db.collection("leave_requests")
      .find({ admission_no: { $in: studentAdmissionNos } })
      .sort({ request_date: -1 })
      .toArray();

    // Enrich with roll no and fixed names
    const enrichedHistory = history.map(h => {
      const student = students.find(s => s.admission_no === h.admission_no);
      return {
        ...h,
        student_name: student ? `${student.personal_details.first_name} ${student.personal_details.last_name}` : h.student_name,
        roll_no: student?.academic?.roll_no || "N/A",
        class_section: `${student?.academic?.current_class || h.class}-${student?.academic?.section || h.section}`
      };
    });

    res.json(enrichedHistory);
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
    const totalStudents = await db.collection("student").countDocuments({
      $or: teacher.assigned_classes.map(ac => ({
        "academic.current_class": isNaN(Number(ac.class)) ? ac.class : Number(ac.class),
        "academic.section": ac.section
      }))
    });

    // Pending leave requests
    const students = await db.collection("student").find({
      $or: teacher.assigned_classes.map(ac => ({
        "academic.current_class": isNaN(Number(ac.class)) ? ac.class : Number(ac.class),
        "academic.section": ac.section
      }))
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

// @route   GET /api/teacher/:teacherId/approved-leaves
// @desc    Get students on approved leave for a specific date
router.get("/:teacherId/approved-leaves", async (req, res) => {
  try {
    const db = getDB(req);
    const { date, classSection } = req.query; // date is YYYY-MM-DD

    if (!date || !classSection) {
      return res.status(400).json({ message: "Date and class section required" });
    }

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const checkDateEnd = new Date(date);
    checkDateEnd.setHours(23, 59, 59, 999);

    // Find leaves that are APPROVED and OVERLAP with the checkDate
    const leaves = await db.collection("leave_requests").find({
      status: "Approved",
      // Leave Start <= Check Date AND Leave End >= Check Date 
      // (Simple check: from_date <= checkDateEnd AND to_date >= checkDate)
      from_date: { $lte: checkDateEnd },
      to_date: { $gte: checkDate },
      // Optional: Filter by class section strictly, or just rely on teacher's view filtering
      // Adding it for optimization if stored, but 'leave_requests' has 'class' and 'section' fields
      // Format of classSection param is usually "10-A"
    }).toArray();

    // Filter by class/section manually if needed or better via query
    const [classNum, section] = classSection.split("-");

    // The leave request stores class as number usually? Let's check previous insert code
    // Inserted as: class: student.class, section: student.section
    // Student document uses 'academic.current_class' (number) usually, but locally stored "class" usually.
    // Let's filter in memory to be safe against schema variations or add to query if sure.

    const filteredLeaves = leaves.filter(l =>
      String(l.class) === String(classNum) &&
      String(l.section) === String(section)
    );

    res.json(filteredLeaves);

  } catch (error) {
    console.error("Approved Leaves Error:", error);
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

    const student = await db.collection("student").findOne({ admission_no });

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

    await db.collection("student").updateOne(
      { admission_no },
      { $set: { password: hashed } }
    );

    res.json({ message: "Student password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;