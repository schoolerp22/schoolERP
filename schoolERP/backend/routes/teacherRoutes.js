import express from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const router = express.Router();

// Middleware to get DB from app
const getDB = (req) => req.app.locals.db;

// Helper to build class query from assigned classes
const buildClassQuery = (assignedClasses) => {
  if (!assignedClasses || assignedClasses.length === 0) return { admission_no: "__NONE__" };

  return {
    $or: assignedClasses.map(ac => {
      const q = {
        "academic.current_class": isNaN(Number(ac.class)) ? ac.class : Number(ac.class)
      };
      if (ac.section && ac.section !== "undefined" && ac.section !== "null" && ac.section !== "All") {
        q["academic.section"] = ac.section;
      }
      return q;
    })
  };
};

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
    const classQuery = buildClassQuery(teacher.assigned_classes);

    // Get all students from those classes
    const students = await db.collection("student").find(classQuery).toArray();

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forced restart trigger: Fixed results upload calculationsSection
// @route   GET /api/teacher/:teacherId/students/:classSection
// @desc    Get students by specific class-section
router.get("/:teacherId/students/:classSection", async (req, res) => {
  try {
    const db = getDB(req);

    const parts = req.params.classSection.split('-');
    const section = parts.length > 1 ? parts.pop() : null;
    const classNum = parts.join('-');

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

    // Map students to flatten structure for frontend
    const mappedStudents = students.map(s => ({
      ...s,
      roll_no: s.academic?.roll_no || s.roll_no || "N/A",
      class: s.academic?.current_class || s.class,
      section: s.academic?.section || s.section
    }));

    res.json(mappedStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @route   POST /api/teacher/:teacherId/attendance
// @desc    Mark or Update attendance for students
router.post("/:teacherId/attendance", async (req, res) => {
  try {
    const db = getDB(req);
    const { date, classSection, attendance, reason } = req.body;
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

    // Parse date using strict UTC to avoid timezone confusion
    // date format is YYYY-MM-DD
    const [year, month, day] = date.split('-').map(num => parseInt(num, 10));

    // Create UTC date range for this calendar day
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // For comparison with today, use local date
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // DATE RESTRICTIONS
    // 1. Block future dates completely
    if (localDate > today) {
      return res.status(403).json({ message: "Cannot mark attendance for future dates." });
    }

    // 2. For past dates, check if backlog is open
    if (localDate < today) {
      // Check for open backlog window
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const backlog = await db.collection("attendance_backlog").findOne({
        status: "Open",
        start_date: { $lte: startOfDay },
        end_date: { $gte: endOfDay },
        // Ensure the current date is not strictly past the window's end date
        $or: [
          { end_date: { $gte: today } }
        ],
        $or: [
          { class_section: classSection },
          { class_section: "All" }
        ]
      });

      if (!backlog) {
        return res.status(403).json({
          message: "Cannot mark attendance for past dates. Backlog window is not open.",
          requiresBacklog: true
        });
      }
    }

    // Check for existing attendance using UTC range query
    const existingRecordsCount = await db.collection("attendance").countDocuments({
      class_section: classSection,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const isUpdate = existingRecordsCount > 0;

    // 3. Restriction: Cannot edit past attendance (even with backlog, only fresh marking allowed)
    // Note: If you want to allow editing with backlog, remove this check
    if (isUpdate && localDate < today) {
      return res.status(400).json({ message: "Cannot edit past attendance records." });
    }

    // 4. Restriction: Reason required for updates
    if (isUpdate && !reason) {
      return res.status(400).json({ message: "A reason is required to edit attendance." });
    }

    // Prepare records - store at start of UTC day for consistency
    const attendanceRecords = attendance.map(att => ({
      admission_no: att.admission_no,
      date: startOfDay,
      status: att.status,
      class_section: classSection,

      marked_by_id: teacherId,
      marked_by_name: teacherName,

      created_at: new Date(),

      // Edit tracking
      is_edited: isUpdate,
      edit_note: isUpdate ? reason : null,
      edited_at: isUpdate ? new Date() : null
    }));

    if (isUpdate) {
      // DELETE existing records for this day/class before inserting new ones
      await db.collection("attendance").deleteMany({
        class_section: classSection,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
    }

    //  Insert records
    const result = await db
      .collection("attendance")
      .insertMany(attendanceRecords);

    res.json({
      message: isUpdate ? "Attendance updated successfully" : "Attendance marked successfully",
      count: result.insertedCount,
      isUpdate
    });

  } catch (error) {
    console.error("Attendance insert/update error:", error);
    res.status(500).json({ message: error.message });
  }
});


// @route   GET /api/teacher/:teacherId/attendance/:date/:classSection
// @desc    Get attendance for a specific date and class
router.get("/:teacherId/attendance/:date/:classSection", async (req, res) => {
  try {
    const db = getDB(req);
    const { date, classSection } = req.params;

    // Robust UTC Range Query
    // Parse YYYY-MM-DD strictly as UTC limits
    const [year, month, day] = date.split('-').map(num => parseInt(num, 10));

    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const attendance = await db.collection("attendance").find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      class_section: classSection
    }).toArray();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/backlog-status/:date/:classSection
// @desc    Check if attendance can be marked for a specific date (backlog check)
router.get("/:teacherId/backlog-status/:date/:classSection", async (req, res) => {
  try {
    const db = getDB(req);
    const { date, classSection } = req.params;

    // Parse date
    const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Future date check
    if (localDate > today) {
      return res.json({
        allowed: false,
        reason: "Future dates are not allowed",
        isFuture: true
      });
    }

    // Today is always allowed
    if (localDate.getTime() === today.getTime()) {
      return res.json({
        allowed: true,
        reason: "Today's attendance",
        isToday: true
      });
    }

    // Past date - check backlog
    const backlog = await db.collection("attendance_backlog").findOne({
      status: "Open",
      start_date: { $lte: startOfDay },
      end_date: { $gte: endOfDay },
      $or: [
        { class_section: classSection },
        { class_section: "All" }
      ]
    });

    if (backlog) {
      return res.json({
        allowed: true,
        reason: `Backlog open: ${backlog.reason || 'No reason provided'}`,
        backlog: {
          start_date: backlog.start_date,
          end_date: backlog.end_date,
          reason: backlog.reason
        }
      });
    }

    return res.json({
      allowed: false,
      reason: "Backlog window not open for this date",
      isPast: true
    });

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

import upload from "../middleware/upload.js";

// @route   POST /api/teacher/:teacherId/homework
// @desc    Assign homework to class (with optional file)
router.post("/:teacherId/homework", upload.single('attachment'), async (req, res) => {
  try {
    const db = getDB(req);
    const { classSection, subject, topic, dueDate, description, teacher } = req.body;

    // Parse teacher if it came as string (due to FormData)
    let teacherObj = teacher;
    if (typeof teacher === 'string') {
      try {
        teacherObj = JSON.parse(teacher);
      } catch (e) {
        console.error("Error parsing teacher JSON", e);
      }
    }

    if (!teacherObj || !teacherObj.id || !teacherObj.name) {
      return res.status(400).json({ message: "Teacher details are required" });
    }

    const homework = {
      teacher_id: req.params.teacherId,
      class_section: classSection,
      teacher: {
        id: teacherObj.id,
        name: teacherObj.name
      },
      subject,
      topic,
      description,
      due_date: new Date(dueDate),
      assigned_date: new Date(),
      status: "Active",
      attachment: req.file ? `/uploads/${req.file.filename}` : null,
      attachment_original_name: req.file ? req.file.originalname : null
    };

    const result = await db.collection("homework").insertOne(homework);

    // Also update teacher's homework_assigned array
    await db.collection("teachers").updateOne(
      { teacher_id: req.params.teacherId },
      {
        $push: {
          homework_assigned: {
            id: result.insertedId,
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
    console.error("Homework Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/teacher/:teacherId/homework/:homeworkId
// @desc    Edit homework
router.put("/:teacherId/homework/:homeworkId", upload.single('attachment'), async (req, res) => {
  try {
    const db = getDB(req);
    const { subject, topic, description, dueDate } = req.body;
    const homeworkId = req.params.homeworkId;

    const updateData = {
      subject,
      topic,
      description,
      due_date: new Date(dueDate),
      updated_at: new Date()
    };

    if (req.file) {
      updateData.attachment = `/uploads/${req.file.filename}`;
      updateData.attachment_original_name = req.file.originalname;
    }

    const result = await db.collection("homework").updateOne(
      { _id: new ObjectId(homeworkId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Homework not found" });
    }

    res.json({ message: "Homework updated successfully" });

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

// @route   GET /api/teacher/:teacherId/homework/:homeworkId/submissions
// @desc    Get submissions for a specific homework
router.get("/:teacherId/homework/:homeworkId/submissions", async (req, res) => {
  try {
    const db = getDB(req);
    const homeworkId = req.params.homeworkId;

    console.log(`Fetching submissions for homework ID: ${homeworkId}`);
    // submissions are stored in 'homework_submissions' collection
    const submissions = await db.collection("homework_submissions").find({
      homework_id: new ObjectId(homeworkId)
    }).sort({ submitted_at: -1 }).toArray();
    console.log(`Found ${submissions.length} submissions`);

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/announcements
// @desc    Create announcement (with optional file)
router.post("/:teacherId/announcements", upload.single('attachment'), async (req, res) => {
  try {
    const db = getDB(req);

    const {
      title,
      message,
      classSection,
      priority,
      teacher // stringified JSON if coming from FormData
    } = req.body;

    // Parse teacher if it came as string (due to FormData)
    let teacherObj = teacher;
    if (typeof teacher === 'string') {
      try {
        teacherObj = JSON.parse(teacher);
      } catch (e) {
        console.error("Error parsing teacher JSON", e);
      }
    }

    const announcement = {
      teacher: {
        id: teacherObj?.id || req.params.teacherId,
        name: teacherObj?.name || "Unknown Teacher"
      },

      title,
      message,
      class_section: classSection || "All",
      priority: priority || "Normal",

      attachment: req.file ? `/uploads/${req.file.filename}` : null,
      attachment_original_name: req.file ? req.file.originalname : null,

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

// @route   PUT /api/teacher/:teacherId/announcements/:announcementId
// @desc    Update announcement
router.put("/:teacherId/announcements/:announcementId", upload.single('attachment'), async (req, res) => {
  try {
    const db = getDB(req);
    const { title, message, priority, classSection } = req.body;
    const announcementId = req.params.announcementId;

    const updateData = {
      title,
      message,
      priority,
      class_section: classSection,
      updated_at: new Date()
    };

    if (req.file) {
      updateData.attachment = `/uploads/${req.file.filename}`;
      updateData.attachment_original_name = req.file.originalname;
    }

    const result = await db.collection("announcements").updateOne(
      { _id: new ObjectId(announcementId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement updated successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/teacher/:teacherId/announcements/:announcementId
// @desc    Delete announcement
router.delete("/:teacherId/announcements/:announcementId", async (req, res) => {
  try {
    const db = getDB(req);
    const announcementId = req.params.announcementId;

    const result = await db.collection("announcements").deleteOne({
      _id: new ObjectId(announcementId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully" });
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

    const classQuery = buildClassQuery(teacher.assigned_classes);

    // Get students from those classes to get their admission numbers
    const students = await db.collection("student").find(classQuery).toArray();

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

    const classQuery = buildClassQuery(teacher.assigned_classes);

    const students = await db.collection("student").find(classQuery).toArray();
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

    const classQuery = buildClassQuery(teacher.assigned_classes);

    // Total students
    const totalStudents = await db.collection("student").countDocuments(classQuery);

    // Pending leave requests
    const students = await db.collection("student").find(classQuery).toArray();
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



// @route   POST /api/teacher/:teacherId/timetable
// @desc    Save or update class timetable
router.post("/:teacherId/timetable", async (req, res) => {
  try {
    const db = getDB(req);
    const { classSection, timetable } = req.body;
    // timetable structure: { Monday: [...], Tuesday: [...] } 

    if (!classSection || !timetable) {
      return res.status(400).json({ message: "Class section and timetable data required" });
    }

    const [classNum, section] = classSection.split("-");

    // Upsert timetable for this class/section
    const result = await db.collection("timetables").updateOne(
      {
        class: classNum,
        section: section,
        academic_year: "2024-2025" // Hardcoded for now, should be dynamic later
      },
      {
        $set: {
          class: classNum,
          section: section,
          timetable: timetable,
          updated_at: new Date(),
          updated_by: req.params.teacherId
        }
      },
      { upsert: true }
    );

    res.json({
      message: "Timetable saved successfully",
      id: result.upsertedId || result.modifiedCount
    });

  } catch (error) {
    console.error("Save Timetable Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/results/upload
// @desc    Upload or update student results


// @route   GET /api/teacher/:teacherId/timetable/:classSection
// @desc    Get timetable for a specific class
router.get("/:teacherId/timetable/:classSection", async (req, res) => {
  try {
    const db = getDB(req);
    const { classSection } = req.params;
    const [classNum, section] = classSection.split("-");

    const timetableData = await db.collection("timetables").findOne({
      class: classNum,
      section: section
    });

    res.json(timetableData ? timetableData.timetable : null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/results/upload
// @desc    Upload or update student results
// @route   POST /api/teacher/:teacherId/results/upload
// @desc    Upload or update student results (to 'results' collection)
// @route   POST /api/teacher/:teacherId/results/upload
// @desc    Upload or update student results (to 'results' collection)
router.post("/:teacherId/results/upload", async (req, res) => {
  try {
    const db = getDB(req);
    const { exam_id, subject, class: classNum, section, academic_year, auto_publish, students_marks } = req.body;

    // Validate
    if (!exam_id || !subject || !classNum || !section || !students_marks) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get marking scheme to calculate maximum marks and grades
    // Try both number and string for class
    let scheme = await db.collection("marking_schemes").findOne({
      class: classNum,
      academic_year: academic_year || "2024-25"
    });

    if (!scheme) {
      // try converting class to number if it was string, or vice versa
      const altClass = isNaN(Number(classNum)) ? Number(classNum) : String(classNum);
      scheme = await db.collection("marking_schemes").findOne({
        class: altClass,
        academic_year: academic_year || "2024-25"
      });
    }

    if (!scheme) {
      return res.status(404).json({ message: "Marking scheme not found for this class/year" });
    }

    // Process each student's marks and prepare bulk operations for 'results' collection
    const bulkOps = students_marks.map(studentMark => {
      const { admission_no, marks } = studentMark;

      // Transform frontend marks structure { componentId: { obtained: X, absent: Y } }
      // to what we want to store.
      const processedMarks = {};
      let totalObtained = 0;
      let totalMax = 0;

      Object.entries(marks).forEach(([compId, data]) => {
        const obtained = Number(data.obtained) || 0;
        const isAbsent = data.absent === true;

        // Find component in scheme to get max marks (case-insensitive check)
        const schemeComponent = scheme.components.find(c =>
          c.component_id.toLowerCase() === compId.toLowerCase() ||
          c.name.toLowerCase() === compId.toLowerCase()
        );

        let maxMarks = 0;
        if (schemeComponent) {
          maxMarks = schemeComponent.max_marks;
        } else {
          // Fallback: If not in scheme, maybe frontend sent it? Or default to 0.
          // Let's create a warning log
          console.warn(`Component ${compId} not found in scheme for class ${classNum}`);
        }

        processedMarks[compId] = {
          obtained: isAbsent ? 0 : obtained,
          absent: isAbsent,
          max: maxMarks // Store max marks for this component
        };

        if (!isAbsent) totalObtained += obtained;
        totalMax += maxMarks;
      });

      // Calculate Percentage and Grade
      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

      const gradeInfo = scheme.grading.grades.find(
        g => percentage >= g.min && percentage <= g.max
      ) || { grade: "N/A", remarks: "N/A" };

      const filter = {
        admission_no: admission_no,
        exam_id: exam_id,
        subject: subject,
        academic_year: academic_year || "2024-25"
      };

      // Debug log
      console.log(`Processing result for ${admission_no}:`, {
        totalObtained, totalMax, percentage, grade: gradeInfo.grade
      });

      const updateDoc = {
        $set: {
          class: classNum,
          section: section,
          marks: processedMarks,
          total_obtained: totalObtained,
          total_max: totalMax,
          percentage: parseFloat(percentage.toFixed(2)),
          grade: gradeInfo.grade,
          remarks: gradeInfo.remarks,
          status: auto_publish ? "Published" : "Draft",
          is_published: auto_publish || false,
          published_at: auto_publish ? new Date() : null,
          uploaded_at: new Date(),
          uploaded_by: {
            teacher_id: req.params.teacherId
          }
        }
      };

      return {
        updateOne: {
          filter: filter,
          update: updateDoc,
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      const result = await db.collection("results").bulkWrite(bulkOps);

      // Update analytics asynchronously
      updateStudentAnalytics(db, students_marks.map(s => s.admission_no), academic_year || "2024-25");

      res.json({
        message: "Results uploaded successfully",
        modified: result.modifiedCount + result.upsertedCount,
        inserted: result.upsertedCount
      });
    } else {
      res.json({ message: "No data to update" });
    }

  } catch (error) {
    console.error("Results Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
});



// ========== HELPER FUNCTIONS ==========

// Update student analytics (runs asynchronously)
async function updateStudentAnalytics(db, admissionNos, academicYear) {
  try {
    console.log(`Updating analytics for ${admissionNos.length} students:`, admissionNos);
    for (const admissionNo of admissionNos) {
      const results = await db.collection("results").find({
        admission_no: admissionNo,
        academic_year: academicYear
      }).toArray();

      console.log(`Found ${results.length} results for ${admissionNo}`);

      if (results.length === 0) continue;

      // Calculate overall performance
      const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
      const avgPercentage = totalPercentage / results.length;

      // Get unique exams
      const uniqueExams = [...new Set(results.map(r => r.exam_id))];

      // Calculate subject-wise performance
      const subjectMap = {};
      results.forEach(result => {
        if (!subjectMap[result.subject]) {
          subjectMap[result.subject] = {
            subject: result.subject,
            exams: [],
            total_percentage: 0,
            count: 0
          };
        }

        subjectMap[result.subject].exams.push({
          exam_id: result.exam_id,
          percentage: result.percentage,
          grade: result.grade,
          total_obtained: result.total_obtained,
          total_max: result.total_max
        });

        subjectMap[result.subject].total_percentage += result.percentage;
        subjectMap[result.subject].count++;
      });

      const subjects = Object.values(subjectMap).map(sub => {
        const percentages = sub.exams.map(e => e.percentage);
        return {
          subject: sub.subject,
          exams: sub.exams,
          average_percentage: parseFloat((sub.total_percentage / sub.count).toFixed(2)),
          highest: Math.max(...percentages),
          lowest: Math.min(...percentages),
          trend: calculateTrend(percentages)
        };
      });

      // Calculate exam-wise performance
      const examMap = {};
      results.forEach(result => {
        if (!examMap[result.exam_id]) {
          examMap[result.exam_id] = {
            exam_id: result.exam_id,
            subjects: [],
            total_percentage: 0,
            total_obtained: 0,
            total_max: 0,
            count: 0
          };
        }

        examMap[result.exam_id].subjects.push({
          subject: result.subject,
          percentage: result.percentage,
          grade: result.grade
        });

        examMap[result.exam_id].total_percentage += result.percentage;
        examMap[result.exam_id].total_obtained += result.total_obtained;
        examMap[result.exam_id].total_max += result.total_max;
        examMap[result.exam_id].count++;
      });

      const exams = Object.values(examMap).map(exam => ({
        exam_id: exam.exam_id,
        total_percentage: parseFloat((exam.total_percentage / exam.count).toFixed(2)),
        subjects_appeared: exam.count,
        subjects_passed: exam.subjects.filter(s => s.grade !== 'F').length,
        aggregate_percentage: parseFloat(((exam.total_obtained / exam.total_max) * 100).toFixed(2))
      }));

      // Get student's grade
      const scheme = await db.collection("marking_schemes").findOne({
        academic_year: academicYear
      });

      let overallGrade = "N/A";
      if (scheme) {
        const gradeInfo = scheme.grading.grades.find(
          g => avgPercentage >= g.min && avgPercentage <= g.max
        );
        overallGrade = gradeInfo ? gradeInfo.grade : "N/A";
      }

      // Update or insert analytics
      await db.collection("student_analytics").updateOne(
        {
          admission_no: admissionNo,
          academic_year: academicYear
        },
        {
          $set: {
            overall: {
              total_exams: uniqueExams.length,
              average_percentage: parseFloat(avgPercentage.toFixed(2)),
              average_grade: overallGrade,
              total_subjects: Object.keys(subjectMap).length
            },
            subjects: subjects,
            exams: exams,
            last_updated: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error("Error updating analytics:", error);
  }
}

function calculateTrend(percentages) {
  if (percentages.length < 2) return "stable";

  const recent = percentages.slice(-3);
  if (recent.length < 2) return "stable";

  let increasing = 0;
  let decreasing = 0;

  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) increasing++;
    else if (recent[i] < recent[i - 1]) decreasing++;
  }

  if (increasing > decreasing) return "improving";
  if (decreasing > increasing) return "declining";
  return "stable";
}

export default router;