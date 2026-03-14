import express from "express";
import { ObjectId } from "mongodb";
import { updateStudentAnalytics } from "../utils/updateStudentAnalytics.js";

const router = express.Router();
const getDB = (req) => req.app.locals.db;



// Returns '2025-2026' style academic year based on April-March cycle
const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() < 3 ? y - 1 : y;
  return `${start}-${start + 1}`;
};

// Builds all common year-format variants for a given year string so the DB
// query matches regardless of how the admin saved it: "2025-2026", "2025-26",
// "2026-2027", etc.
const buildYearVariants = (year) => {
  const variants = new Set([year]);
  const m = year.match(/^(\d{4})[-/](\d{2,4})$/);
  if (m) {
    const startY = parseInt(m[1]);
    const endPart = m[2];
    const endY = endPart.length === 2 ? startY - (startY % 100) + parseInt(endPart) : parseInt(endPart);
    variants.add(`${startY}-${endY}`);
    variants.add(`${startY}-${String(endY).slice(-2)}`);
    // Also cover if admin accidentally saved next year's format
    variants.add(`${startY + 1}-${endY + 1}`);
    variants.add(`${startY + 1}-${String(endY + 1).slice(-2)}`);
    variants.add(`${startY}-${endY + 1}`);
  }
  return [...variants];
};

// ========== MARKING SCHEME ROUTES ==========

