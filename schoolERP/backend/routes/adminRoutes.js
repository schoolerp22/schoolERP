import express from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// ==================== DASHBOARD STATISTICS ====================

/**
 * @route   GET /api/admin/:adminId/dashboard-stats
 * @desc    Get overall dashboard statistics
 */
router.get("/:adminId/dashboard-stats", async (req, res) => {
    try {
        const db = getDB(req);

        // Total teachers
        const totalTeachers = await db.collection("teachers").countDocuments();

        // Total students
        const totalStudents = await db.collection("student").countDocuments();

        // Active teachers (those with assigned classes)
        const activeTeachers = await db.collection("teachers").countDocuments({
            assigned_classes: { $exists: true, $ne: [] }
        });

        // Get unique classes
        const students = await db.collection("student").find({}, {
            projection: { class: 1, section: 1 }
        }).toArray();

        const uniqueClasses = new Set(
            students.map(s => `${s.class}-${s.section}`)
        );
        const totalClasses = uniqueClasses.size;

        // Attendance today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendanceToday = await db.collection("attendance").countDocuments({
            date: { $gte: today }
        });

        // Active homework
        const activeHomework = await db.collection("homework").countDocuments({
            status: "Active",
            due_date: { $gte: new Date() }
        });

        // Pending leave requests
        const pendingLeaves = await db.collection("leave_requests").countDocuments({
            status: "Pending"
        });

        res.json({
            totalTeachers,
            totalStudents,
            activeTeachers,
            totalClasses,
            attendanceToday,
            activeHomework,
            pendingLeaves
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== TEACHER MANAGEMENT ====================

/**
 * @route   GET /api/admin/:adminId/teachers
 * @desc    Get all teachers with pagination and filters
 */
router.get("/:adminId/teachers", async (req, res) => {
    try {
        const db = getDB(req);
        const { search, subject, page = 1, limit = 10 } = req.query;

        let query = {};

        // Search filter
        if (search) {
            query.$or = [
                { teacher_id: { $regex: search, $options: "i" } },
                { "personal_details.name": { $regex: search, $options: "i" } },
                { "personal_details.email": { $regex: search, $options: "i" } }
            ];
        }

        // Subject filter
        if (subject) {
            query["assigned_classes.subject"] = subject;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const teachers = await db
            .collection("teachers")
            .find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const total = await db.collection("teachers").countDocuments(query);

        res.json({
            teachers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/teachers/:teacherId
 * @desc    Get specific teacher details
 */
router.get("/:adminId/teachers/:teacherId", async (req, res) => {
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

/**
 * @route   POST /api/admin/:adminId/teachers
 * @desc    Add new teacher
 */
router.post("/:adminId/teachers", async (req, res) => {
    try {
        const db = getDB(req);
        const teacherData = req.body;

        // Check if teacher_id already exists
        const existing = await db.collection("teachers").findOne({
            teacher_id: teacherData.teacher_id
        });

        if (existing) {
            return res.status(400).json({ message: "Teacher ID already exists" });
        }

        // Hash password if provided
        if (teacherData.password) {
            teacherData.password = await bcrypt.hash(teacherData.password, 10);
        }

        // Add timestamps
        teacherData.created_at = new Date();
        teacherData.updated_at = new Date();

        const result = await db.collection("teachers").insertOne(teacherData);

        res.status(201).json({
            message: "Teacher added successfully",
            teacherId: result.insertedId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/admin/:adminId/teachers/:teacherId
 * @desc    Update teacher information
 */
router.put("/:adminId/teachers/:teacherId", async (req, res) => {
    try {
        const db = getDB(req);
        const updateData = { ...req.body };

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.teacher_id;
        delete updateData.created_at;

        // Hash password if being updated
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        updateData.updated_at = new Date();

        const result = await db.collection("teachers").updateOne(
            { teacher_id: req.params.teacherId },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        res.json({ message: "Teacher updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/admin/:adminId/teachers/:teacherId
 * @desc    Delete teacher record
 */
router.delete("/:adminId/teachers/:teacherId", async (req, res) => {
    try {
        const db = getDB(req);

        const result = await db.collection("teachers").deleteOne({
            teacher_id: req.params.teacherId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        res.json({ message: "Teacher deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== STUDENT MANAGEMENT ====================

/**
 * @route   GET /api/admin/:adminId/students
 * @desc    Get all students with pagination and filters
 */
router.get("/:adminId/students", async (req, res) => {
    try {
        const db = getDB(req);
        const { search, class: classNum, section, page = 1, limit = 10 } = req.query;

        let query = {};

        // Search filter
        if (search) {
            query.$or = [
                { admission_no: { $regex: search, $options: "i" } },
                { "personal_details.first_name": { $regex: search, $options: "i" } },
                { "personal_details.last_name": { $regex: search, $options: "i" } }
            ];
        }

        // Class filter
        if (classNum) {
            query.class = classNum;
        }

        // Section filter
        if (section) {
            query.section = section;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const students = await db
            .collection("student")
            .find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const total = await db.collection("student").countDocuments(query);

        res.json({
            students,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/students/:studentId
 * @desc    Get specific student details
 */
router.get("/:adminId/students/:studentId", async (req, res) => {
    try {
        const db = getDB(req);
        const student = await db.collection("student").findOne({
            admission_no: req.params.studentId
        });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   POST /api/admin/:adminId/students
 * @desc    Add new student
 */
router.post("/:adminId/students", async (req, res) => {
    try {
        const db = getDB(req);
        const studentData = req.body;

        // Check if admission_no already exists
        const existing = await db.collection("student").findOne({
            admission_no: studentData.admission_no
        });

        if (existing) {
            return res.status(400).json({ message: "Admission number already exists" });
        }

        // Hash password if provided
        if (studentData.password) {
            studentData.password = await bcrypt.hash(studentData.password, 10);
        }

        // Add timestamps
        studentData.created_at = new Date();
        studentData.updated_at = new Date();

        // Initialize arrays if not provided
        studentData.attendance = studentData.attendance || [];
        studentData.exam_records = studentData.exam_records || [];
        studentData.payment_history = studentData.payment_history || [];

        const result = await db.collection("student").insertOne(studentData);

        res.status(201).json({
            message: "Student added successfully",
            studentId: result.insertedId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/admin/:adminId/students/:studentId
 * @desc    Update student information
 */
router.put("/:adminId/students/:studentId", async (req, res) => {
    try {
        const db = getDB(req);
        const updateData = { ...req.body };

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.admission_no;
        delete updateData.created_at;

        // Hash password if being updated
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        updateData.updated_at = new Date();

        const result = await db.collection("student").updateOne(
            { admission_no: req.params.studentId },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ message: "Student updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/admin/:adminId/students/:studentId
 * @desc    Delete student record
 */
router.delete("/:adminId/students/:studentId", async (req, res) => {
    try {
        const db = getDB(req);

        const result = await db.collection("student").deleteOne({
            admission_no: req.params.studentId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ message: "Student deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   POST /api/admin/:adminId/students/bulk-upload
 * @desc    Bulk upload students via CSV
 */
router.post("/:adminId/students/bulk-upload", async (req, res) => {
    try {
        const db = getDB(req);
        const { csvData } = req.body;

        if (!csvData) {
            return res.status(400).json({ message: "CSV data is required" });
        }

        // Parse CSV data
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const students = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const values = lines[i].split(',').map(v => v.trim());

                if (values.length !== headers.length) {
                    errors.push({ line: i + 1, error: "Column count mismatch" });
                    continue;
                }

                const studentData = {};
                headers.forEach((header, index) => {
                    studentData[header] = values[index];
                });

                // Check if student already exists
                const existing = await db.collection("student").findOne({
                    admission_no: studentData.admission_no
                });

                if (existing) {
                    errors.push({ line: i + 1, admission_no: studentData.admission_no, error: "Already exists" });
                    continue;
                }

                // Build student object
                const student = {
                    admission_no: studentData.admission_no,
                    roll_no: studentData.roll_no,
                    class: studentData.class,
                    section: studentData.section,
                    house: studentData.house || '',
                    identity: {
                        aadhar_no: studentData.aadhar_no || '',
                        pan_no: studentData.pan_no || ''
                    },
                    personal_details: {
                        first_name: studentData.first_name,
                        last_name: studentData.last_name,
                        gender: studentData.gender || '',
                        date_of_birth: studentData.date_of_birth || '',
                        address: studentData.address || '',
                        phone: studentData.phone || '',
                        email: studentData.email || ''
                    },
                    parent_record: {
                        father_name: studentData.father_name || '',
                        mother_name: studentData.mother_name || '',
                        primary_contact: studentData.primary_contact || '',
                        secondary_contact: studentData.secondary_contact || ''
                    },
                    transport: {
                        bus_number: studentData.bus_number || ''
                    },
                    password: studentData.password ? await bcrypt.hash(studentData.password, 10) : await bcrypt.hash('password123', 10),
                    attendance: [],
                    exam_records: [],
                    payment_history: [],
                    created_at: new Date(),
                    updated_at: new Date()
                };

                students.push(student);
            } catch (error) {
                errors.push({ line: i + 1, error: error.message });
            }
        }

        // Insert all valid students
        let insertedCount = 0;
        if (students.length > 0) {
            const result = await db.collection("student").insertMany(students);
            insertedCount = result.insertedCount;
        }

        res.json({
            message: `Bulk upload completed`,
            inserted: insertedCount,
            failed: errors.length,
            errors: errors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/**
 * @route   PUT /api/admin/:adminId/students/:studentId/change-password
 * @desc    Admin change student password
 */
router.put("/:adminId/students/:studentId/change-password", async (req, res) => {
    try {
        const db = getDB(req);
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await db.collection("student").updateOne(
            { admission_no: req.params.studentId },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== REPORTS & ANALYTICS ====================

/**
 * @route   GET /api/admin/:adminId/reports/teachers
 * @desc    Get teacher performance reports
 */
router.get("/:adminId/reports/teachers", async (req, res) => {
    try {
        const db = getDB(req);

        const teachers = await db.collection("teachers").find({}).toArray();

        const reports = await Promise.all(
            teachers.map(async (teacher) => {
                // Count homework assigned
                const homeworkCount = await db.collection("homework").countDocuments({
                    teacher_id: teacher.teacher_id
                });

                // Count attendance marked
                const attendanceCount = await db.collection("attendance").countDocuments({
                    marked_by_id: teacher.teacher_id
                });

                // Count announcements
                const announcementCount = await db.collection("announcements").countDocuments({
                    "teacher.id": teacher.teacher_id
                });

                return {
                    teacher_id: teacher.teacher_id,
                    name: teacher.personal_details?.name || "N/A",
                    email: teacher.personal_details?.email || "N/A",
                    assigned_classes: teacher.assigned_classes?.length || 0,
                    homework_assigned: homeworkCount,
                    attendance_marked: attendanceCount,
                    announcements_created: announcementCount
                };
            })
        );

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/reports/students
 * @desc    Get student performance reports
 */
router.get("/:adminId/reports/students", async (req, res) => {
    try {
        const db = getDB(req);
        const { class: classNum, section } = req.query;

        let query = {};
        if (classNum) query.class = classNum;
        if (section) query.section = section;

        const students = await db.collection("student").find(query).toArray();

        const reports = students.map((student) => {
            const totalExams = student.exam_records?.length || 0;
            const totalAttendance = student.attendance?.length || 0;
            const presentDays = student.attendance?.filter(a => a.status === "Present").length || 0;
            const attendancePercentage = totalAttendance > 0
                ? ((presentDays / totalAttendance) * 100).toFixed(2)
                : 0;

            return {
                admission_no: student.admission_no,
                name: `${student.personal_details?.first_name || ""} ${student.personal_details?.last_name || ""}`.trim(),
                class: student.class,
                section: student.section,
                roll_no: student.roll_no,
                total_exams: totalExams,
                attendance_percentage: attendancePercentage,
                house: student.house
            };
        });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/reports/attendance
 * @desc    Get attendance statistics
 */
router.get("/:adminId/reports/attendance", async (req, res) => {
    try {
        const db = getDB(req);
        const { startDate, endDate } = req.query;

        let dateQuery = {};
        if (startDate && endDate) {
            dateQuery.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await db.collection("attendance").find(dateQuery).toArray();

        const stats = {
            total_records: attendance.length,
            present: attendance.filter(a => a.status === "Present").length,
            absent: attendance.filter(a => a.status === "Absent").length,
            late: attendance.filter(a => a.status === "Late").length
        };

        stats.attendance_rate = stats.total_records > 0
            ? ((stats.present / stats.total_records) * 100).toFixed(2)
            : 0;

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/reports/academic
 * @desc    Get academic progress summaries
 */
router.get("/:adminId/reports/academic", async (req, res) => {
    try {
        const db = getDB(req);

        const students = await db.collection("student").find({}).toArray();

        // Group by class
        const classSummary = {};

        students.forEach((student) => {
            const classKey = `${student.class}-${student.section}`;

            if (!classSummary[classKey]) {
                classSummary[classKey] = {
                    class: student.class,
                    section: student.section,
                    total_students: 0,
                    total_exams: 0
                };
            }

            classSummary[classKey].total_students++;
            classSummary[classKey].total_exams += student.exam_records?.length || 0;
        });

        res.json(Object.values(classSummary));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/analytics/class-wise
 * @desc    Get class-wise analytics
 */
router.get("/:adminId/analytics/class-wise", async (req, res) => {
    try {
        const db = getDB(req);

        const students = await db.collection("student").find({}).toArray();

        // Group by class
        const classAnalytics = {};

        students.forEach((student) => {
            const classKey = `${student.class}-${student.section}`;

            if (!classAnalytics[classKey]) {
                classAnalytics[classKey] = {
                    class: student.class,
                    section: student.section,
                    student_count: 0,
                    boys: 0,
                    girls: 0
                };
            }

            classAnalytics[classKey].student_count++;

            if (student.personal_details?.gender === "Male") {
                classAnalytics[classKey].boys++;
            } else if (student.personal_details?.gender === "Female") {
                classAnalytics[classKey].girls++;
            }
        });

        res.json(Object.values(classAnalytics));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/analytics/subject-wise
 * @desc    Get subject-wise analytics
 */
router.get("/:adminId/analytics/subject-wise", async (req, res) => {
    try {
        const db = getDB(req);

        const teachers = await db.collection("teachers").find({}).toArray();

        // Group by subject
        const subjectAnalytics = {};

        teachers.forEach((teacher) => {
            teacher.assigned_classes?.forEach((ac) => {
                if (!subjectAnalytics[ac.subject]) {
                    subjectAnalytics[ac.subject] = {
                        subject: ac.subject,
                        teacher_count: 0,
                        class_count: 0
                    };
                }

                subjectAnalytics[ac.subject].teacher_count++;
                subjectAnalytics[ac.subject].class_count++;
            });
        });

        res.json(Object.values(subjectAnalytics));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== RESULTS MANAGEMENT ====================

/**
 * @route   POST /api/admin/:adminId/results/fix-missing-fields
 * @desc    Fix existing results that are missing calculated fields
 */
router.post("/:adminId/results/fix-missing-fields", async (req, res) => {
    try {
        const db = getDB(req);
        const { admission_no, academic_year } = req.body;

        // Find results that need fixing
        let query = {
            $or: [
                { total_obtained: { $exists: false } },
                { total_max: { $exists: false } },
                { percentage: { $exists: false } },
                { grade: { $exists: false } }
            ]
        };

        if (admission_no) query.admission_no = admission_no;
        if (academic_year) query.academic_year = academic_year;

        const resultsToFix = await db.collection("results").find(query).toArray();

        if (resultsToFix.length === 0) {
            return res.json({ message: "No results need fixing", fixed: 0 });
        }

        let fixed = 0;
        let errors = [];

        for (const result of resultsToFix) {
            try {
                // Calculate totals from marks (infer max marks from common patterns)
                let totalObtained = 0;
                let totalMax = 0;
                const updatedMarks = {};

                // Common max marks patterns
                const defaultMaxMarks = {
                    theory: 70,
                    practical: 30,
                    THEORY: 70,
                    PRACTICAL: 30,
                    written: 70,
                    oral: 30
                };

                for (const [componentId, markData] of Object.entries(result.marks)) {
                    const maxMarks = markData.max || defaultMaxMarks[componentId] || 50;

                    updatedMarks[componentId] = {
                        obtained: markData.obtained || 0,
                        max: maxMarks,
                        absent: markData.absent || false
                    };

                    if (!markData.absent) {
                        totalObtained += markData.obtained || 0;
                    }
                    totalMax += maxMarks;
                }

                // Calculate percentage and grade
                const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

                // Simple grading system
                let grade, remarks;
                if (percentage >= 90) { grade = "A+"; remarks = "Excellent"; }
                else if (percentage >= 80) { grade = "A"; remarks = "Very Good"; }
                else if (percentage >= 70) { grade = "B+"; remarks = "Good"; }
                else if (percentage >= 60) { grade = "B"; remarks = "Above Average"; }
                else if (percentage >= 50) { grade = "C"; remarks = "Average"; }
                else if (percentage >= 40) { grade = "D"; remarks = "Pass"; }
                else { grade = "F"; remarks = "Fail"; }

                // Update the result
                await db.collection("results").updateOne(
                    { _id: result._id },
                    {
                        $set: {
                            marks: updatedMarks,
                            total_obtained: totalObtained,
                            total_max: totalMax,
                            percentage: parseFloat(percentage.toFixed(2)),
                            grade: grade,
                            remarks: remarks
                        }
                    }
                );

                fixed++;
            } catch (err) {
                errors.push({
                    admission_no: result.admission_no,
                    subject: result.subject,
                    error: err.message
                });
            }
        }

        // Regenerate analytics for affected students
        const { updateStudentAnalytics } = await import('../utils/updateStudentAnalytics.js');
        const affectedStudents = [...new Set(resultsToFix.map(r => r.admission_no))];

        for (const admNo of affectedStudents) {
            const year = resultsToFix.find(r => r.admission_no === admNo)?.academic_year || "2024-25";
            await updateStudentAnalytics(db, [admNo], year);
        }

        res.json({
            message: "Results fixed successfully",
            fixed: fixed,
            errors: errors.length > 0 ? errors : undefined,
            students_updated: affectedStudents.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== MARKING SCHEMES MANAGEMENT ====================

import MARKING_SCHEME_TEMPLATES from '../utils/markingSchemeTemplates.js';

/**
 * @route   GET /api/admin/:adminId/marking-schemes/templates
 * @desc    Get preset marking scheme templates
 */
router.get("/:adminId/marking-schemes/templates", async (req, res) => {
    try {
        res.json(MARKING_SCHEME_TEMPLATES);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   POST /api/admin/:adminId/marking-schemes
 * @desc    Create a new marking scheme
 */
router.post("/:adminId/marking-schemes", async (req, res) => {
    try {
        const db = getDB(req);
        const {
            scheme_name,
            academic_year,
            applicable_to,
            components,
            grading_system,
            template
        } = req.body;
        const adminId = req.params.adminId;

        // Validate required fields
        if (!scheme_name || !academic_year || !applicable_to) {
            return res.status(400).json({
                message: "scheme_name, academic_year, and applicable_to are required"
            });
        }

        // If using a template, load it
        let schemeData = {
            components: components || [],
            grading_system: grading_system || {}
        };

        if (template && MARKING_SCHEME_TEMPLATES[template]) {
            const templateData = MARKING_SCHEME_TEMPLATES[template];
            schemeData.components = components || templateData.components;
            schemeData.grading_system = grading_system || templateData.grading_system;
        }

        // Check if scheme already exists for same class/section/year
        const existing = await db.collection("marking_schemes").findOne({
            academic_year: academic_year,
            "applicable_to.classes": { $in: applicable_to.classes },
            "applicable_to.sections": { $in: applicable_to.sections },
            status: "Active"
        });

        if (existing) {
            return res.status(400).json({
                message: "An active marking scheme already exists for this class/section/year combination"
            });
        }

        const scheme = {
            scheme_name,
            academic_year,
            applicable_to: {
                classes: applicable_to.classes || ["All"],
                sections: applicable_to.sections || ["All"]
            },
            components: schemeData.components,
            grading_system: schemeData.grading_system,
            status: "Active",
            created_by: adminId,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await db.collection("marking_schemes").insertOne(scheme);

        res.status(201).json({
            message: "Marking scheme created successfully",
            scheme_id: result.insertedId,
            scheme: scheme
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/marking-schemes
 * @desc    Get all marking schemes with optional filters
 */
router.get("/:adminId/marking-schemes", async (req, res) => {
    try {
        const db = getDB(req);
        const { academic_year, class: className, section, status } = req.query;

        let query = {};

        if (academic_year) {
            query.academic_year = academic_year;
        }

        if (className) {
            query.$or = [
                { "applicable_to.classes": className },
                { "applicable_to.classes": "All" }
            ];
        }

        if (section) {
            query.$or = [
                ...(query.$or || []),
                { "applicable_to.sections": section },
                { "applicable_to.sections": "All" }
            ];
        }

        if (status) {
            query.status = status;
        }

        const schemes = await db.collection("marking_schemes")
            .find(query)
            .sort({ created_at: -1 })
            .toArray();

        res.json(schemes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/marking-schemes/:schemeId
 * @desc    Get specific marking scheme details
 */
router.get("/:adminId/marking-schemes/:schemeId", async (req, res) => {
    try {
        const db = getDB(req);
        const { schemeId } = req.params;

        const scheme = await db.collection("marking_schemes").findOne({
            _id: new ObjectId(schemeId)
        });

        if (!scheme) {
            return res.status(404).json({ message: "Marking scheme not found" });
        }

        res.json(scheme);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/admin/:adminId/marking-schemes/:schemeId
 * @desc    Update marking scheme
 */
router.put("/:adminId/marking-schemes/:schemeId", async (req, res) => {
    try {
        const db = getDB(req);
        const { schemeId } = req.params;
        const updateData = { ...req.body };

        // Remove fields that shouldn't be updated
        delete updateData._id;
        delete updateData.created_at;
        delete updateData.created_by;

        updateData.updated_at = new Date();

        const result = await db.collection("marking_schemes").updateOne(
            { _id: new ObjectId(schemeId) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Marking scheme not found" });
        }

        res.json({ message: "Marking scheme updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PATCH /api/admin/:adminId/marking-schemes/:schemeId/archive
 * @desc    Archive a marking scheme (soft delete)
 */
router.patch("/:adminId/marking-schemes/:schemeId/archive", async (req, res) => {
    try {
        const db = getDB(req);
        const { schemeId } = req.params;

        const result = await db.collection("marking_schemes").updateOne(
            { _id: new ObjectId(schemeId) },
            {
                $set: {
                    status: "Archived",
                    updated_at: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Marking scheme not found" });
        }

        res.json({ message: "Marking scheme archived successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/admin/:adminId/marking-schemes/:schemeId
 * @desc    Delete marking scheme
 */
router.delete("/:adminId/marking-schemes/:schemeId", async (req, res) => {
    try {
        const db = getDB(req);
        const { schemeId } = req.params;

        const result = await db.collection("marking_schemes").deleteOne({
            _id: new ObjectId(schemeId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Marking scheme not found" });
        }

        res.json({ message: "Marking scheme deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// ==================== ATTENDANCE BACKLOG MANAGEMENT ====================

/**
 * @route   POST /api/admin/:adminId/attendance-backlog
 * @desc    Create a new attendance backlog window
 */
router.post("/:adminId/attendance-backlog", async (req, res) => {
    try {
        const db = getDB(req);
        const { start_date, end_date, class_section, reason } = req.body;
        const adminId = req.params.adminId;

        // Validate required fields
        if (!start_date || !end_date || !class_section) {
            return res.status(400).json({ message: "start_date, end_date, and class_section are required" });
        }

        // Parse dates
        const [startYear, startMonth, startDay] = start_date.split('-').map(num => parseInt(num, 10));
        const [endYear, endMonth, endDay] = end_date.split('-').map(num => parseInt(num, 10));

        const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));

        // Validate date range
        if (startDate > endDate) {
            return res.status(400).json({ message: "start_date must be before or equal to end_date" });
        }

        const backlogData = {
            start_date: startDate,
            end_date: endDate,
            class_section: class_section, // Can be "3-A" or "All"
            status: "Open",
            created_by: adminId,
            created_at: new Date(),
            closed_at: null,
            reason: reason || "Backlog window opened by admin"
        };

        const result = await db.collection("attendance_backlog").insertOne(backlogData);

        res.status(201).json({
            message: "Attendance backlog window created successfully",
            backlogId: result.insertedId,
            backlog: backlogData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/:adminId/attendance-backlog
 * @desc    Get all attendance backlog windows with optional filters
 */
router.get("/:adminId/attendance-backlog", async (req, res) => {
    try {
        const db = getDB(req);
        const { status, class_section } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (class_section) {
            query.class_section = class_section;
        }

        const backlogs = await db.collection("attendance_backlog")
            .find(query)
            .sort({ created_at: -1 })
            .toArray();

        // Dynamically update status to "Expired" if current date is strictly past end_date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const enrichedBacklogs = backlogs.map(backlog => {
            const endDate = new Date(backlog.end_date);
            endDate.setHours(0, 0, 0, 0);

            if (backlog.status === "Open" && endDate < today) {
                return { ...backlog, status: "Expired" };
            }
            return backlog;
        });

        res.json(enrichedBacklogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PATCH /api/admin/:adminId/attendance-backlog/:backlogId/close
 * @desc    Close an open backlog window
 */
router.patch("/:adminId/attendance-backlog/:backlogId/close", async (req, res) => {
    try {
        const db = getDB(req);
        const { backlogId } = req.params;

        const result = await db.collection("attendance_backlog").updateOne(
            { _id: new ObjectId(backlogId), status: "Open" },
            {
                $set: {
                    status: "Closed",
                    closed_at: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Open backlog window not found" });
        }

        res.json({ message: "Backlog window closed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/admin/:adminId/attendance-backlog/:backlogId
 * @desc    Delete a backlog window
 */
router.delete("/:adminId/attendance-backlog/:backlogId", async (req, res) => {
    try {
        const db = getDB(req);
        const { backlogId } = req.params;

        const result = await db.collection("attendance_backlog").deleteOne({
            _id: new ObjectId(backlogId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Backlog window not found" });
        }

        res.json({ message: "Backlog window deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

