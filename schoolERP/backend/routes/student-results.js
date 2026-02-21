import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// @route   GET /api/student/:admissionNo/results
// @desc    Get all published results for student
router.get("/:admissionNo/results", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";
    const { exam_id, subject } = req.query;

    const query = {
      admission_no: req.params.admissionNo,
      academic_year: academicYear,
      is_published: true
    };

    if (exam_id) query.exam_id = exam_id;
    if (subject) query.subject = subject;

    const results = await db.collection("results")
      .find(query)
      .sort({ exam_id: 1, subject: 1 })
      .toArray();

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/student/:admissionNo/results/:examId
// @desc    Get exam-wise results (all subjects for one exam)
router.get("/:admissionNo/results/exam/:examId", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";

    const results = await db.collection("results").find({
      admission_no: req.params.admissionNo,
      exam_id: req.params.examId,
      academic_year: academicYear,
      is_published: true
    }).toArray();

    // Calculate exam totals
    const totalObtained = results.reduce((sum, r) => sum + r.total_obtained, 0);
    const totalMax = results.reduce((sum, r) => sum + r.total_max, 0);
    const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    // Get marking scheme for grade
    const student = await db.collection("students").findOne({
      admission_no: req.params.admissionNo
    });

    const scheme = await db.collection("marking_schemes").findOne({
      class: student.class,
      academic_year: academicYear
    });

    let overallGrade = "N/A";
    if (scheme) {
      const gradeInfo = scheme.grading.grades.find(
        g => overallPercentage >= g.min && overallPercentage <= g.max
      );
      overallGrade = gradeInfo ? gradeInfo.grade : "N/A";
    }

    res.json({
      exam_id: req.params.examId,
      subjects: results,
      summary: {
        total_subjects: results.length,
        total_obtained: totalObtained,
        total_max: totalMax,
        overall_percentage: parseFloat(overallPercentage.toFixed(2)),
        overall_grade: overallGrade,
        subjects_passed: results.filter(r => r.grade !== 'F').length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/student/:admissionNo/analytics
// @desc    Get student performance analytics
router.get("/:admissionNo/analytics", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";

    const analytics = await db.collection("student_analytics").findOne({
      admission_no: req.params.admissionNo,
      academic_year: academicYear
    });

    if (!analytics) {
      // Return default empty analytics to prevent frontend crash
      return res.json({
        overall: { total_exams: 0, average_percentage: 0, average_grade: "N/A", total_subjects: 0 },
        subjects: [],
        exams: []
      });
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/student/:admissionNo/performance-graph
// @desc    Get data for performance graphs
router.get("/:admissionNo/performance-graph", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";
    const { type } = req.query; // 'exam-wise' or 'subject-wise'

    const analytics = await db.collection("student_analytics").findOne({
      admission_no: req.params.admissionNo,
      academic_year: academicYear
    });

    if (!analytics) {
      return res.json({ data: [] });
    }

    let graphData = [];

    if (type === 'subject-wise') {
      // Graph showing performance in each subject across exams
      graphData = analytics.subjects.map(subject => ({
        subject: subject.subject,
        average: subject.average_percentage,
        highest: subject.highest,
        lowest: subject.lowest,
        trend: subject.trend,
        exams: subject.exams.map(e => ({
          exam_id: e.exam_id,
          percentage: e.percentage
        }))
      }));
    } else {
      // Graph showing overall performance across exams
      graphData = analytics.exams.map(exam => ({
        exam_id: exam.exam_id,
        percentage: exam.total_percentage,
        subjects_appeared: exam.subjects_appeared,
        subjects_passed: exam.subjects_passed
      }));
    }

    res.json({ data: graphData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/student/:admissionNo/subject-performance/:subject
// @desc    Get detailed performance for a specific subject
router.get("/:admissionNo/subject-performance/:subject", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";

    const results = await db.collection("results").find({
      admission_no: req.params.admissionNo,
      subject: req.params.subject,
      academic_year: academicYear,
      is_published: true
    }).sort({ exam_id: 1 }).toArray();

    // Get component-wise breakdown
    const componentAnalysis = {};

    results.forEach(result => {
      Object.entries(result.marks).forEach(([component, data]) => {
        if (!componentAnalysis[component]) {
          componentAnalysis[component] = {
            component: component,
            attempts: 0,
            total_obtained: 0,
            total_max: 0,
            average_percentage: 0
          };
        }

        componentAnalysis[component].attempts++;
        componentAnalysis[component].total_obtained += data.obtained || 0;
        componentAnalysis[component].total_max += data.max || 0;
      });
    });

    // Calculate averages
    Object.values(componentAnalysis).forEach(comp => {
      comp.average_percentage = comp.total_max > 0
        ? parseFloat(((comp.total_obtained / comp.total_max) * 100).toFixed(2))
        : 0;
    });

    res.json({
      subject: req.params.subject,
      exams: results,
      component_analysis: Object.values(componentAnalysis),
      summary: {
        total_exams: results.length,
        average_percentage: results.length > 0
          ? parseFloat((results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2))
          : 0,
        best_performance: results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0,
        weakest_performance: results.length > 0 ? Math.min(...results.map(r => r.percentage)) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/student/:admissionNo/class-rank
// @desc    Get student's rank in class (optional feature)
router.get("/:admissionNo/class-rank", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";
    const { exam_id } = req.query;

    const student = await db.collection("students").findOne({
      admission_no: req.params.admissionNo
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get all students' analytics from same class
    const allStudents = await db.collection("students").find({
      class: student.class,
      section: student.section
    }).toArray();

    const admissionNos = allStudents.map(s => s.admission_no);

    // Get analytics for all students
    const allAnalytics = await db.collection("student_analytics").find({
      admission_no: { $in: admissionNos },
      academic_year: academicYear
    }).toArray();

    if (exam_id) {
      // Rank for specific exam
      const rankings = [];

      for (const analytics of allAnalytics) {
        const examData = analytics.exams.find(e => e.exam_id === exam_id);
        if (examData) {
          rankings.push({
            admission_no: analytics.admission_no,
            percentage: examData.total_percentage
          });
        }
      }

      rankings.sort((a, b) => b.percentage - a.percentage);
      const rank = rankings.findIndex(r => r.admission_no === req.params.admissionNo) + 1;

      res.json({
        exam_id,
        rank,
        total_students: rankings.length,
        student_percentage: rankings[rank - 1]?.percentage || 0,
        topper_percentage: rankings[0]?.percentage || 0
      });
    } else {
      // Overall rank
      const rankings = allAnalytics.map(a => ({
        admission_no: a.admission_no,
        percentage: a.overall.average_percentage
      })).sort((a, b) => b.percentage - a.percentage);

      const rank = rankings.findIndex(r => r.admission_no === req.params.admissionNo) + 1;

      res.json({
        overall: true,
        rank,
        total_students: rankings.length,
        student_percentage: rankings[rank - 1]?.percentage || 0,
        topper_percentage: rankings[0]?.percentage || 0
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;