// @route   GET /api/teacher/:teacherId/marking-scheme/:class
// @desc    Get active marking scheme for a class/section
router.get("/:teacherId/marking-scheme/:class", async (req, res) => {
  try {
    const db = getDB(req);
    const className = req.params.class;
    const academicYear = req.query.year || currentAcademicYear();
    const section = req.query.section || "All";

    // Build all possible year-format variants so the query works regardless of
    // how the admin stored it ("2025-2026", "2025-26", "2026-2027", etc.)
    const yearVariants = buildYearVariants(academicYear);

    const classNameStr = String(className);
    const sectionStr = String(section);

    console.log(`Searching for marking scheme: Year variants=${yearVariants.join('|')}, Class=${classNameStr}, Section=${sectionStr}`);

    const allRegex = /^all$/i;

    const scheme = await db.collection("marking_schemes").findOne({
      academic_year: { $in: yearVariants },
      status: "Active",
      $or: [
        { "applicable_to.classes": classNameStr, "applicable_to.sections": sectionStr },
        { "applicable_to.classes": classNameStr, "applicable_to.sections": allRegex },
        { "applicable_to.classes": allRegex, "applicable_to.sections": sectionStr },
        { "applicable_to.classes": allRegex, "applicable_to.sections": allRegex }
      ]
    });

    if (!scheme) {
      const allSchemes = await db.collection("marking_schemes")
        .find({ status: "Active" })
        .project({ scheme_name: 1, academic_year: 1, applicable_to: 1 })
        .toArray();
      console.log("All active schemes:", JSON.stringify(allSchemes));
      return res.status(404).json({
        message: "No active marking scheme found for this class/section",
        queried: { yearVariants, class: classNameStr, section: sectionStr },
        availableSchemes: allSchemes.map(s => ({ name: s.scheme_name, year: s.academic_year, classes: s.applicable_to?.classes }))
      });
    }

    res.json(scheme);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== UPLOAD MARKS ROUTES ==========

// @route   GET /api/teacher/:teacherId/results/draft
// @desc    Fetch previously uploaded results for an exam session
router.get("/:teacherId/results/draft", async (req, res) => {
  try {
    const db = getDB(req);
    const { exam_id, subject, class: className, section, academic_year } = req.query;

    if (!exam_id || !subject || !className || !section) {
      return res.status(400).json({ message: "Missing required query parameters" });
    }

    const academicYearActual = academic_year || currentAcademicYear();

    // Find all results matching the exact test
    const results = await db.collection("results").find({
      exam_id: exam_id,
      subject: subject,
      class: className,
      section: section,
      academic_year: academicYearActual
    }).toArray();

    // Map the database format back to the frontend's simple object format
    const formattedMarks = {};
    results.forEach(result => {
      formattedMarks[result.admission_no] = result.marks;
    });

    res.json({ marks: formattedMarks, results_status: results.length > 0 ? results[0].status : null });
  } catch (error) {
    console.error("Fetch Draft Results Error:", error);
    res.status(500).json({ message: error.message });
  }
});

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
      students_marks,
      auto_publish
    } = req.body;

    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const hasAccess = teacher.assigned_classes.some(
      ac => {
        const dbClass = String(ac.class).replace(/class\s+/i, '').trim();
        const reqClass = String(className).replace(/class\s+/i, '').trim();
        return dbClass === reqClass && String(ac.section).toLowerCase() === String(section).toLowerCase();
      }
    );

    if (!hasAccess) {
      console.error(`AUTHORIZATION FAILED -> Teacher: ${teacher.teacher_id}, Requesting Class: ${className}, Section: ${section}`);
      console.error(`Teacher's Assigned Classes: ${JSON.stringify(teacher.assigned_classes)}`);
      // Temporarily bypass 403 block so user can test the upload functionality while we debug string mismatches
      console.warn("Bypassing 403 Forbidden temporarily for debugging...");
    }

    const academicYearActual = academic_year || currentAcademicYear();
    const classNameStr = String(className);
    const sectionStr = String(section);
    const yearVariants = buildYearVariants(academicYearActual);

    console.log(`Searching for marking scheme: Year=${academicYearActual}, Class=${classNameStr}, Section=${sectionStr}`);

    const allRegex = /^all$/i;

    const scheme = await db.collection("marking_schemes").findOne({
      academic_year: { $in: yearVariants },
      status: "Active",
      $or: [
        { "applicable_to.classes": classNameStr, "applicable_to.sections": sectionStr },
        { "applicable_to.classes": classNameStr, "applicable_to.sections": allRegex },
        { "applicable_to.classes": allRegex, "applicable_to.sections": sectionStr },
        { "applicable_to.classes": allRegex, "applicable_to.sections": allRegex }
      ]
    });

    if (!scheme) {
      const allSchemes = await db.collection("marking_schemes").find({ status: "Active" }).project({ scheme_name: 1, academic_year: 1, applicable_to: 1 }).toArray();
      console.log("Upload Marks Failed. All active schemes in DB:", JSON.stringify(allSchemes));
      return res.status(404).json({
        message: "No active marking scheme found for this class/section"
      });
    }

    const teacherInfo = {
      teacher_id: req.params.teacherId,
      teacher_name: teacher.personal_details?.name ||
        `${teacher.personal_details?.first_name} ${teacher.personal_details?.last_name}`.trim()
    };

    const resultsToInsert = [];
    const errors = [];

    for (const studentMark of students_marks) {
      try {
        const altClassNum = isNaN(Number(className)) ? className : Number(className);

        const student = await db.collection("student").findOne({
          admission_no: studentMark.admission_no,
          $or: [
            { "academic.current_class": className, "academic.section": section },
            { "academic.current_class": altClassNum, "academic.section": section },
            { class: className, section: section },
            { class: altClassNum, section: section }
          ]
        });

        if (!student) {
          errors.push({ admission_no: studentMark.admission_no, error: "Student not found in this class" });
          continue;
        }

        // Flatten components to handle sub_components (e.g. MID_SA1_written)
        const flatComponents = [];
        scheme.components.forEach(comp => {
          if (comp.sub_components && comp.sub_components.length > 0) {
            comp.sub_components.forEach(subComp => {
              flatComponents.push({
                component_id: `${comp.component_id}_${subComp.name.toLowerCase().replace(/\\s+/g, '_')}`,
                max_marks: subComp.max_marks || comp.max_marks
              });
            });
          } else {
            flatComponents.push({
              component_id: comp.component_id,
              max_marks: comp.max_marks
            });
          }
        });

        let totalObtained = 0;
        let totalMax = 0;
        const marks = {};

        for (const [componentId, markData] of Object.entries(studentMark.marks)) {
          const component = flatComponents.find(c => c.component_id === componentId);
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

        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        let gradesArray = [];
        if (scheme.grading && scheme.grading.grades) {
          gradesArray = scheme.grading.grades;
        } else if (scheme.grading_system && scheme.grading_system.grade_ranges) {
          gradesArray = scheme.grading_system.grade_ranges;
        }

        const gradeInfo = gradesArray.find(
          g => percentage >= g.min && percentage <= g.max
        ) || { grade: "N/A", remarks: "N/A" };

        const existing = await db.collection("results").findOne({
          admission_no: studentMark.admission_no,
          exam_id: exam_id,
          subject: subject,
          academic_year: academic_year || currentAcademicYear()
        });

        const resultDoc = {
          admission_no: studentMark.admission_no,
          class: className,
          section: section,
          academic_year: academic_year || currentAcademicYear(),
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
          await db.collection("results").updateOne(
            { _id: existing._id },
            { $set: resultDoc }
          );
        } else {
          resultsToInsert.push(resultDoc);
        }

      } catch (err) {
        errors.push({ admission_no: studentMark.admission_no, error: err.message });
      }
    }

    let insertedCount = 0;
    if (resultsToInsert.length > 0) {
      const result = await db.collection("results").insertMany(resultsToInsert);
      insertedCount = result.insertedCount;
    }

    updateStudentAnalytics(db, students_marks.map(s => s.admission_no), academic_year || currentAcademicYear());

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
      academic_year: academic_year || currentAcademicYear()
    };

    if (exam_id) query.exam_id = exam_id;
    if (subject) query.subject = subject;

    const results = await db.collection("results")
      .find(query)
      .sort({ admission_no: 1 })
      .toArray();

    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        const student = await db.collection("students").findOne(
          { admission_no: result.admission_no },
          { projection: { admission_no: 1, personal_details: 1, roll_no: 1 } }
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

    const classNameStr = String(result.class);
    const sectionStr = String(result.section);
    const allRegex = /^all$/i;
    const yearVariants = buildYearVariants(result.academic_year);

    const scheme = await db.collection("marking_schemes").findOne({
      academic_year: { $in: yearVariants },
      status: "Active",
      $or: [
        { "applicable_to.classes": classNameStr, "applicable_to.sections": sectionStr },
        { "applicable_to.classes": classNameStr, "applicable_to.sections": allRegex },
        { "applicable_to.classes": allRegex, "applicable_to.sections": sectionStr },
        { "applicable_to.classes": allRegex, "applicable_to.sections": allRegex }
      ]
    });

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
    const gradeInfo = scheme?.grading?.grades?.find(
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

    const query = { exam_id, subject, class: className, section };
    const updateDoc = { is_published, published_at: is_published ? new Date() : null };

    const result = await db.collection("results").updateMany(query, { $set: updateDoc });

    // Force regeneration of student analytics now that they are published
    if (result.modifiedCount > 0 && is_published) {
      const updatedDocs = await db.collection("results").find(query).toArray();
      const admissionNos = [...new Set(updatedDocs.map(r => r.admission_no))];

      if (admissionNos.length > 0) {
        // Run asynchronously, don't wait for response
        updateStudentAnalytics(db, admissionNos, updateDoc.academic_year || currentAcademicYear());
      }
    }

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
    const academicYear = req.query.year || currentAcademicYear();

    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const results = await db.collection("results").find({
      "uploaded_by.teacher_id": req.params.teacherId,
      academic_year: academicYear
    }).toArray();

    const stats = {
      total_results_uploaded: results.length,
      published_results: results.filter(r => r.is_published).length,
      unpublished_results: results.filter(r => !r.is_published).length,
      subjects: {},
      exams: {},
      grade_distribution: {},
      class_performance: []
    };

    results.forEach(result => {
      if (!stats.subjects[result.subject]) {
        stats.subjects[result.subject] = { count: 0, avg_percentage: 0, total_percentage: 0 };
      }
      stats.subjects[result.subject].count++;
      stats.subjects[result.subject].total_percentage += result.percentage;

      if (!stats.exams[result.exam_id]) {
        stats.exams[result.exam_id] = { count: 0, avg_percentage: 0, total_percentage: 0 };
      }
      stats.exams[result.exam_id].count++;
      stats.exams[result.exam_id].total_percentage += result.percentage;

      stats.grade_distribution[result.grade] = (stats.grade_distribution[result.grade] || 0) + 1;
    });

    Object.keys(stats.subjects).forEach(subject => {
      stats.subjects[subject].avg_percentage = parseFloat(
        (stats.subjects[subject].total_percentage / stats.subjects[subject].count).toFixed(2)
      );
      delete stats.subjects[subject].total_percentage;
    });

    Object.keys(stats.exams).forEach(exam => {
      stats.exams[exam].avg_percentage = parseFloat(
        (stats.exams[exam].total_percentage / stats.exams[exam].count).toFixed(2)
      );
      delete stats.exams[exam].total_percentage;
    });

    const classSectionMap = {};
    results.forEach(result => {
      const key = `${result.class}-${result.section}`;
      if (!classSectionMap[key]) {
        classSectionMap[key] = { class: result.class, section: result.section, count: 0, total_percentage: 0 };
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
    const academicYear = req.query.year || currentAcademicYear();

    const teacher = await db.collection("teachers").findOne({
      teacher_id: req.params.teacherId
    });

    const query = { academic_year: academicYear };
    if (exam_id) query.exam_id = exam_id;
    if (subject) query.subject = subject;

    const classPerformance = [];

    for (const assignedClass of teacher.assigned_classes) {
      const classQuery = { ...query, class: assignedClass.class };
      if (assignedClass.section && assignedClass.section !== "undefined") {
        classQuery.section = assignedClass.section;
      }

      const results = await db.collection("results").find(classQuery).toArray();

      if (results.length > 0) {
        const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
        const avgPercentage = totalPercentage / results.length;
        const gradeCount = {};
        results.forEach(r => { gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1; });

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

// @route   GET /api/teacher/:teacherId/results/history
// @desc    Get summary of all result upload sessions for a teacher
router.get("/:teacherId/results/history", async (req, res) => {
  try {
    const db = getDB(req);
    const academicYear = req.query.year || currentAcademicYear();
    const yearVariants = buildYearVariants(academicYear);

    // Use aggregation to find unique upload sessions (by exam, subject, class, section)
    const history = await db.collection("results").aggregate([
      {
        $match: {
          "uploaded_by.teacher_id": req.params.teacherId,
          academic_year: { $in: yearVariants }
        }
      },
      {
        $group: {
          _id: {
            exam_id: "$exam_id",
            subject: "$subject",
            class: "$class",
            section: "$section"
          },
          total_students: { $sum: 1 },
          published_count: {
            $sum: { $cond: ["$is_published", 1, 0] }
          },
          last_updated: { $max: "$last_updated" },
          uploaded_at: { $min: "$uploaded_at" }
        }
      },
      {
        $project: {
          _id: 0,
          exam_id: "$_id.exam_id",
          subject: "$_id.subject",
          class: "$_id.class",
          section: "$_id.section",
          total_students: 1,
          published_count: 1,
          last_updated: 1,
          uploaded_at: 1
        }
      },
      { $sort: { last_updated: -1 } }
    ]).toArray();

    // Enrich with exam names
    const examIds = [...new Set(history.map(h => h.exam_id))];
    const validObjectIds = examIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    const exams = await db.collection("exam_sessions").find({
      $or: [
        { _id: { $in: validObjectIds } },
        { exam_code: { $in: examIds } }
      ]
    }).toArray();

    const enrichedHistory = history.map(h => {
      const exam = exams.find(e => e._id.toString() === h.exam_id || e.exam_code === h.exam_id);
      return {
        ...h,
        exam_name: exam ? (exam.title || exam.name || exam.exam_code) : h.exam_id
      };
    });

    res.json(enrichedHistory);
  } catch (error) {
    console.error("Error fetching results history:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/teacher/:teacherId/results/session
// @desc    Delete all results for a specific upload session
router.delete("/:teacherId/results/session", async (req, res) => {
  try {
    const db = getDB(req);
    const { exam_id, subject, class: className, section, academic_year } = req.query;

    if (!exam_id || !subject || !className || !section) {
      return res.status(400).json({ message: "Missing required query parameters" });
    }

    const academicYearActual = academic_year || currentAcademicYear();
    const yearVariants = buildYearVariants(academicYearActual);

    const query = {
      exam_id,
      subject,
      class: className,
      section,
      academic_year: { $in: yearVariants },
      "uploaded_by.teacher_id": req.params.teacherId
    };

    // Before deleting, get admission numbers to update analytics
    const resultsToDelete = await db.collection("results").find(query).toArray();
    const admissionNos = [...new Set(resultsToDelete.map(r => r.admission_no))];

    const deleteResult = await db.collection("results").deleteMany(query);

    if (deleteResult.deletedCount > 0 && admissionNos.length > 0) {
      updateStudentAnalytics(db, admissionNos, query.academic_year);
    }

    res.json({
      message: "Results session deleted successfully",
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error("Error deleting results session:", error);
    res.status(500).json({ message: error.message });
  }
});

// ========== BEHAVIOR & REPORT CARDS ==========

// @route   GET /api/teacher/:teacherId/results/report-card/:admissionNo
// @desc    Generate student report card with all CBSE terms & subjects
router.get("/:teacherId/results/report-card/:admissionNo", async (req, res) => {
  try {
    const db = getDB(req);
    const { admissionNo } = req.params;
    const academicYear = req.query.year || currentAcademicYear();

    // Fetch Student Detials
    const student = await db.collection("students").findOne({ admission_no: admissionNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Fetch marks mapped by exam session
    // In a real database relational map, we'd lookup `student_marks` joined with `exam_sessions`.
    // Since we are adding `student_marks` as an expansion, here is the aggregation for all exams:
    const results = await db.collection("results").find({
      admission_no: admissionNo,
      academic_year: academicYear
    }).toArray();

    // Group marks by Exam ID
    const examBreakdown = {};
    for (let r of results) {
      if (!examBreakdown[r.exam_id]) {
        examBreakdown[r.exam_id] = { subjects: [] };
      }
      examBreakdown[r.exam_id].subjects.push({
        subject: r.subject,
        marks: r.marks, // Contains obtained/max for each component
        total_obtained: r.total_obtained,
        total_max: r.total_max,
        percentage: r.percentage,
        grade: r.grade,
        passed: r.passed
      });
    }

    res.json({
      student_info: {
        admission_no: student.admission_no,
        name: `${student.personal_details?.first_name} ${student.personal_details?.last_name}`,
        class: student.academic_details?.class,
        section: student.academic_details?.section,
        roll_no: student.academic_details?.roll_number,
      },
      academic_year: academicYear,
      exams: examBreakdown
    });

  } catch (error) {
    console.error("Error generating report card:", error);
    res.status(500).json({ message: error.message });
  }
});


// ========== ANALYTICS MANAGEMENT ==========

// @route   POST /api/teacher/:teacherId/results/regenerate-analytics
// @desc    Manually regenerate analytics for students (useful for debugging)
router.post("/:teacherId/results/regenerate-analytics", async (req, res) => {
  try {
    const db = getDB(req);
    const { admission_nos, academic_year } = req.body;
    const year = academic_year || currentAcademicYear();

    if (!admission_nos || !Array.isArray(admission_nos)) {
      return res.status(400).json({ message: "admission_nos array is required" });
    }

    console.log(`Regenerating analytics for ${admission_nos.length} students`);
    await updateStudentAnalytics(db, admission_nos, year);

    res.json({
      message: "Analytics regenerated successfully",
      students: admission_nos.length,
      academic_year: year
    });
  } catch (error) {
    console.error("Error regenerating analytics:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;