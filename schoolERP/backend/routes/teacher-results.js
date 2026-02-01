import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// ========== MARKING SCHEME ROUTES ==========

// @route   GET /api/teacher/:teacherId/marking-scheme/:class
// @desc    Get marking scheme for a class
router.get("/:teacherId/marking-scheme/:class", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";

    const scheme = await db.collection("marking_schemes").findOne({
      class: req.params.class,
      academic_year: academicYear
    });

    if (!scheme) {
      return res.status(404).json({
        message: "Marking scheme not found for this class"
      });
    }

    res.json(scheme);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== UPLOAD MARKS ROUTES ==========

// @route   POST /api/teacher/:teacherId/results/upload
// @desc    Upload marks for students (bulk or single)
router.post("/:teacherId/results/upload", async (req, res) => {
  try {
    const db = getDB(req);
    const {
      exam_id,
      subject,
      class: className,
      section,
      academic_year,
      students_marks, // Array of student marks
      auto_publish
    } = req.body;

    // Get teacher details
    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Verify teacher teaches this class
    const hasAccess = teacher.assigned_classes.some(
      ac => ac.class === className && ac.section === section
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You don't have access to this class"
      });
    }

    // Get marking scheme
    const scheme = await db.collection("marking_schemes").findOne({
      class: className,
      academic_year: academic_year || "2024-25"
    });

    if (!scheme) {
      return res.status(404).json({
        message: "Marking scheme not found"
      });
    }

    const teacherInfo = {
      teacher_id: req.params.teacherId,
      teacher_name: teacher.personal_details?.name ||
        `${teacher.personal_details?.first_name} ${teacher.personal_details?.last_name}`.trim()
    };

    // Process each student's marks
    const resultsToInsert = [];
    const errors = [];

    for (const studentMark of students_marks) {
      try {
        // Verify student exists
        const student = await db.collection("students").findOne({
          admission_no: studentMark.admission_no,
          class: className,
          section: section
        });

        if (!student) {
          errors.push({
            admission_no: studentMark.admission_no,
            error: "Student not found in this class"
          });
          continue;
        }

        // Calculate totals
        let totalObtained = 0;
        let totalMax = 0;
        const marks = {};

        for (const [componentId, markData] of Object.entries(studentMark.marks)) {
          const component = scheme.components.find(c => c.component_id === componentId);

          if (component) {
            marks[componentId] = {
              obtained: markData.obtained || 0,
              max: component.max_marks,
              absent: markData.absent || false
            };

            if (!markData.absent) {
              totalObtained += markData.obtained || 0;
            }
            totalMax += component.max_marks;
          }
        }

        // Calculate percentage and grade
        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        const gradeInfo = scheme.grading.grades.find(
          g => percentage >= g.min && percentage <= g.max
        ) || { grade: "N/A", remarks: "N/A" };

        // Check if result already exists
        const existing = await db.collection("results").findOne({
          admission_no: studentMark.admission_no,
          exam_id: exam_id,
          subject: subject,
          academic_year: academic_year || "2024-25"
        });

        const resultDoc = {
          admission_no: studentMark.admission_no,
          class: className,
          section: section,
          academic_year: academic_year || "2024-25",
          exam_id: exam_id,
          subject: subject,
          marks: marks,
          total_obtained: totalObtained,
          total_max: totalMax,
          percentage: parseFloat(percentage.toFixed(2)),
          grade: gradeInfo.grade,
          remarks: gradeInfo.remarks,
          uploaded_by: teacherInfo,
          uploaded_at: existing ? existing.uploaded_at : new Date(),
          last_updated: new Date(),
          is_published: auto_publish || false,
          published_at: auto_publish ? new Date() : null
        };

        if (existing) {
          // Update existing result
          await db.collection("results").updateOne(
            { _id: existing._id },
            { $set: resultDoc }
          );
        } else {
          resultsToInsert.push(resultDoc);
        }

      } catch (err) {
        errors.push({
          admission_no: studentMark.admission_no,
          error: err.message
        });
      }
    }

    // Insert new results
    let insertedCount = 0;
    if (resultsToInsert.length > 0) {
      const result = await db.collection("results").insertMany(resultsToInsert);
      insertedCount = result.insertedCount;
    }

    // Update analytics (async, don't wait)
    updateStudentAnalytics(db, students_marks.map(s => s.admission_no), academic_year || "2024-25");

    res.json({
      message: "Marks uploaded successfully",
      inserted: insertedCount,
      updated: students_marks.length - insertedCount - errors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Upload marks error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/results/:class/:section
// @desc    Get all results for a class-section
router.get("/:teacherId/results/:class/:section", async (req, res) => {
  try {
    const db = getDB(req);
    const { class: className, section } = req.params;
    const { exam_id, subject, academic_year } = req.query;

    const query = {
      class: className,
      section: section,
      academic_year: academic_year || "2024-25"
    };

    if (exam_id) query.exam_id = exam_id;
    if (subject) query.subject = subject;

    const results = await db.collection("results")
      .find(query)
      .sort({ admission_no: 1 })
      .toArray();

    // Enrich with student details
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        const student = await db.collection("students").findOne(
          { admission_no: result.admission_no },
          {
            projection: {
              admission_no: 1,
              personal_details: 1,
              roll_no: 1
            }
          }
        );
        return { ...result, student_info: student };
      })
    );

    res.json(enrichedResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/teacher/:teacherId/results/:resultId
// @desc    Update individual result
router.put("/:teacherId/results/:resultId", async (req, res) => {
  try {
    const db = getDB(req);
    const { marks, is_published } = req.body;

    const result = await db.collection("results").findOne({
      _id: new ObjectId(req.params.resultId)
    });

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Get marking scheme for recalculation
    const scheme = await db.collection("marking_schemes").findOne({
      class: result.class,
      academic_year: result.academic_year
    });

    // Recalculate totals
    let totalObtained = 0;
    let totalMax = 0;
    const updatedMarks = marks || result.marks;

    for (const [componentId, markData] of Object.entries(updatedMarks)) {
      if (!markData.absent) {
        totalObtained += markData.obtained || 0;
      }
      totalMax += markData.max || 0;
    }

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const gradeInfo = scheme.grading.grades.find(
      g => percentage >= g.min && percentage <= g.max
    ) || { grade: "N/A", remarks: "N/A" };

    const updateDoc = {
      marks: updatedMarks,
      total_obtained: totalObtained,
      total_max: totalMax,
      percentage: parseFloat(percentage.toFixed(2)),
      grade: gradeInfo.grade,
      remarks: gradeInfo.remarks,
      last_updated: new Date()
    };

    if (is_published !== undefined) {
      updateDoc.is_published = is_published;
      if (is_published && !result.published_at) {
        updateDoc.published_at = new Date();
      }
    }

    await db.collection("results").updateOne(
      { _id: new ObjectId(req.params.resultId) },
      { $set: updateDoc }
    );

    // Update analytics
    updateStudentAnalytics(db, [result.admission_no], result.academic_year);

    res.json({ message: "Result updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/teacher/:teacherId/results/publish
// @desc    Publish/unpublish results
router.post("/:teacherId/results/publish", async (req, res) => {
  try {
    const db = getDB(req);
    const { exam_id, subject, class: className, section, is_published } = req.body;

    const query = {
      exam_id,
      subject,
      class: className,
      section
    };

    const updateDoc = {
      is_published,
      published_at: is_published ? new Date() : null
    };

    const result = await db.collection("results").updateMany(
      query,
      { $set: updateDoc }
    );

    res.json({
      message: `Results ${is_published ? 'published' : 'unpublished'} successfully`,
      modified: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/teacher/:teacherId/results/:resultId
// @desc    Delete a result
router.delete("/:teacherId/results/:resultId", async (req, res) => {
  try {
    const db = getDB(req);

    const result = await db.collection("results").findOneAndDelete({
      _id: new ObjectId(req.params.resultId)
    });

    if (!result.value) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Update analytics
    updateStudentAnalytics(db, [result.value.admission_no], result.value.academic_year);

    res.json({ message: "Result deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== TEACHER DASHBOARD STATS ==========

// @route   GET /api/teacher/:teacherId/results/stats/dashboard
// @desc    Get results statistics for teacher dashboard
router.get("/:teacherId/results/stats/dashboard", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || "2024-25";

    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get all results uploaded by this teacher
    const results = await db.collection("results").find({
      "uploaded_by.teacher_id": req.params.teacherId,
      academic_year: academicYear
    }).toArray();

    // Calculate statistics
    const stats = {
      total_results_uploaded: results.length,
      published_results: results.filter(r => r.is_published).length,
      unpublished_results: results.filter(r => !r.is_published).length,

      // Subject-wise breakdown
      subjects: {},

      // Exam-wise breakdown
      exams: {},

      // Grade distribution
      grade_distribution: {},

      // Class performance
      class_performance: []
    };

    // Process results
    results.forEach(result => {
      // Subject stats
      if (!stats.subjects[result.subject]) {
        stats.subjects[result.subject] = {
          count: 0,
          avg_percentage: 0,
          total_percentage: 0
        };
      }
      stats.subjects[result.subject].count++;
      stats.subjects[result.subject].total_percentage += result.percentage;

      // Exam stats
      if (!stats.exams[result.exam_id]) {
        stats.exams[result.exam_id] = {
          count: 0,
          avg_percentage: 0,
          total_percentage: 0
        };
      }
      stats.exams[result.exam_id].count++;
      stats.exams[result.exam_id].total_percentage += result.percentage;

      // Grade distribution
      stats.grade_distribution[result.grade] =
        (stats.grade_distribution[result.grade] || 0) + 1;
    });

    // Calculate averages
    Object.keys(stats.subjects).forEach(subject => {
      stats.subjects[subject].avg_percentage =
        parseFloat((stats.subjects[subject].total_percentage /
          stats.subjects[subject].count).toFixed(2));
      delete stats.subjects[subject].total_percentage;
    });

    Object.keys(stats.exams).forEach(exam => {
      stats.exams[exam].avg_percentage =
        parseFloat((stats.exams[exam].total_percentage /
          stats.exams[exam].count).toFixed(2));
      delete stats.exams[exam].total_percentage;
    });

    // Class-wise performance
    const classSectionMap = {};
    results.forEach(result => {
      const key = `${result.class}-${result.section}`;
      if (!classSectionMap[key]) {
        classSectionMap[key] = {
          class: result.class,
          section: result.section,
          count: 0,
          total_percentage: 0
        };
      }
      classSectionMap[key].count++;
      classSectionMap[key].total_percentage += result.percentage;
    });

    stats.class_performance = Object.values(classSectionMap).map(cls => ({
      class: cls.class,
      section: cls.section,
      avg_percentage: parseFloat((cls.total_percentage / cls.count).toFixed(2)),
      total_students: cls.count
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/teacher/:teacherId/results/stats/class-comparison
// @desc    Get class performance comparison
router.get("/:teacherId/results/stats/class-comparison", async (req, res) => {
  try {
    const db = getDB(req);
    const { exam_id, subject } = req.query;
    const academicYear = req.query.year || "2024-25";

    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId
    });

    const query = {
      academic_year: academicYear
    };

    if (exam_id) query.exam_id = exam_id;
    if (subject) query.subject = subject;

    // Get results for teacher's classes
    const classPerformance = [];

    for (const assignedClass of teacher.assigned_classes) {
      const classQuery = {
        ...query,
        class: assignedClass.class
      };
      if (assignedClass.section && assignedClass.section !== "undefined") {
        classQuery.section = assignedClass.section;
      }

      const results = await db.collection("results").find(classQuery).toArray();

      if (results.length > 0) {
        const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
        const avgPercentage = totalPercentage / results.length;

        const gradeCount = {};
        results.forEach(r => {
          gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1;
        });

        classPerformance.push({
          class: assignedClass.class,
          section: assignedClass.section,
          total_students: results.length,
          avg_percentage: parseFloat(avgPercentage.toFixed(2)),
          highest: Math.max(...results.map(r => r.percentage)),
          lowest: Math.min(...results.map(r => r.percentage)),
          grade_distribution: gradeCount,
          pass_percentage: parseFloat(
            ((results.filter(r => r.grade !== 'F').length / results.length) * 100).toFixed(2)
          )
        });
      }
    }

    res.json(classPerformance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== HELPER FUNCTIONS ==========

// Update student analytics (runs asynchronously)
async function updateStudentAnalytics(db, admissionNos, academicYear) {
  try {
    for (const admissionNo of admissionNos) {
      const results = await db.collection("results").find({
        admission_no: admissionNo,
        academic_year: academicYear,
        is_published: true
      }).toArray();

      if (results.length === 0) continue;

      // Calculate overall performance
      const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
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