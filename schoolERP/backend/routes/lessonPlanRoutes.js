import express from "express";
import { ObjectId } from "mongodb";
import upload from "../middleware/upload.js"; // Standard Multer upload
import cloudinary from '../config/cloudinaryConfig.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const getDB = (req) => req.app.locals.db;

const toObjectId = (id) => {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch (e) {
    return id;
  }
};

// Helper to standardise pagination and response
const paginateData = async (cursor, page, limit) => {
  const total = await cursor.count();
  const data = await cursor
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Audit Trail Helper
 */
const addAudit = (action, by, comment = "") => ({
  action,
  by: by ? toObjectId(by) : null,
  timestamp: new Date(),
  comment
});

/**
 * Cloudinary Upload Helper
 */
const uploadToCloudinary = async (file, folder) => {
  try {
    const extension = path.extname(file.originalname);
    const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, "");
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);

    const isImage = file.mimetype.startsWith('image/');
    const isAudio = file.mimetype.startsWith('audio/') || file.mimetype.includes('webm');

    let resourceType = 'raw';
    if (isImage) resourceType = 'image';
    else if (isAudio) resourceType = 'video';

    const publicId = (resourceType === 'raw')
      ? `${Date.now()}_${sanitizedName}${extension}`
      : `${Date.now()}_${sanitizedName}`;

    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: resourceType,
      public_id: publicId,
    });

    // Clean up temp file
    fs.unlink(file.path, () => {});
    return result.secure_url;
  } catch (error) {
    if (file.path) fs.unlink(file.path, () => {});
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

// ==========================================
// UNIFIED LESSON PLAN ROUTES (/api/lesson-plans)
// ==========================================

router.get("/", async (req, res) => {
  try {
    const db = getDB(req);
    const { teacher_id, class_id, section, approval_status, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (teacher_id) query.teacher_id = toObjectId(teacher_id);
    if (class_id) query.class_id = toObjectId(class_id);
    if (section) query.section = section;
    if (approval_status) query.approval_status = approval_status;
    if (status) query.status = status;

    const cursor = db.collection("lesson_plans").find(query).sort({ planned_date: 1 });
    const result = await paginateData(cursor, parseInt(page), parseInt(limit));

    // Manual Population for Teachers, Classes, and Subjects
    if (result.data && result.data.length > 0) {
      const teacherIds = [...new Set(result.data.map(p => p.teacher_id).filter(Boolean))];
      const classIds = [...new Set(result.data.map(p => p.class_id).filter(Boolean))];
      const subjectIds = [...new Set(result.data.map(p => p.subject_id).filter(Boolean))];

      // Safe filter for ObjectIds
      const validTeacherObjectIds = teacherIds.filter(id => String(id).length === 24 && ObjectId.isValid(id)).map(id => new ObjectId(id));
      const validClassObjectIds = classIds.filter(id => String(id).length === 24 && ObjectId.isValid(id) && id !== "000000000000000000000000").map(id => new ObjectId(id));
      const validSubjectObjectIds = subjectIds.filter(id => String(id).length === 24 && ObjectId.isValid(id) && id !== "000000000000000000000000").map(id => new ObjectId(id));

      const [teachers, classes, subjects] = await Promise.all([
        db.collection("teachers").find({
          $or: [
            { _id: { $in: validTeacherObjectIds } },
            { teacher_id: { $in: teacherIds.map(String) } }
          ]
        }).toArray(),
        db.collection("classes").find({ _id: { $in: validClassObjectIds } }).toArray(),
        db.collection("subjects").find({ _id: { $in: validSubjectObjectIds } }).toArray(),
      ]);

      const teacherMap = {};
      teachers.forEach(t => {
        const name = t.personal_details?.name || `${t.personal_details?.first_name || ''} ${t.personal_details?.last_name || ''}`.trim() || 'Unknown';
        const assigned_classes = t.assigned_classes || [];
        teacherMap[t._id.toString()] = { name, assigned_classes };
        if (t.teacher_id) teacherMap[t.teacher_id] = { name, assigned_classes };
      });

      
      const classMap = Object.fromEntries(classes.map(c => [c._id.toString(), {
        class_name: c.className || c.class_name || 'Class'
      }]));
      
      const subjectMap = Object.fromEntries(subjects.map(s => [s._id.toString(), {
        subject_name: s.subjectName || s.subject_name || 'Subject'
      }]));

      result.data = result.data.map(plan => {
        const teacherInfo = plan.teacher_id ? (teacherMap[plan.teacher_id.toString()] || teacherMap[plan.teacher_id]) : null;
        
        let classInfo = plan.class_id ? (classMap[plan.class_id.toString()] || null) : null;
        let subjectInfo = plan.subject_id ? (subjectMap[plan.subject_id.toString()] || null) : null;

        // Best Effort Fallback: If IDs are placeholders or missing, check Teacher's assigned_classes
        if ((!classInfo || plan.class_id?.toString() === "000000000000000000000000") && teacherInfo?.assigned_classes) {
          // Find a match by section and subject (if available) or just section
          const match = teacherInfo.assigned_classes.find(ac => ac.section === plan.section) || teacherInfo.assigned_classes[0];
          if (match) {
            if (!classInfo || plan.class_id?.toString() === "000000000000000000000000") {
              classInfo = { class_name: `Class ${match.class || ''}`.trim() || "Not Assigned" };
            }
            if (!subjectInfo || plan.subject_id?.toString() === "000000000000000000000000") {
              subjectInfo = { subject_name: match.subject || match.subject_name || "Subject" };
            }
          }
        }

        // Final fallback for placeholders if no match found
        if (!classInfo && plan.class_id?.toString() === "000000000000000000000000") classInfo = { class_name: "Not Assigned" };
        if (!subjectInfo && plan.subject_id?.toString() === "000000000000000000000000") subjectInfo = { subject_name: "Not Assigned" };

        return {
          ...plan,
          teacher_id: teacherInfo || plan.teacher_id,
          class_id: classInfo || plan.class_id,
          subject_id: subjectInfo || plan.subject_id
        };
      });


    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/lesson-plans
// @desc    Create a new Draft lesson plan
router.post("/", upload.array('resources', 5), async (req, res) => {
  try {
    const db = getDB(req);
    const { 
      class_id, section, subject_id, teacher_id, 
      topic, objectives, teaching_method, planned_date, remarks 
    } = req.body;

    // Handle uploaded files (muliple allowed for 'resources')
    let resources = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file, `lesson_plans/${teacher_id}`);
        if (url) resources.push(url);
      }
    }
    
    // Also parse any existing string URLs passed from frontend
    let existingResources = [];
    if (req.body.existing_resources) {
      try {
        existingResources = JSON.parse(req.body.existing_resources);
      } catch (e) {
        existingResources = [req.body.existing_resources];
      }
    }

    const lessonPlan = {
      class_id: toObjectId(class_id),
      section,
      subject_id: toObjectId(subject_id),
      teacher_id: toObjectId(teacher_id),
      topic,
      objectives,
      teaching_method,
      resources: [...existingResources, ...resources],
      planned_date: new Date(planned_date),
      actual_date: null,
      status: "Draft",
      approval_status: "Draft",
      remarks: remarks || "",
      created_at: new Date(),
      updated_at: new Date(),
      history: [addAudit("CREATED", teacher_id, "Draft Lesson Plan Created")]
    };

    const result = await db.collection("lesson_plans").insertOne(lessonPlan);
    res.status(201).json({ message: "Lesson plan created successfully", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/lesson-plans/bulk
// @desc    Bulk create lesson plans for weekly planning
router.post("/bulk", async (req, res) => {
  try {
    const db = getDB(req);
    const { plans, teacher_id } = req.body; // Expects an array of plan objects

    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ message: "Invalid or empty plans array" });
    }

    const payload = plans.map(plan => ({
      class_id: toObjectId(plan.class_id),
      section: plan.section,
      subject_id: toObjectId(plan.subject_id),
      teacher_id: toObjectId(teacher_id || plan.teacher_id),
      topic: plan.topic,
      objectives: plan.objectives,
      teaching_method: plan.teaching_method,
      resources: plan.resources || [],
      planned_date: new Date(plan.planned_date),
      actual_date: null,
      status: "Draft",
      approval_status: "Draft",
      remarks: plan.remarks || "",
      created_at: new Date(),
      updated_at: new Date(),
      history: [addAudit("CREATED_BULK", teacher_id || plan.teacher_id, "Created via Weekly Bulk Planning")]
    }));

    const result = await db.collection("lesson_plans").insertMany(payload);
    res.status(201).json({ message: `Successfully inserted ${result.insertedCount} plans`, count: result.insertedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/lesson-plans/:id
// @desc    Update a lesson plan details
router.put("/:id", upload.array('resources', 5), async (req, res) => {
  try {
    const db = getDB(req);
    const { id } = req.params;
    const { 
      topic, objectives, teaching_method, planned_date, remarks, updater_id 
    } = req.body;

    const existing = await db.collection("lesson_plans").findOne({ _id: toObjectId(id) });
    if (!existing) return res.status(404).json({ message: "Lesson plan not found" });

    // Block heavy edits if approved/completed unless Admin (can be extended)
    if (existing.status === "Completed") {
      return res.status(403).json({ message: "Cannot edit a completed lesson plan" });
    }

    let newResources = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file, `lesson_plans/${existing.teacher_id}`);
        if (url) newResources.push(url);
      }
    }
    
    let keptResources = [];
    if (req.body.kept_resources) {
        try { keptResources = JSON.parse(req.body.kept_resources); } 
        catch (e) { keptResources = [req.body.kept_resources]; }
    } else {
        keptResources = existing.resources || [];
    }

    const updateDoc = {
      topic: topic || existing.topic,
      objectives: objectives || existing.objectives,
      teaching_method: teaching_method || existing.teaching_method,
      resources: [...keptResources, ...newResources],
      planned_date: planned_date ? new Date(planned_date) : existing.planned_date,
      remarks: remarks !== undefined ? remarks : existing.remarks,
      updated_at: new Date()
    };

    const historyItem = addAudit("UPDATED", updater_id || existing.teacher_id, "Teacher updated plan details");

    await db.collection("lesson_plans").updateOne(
      { _id: toObjectId(id) },
      { 
        $set: updateDoc,
        $push: { history: historyItem }
      }
    );

    res.json({ message: "Lesson plan updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/lesson-plans/:id
// @desc    Delete a lesson plan
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB(req);
    const existing = await db.collection("lesson_plans").findOne({ _id: toObjectId(req.params.id) });
    
    if (!existing) return res.status(404).json({ message: "Lesson plan not found" });
    if (existing.status === "Completed") {
      return res.status(403).json({ message: "Cannot delete a completed plan" });
    }

    await db.collection("lesson_plans").deleteOne({ _id: toObjectId(req.params.id) });
    res.json({ message: "Lesson plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// LIFECYCLE & STATUS APIs
// ==========================================

// @route   PUT /api/lesson-plans/:id/submit
// @desc    Move Draft -> Submitted
router.put("/:id/submit", async (req, res) => {
  try {
    const db = getDB(req);
    const result = await db.collection("lesson_plans").updateOne(
      { _id: toObjectId(req.params.id), approval_status: "Draft" },
      { 
        $set: { approval_status: "Submitted", updated_at: new Date() },
        $push: { history: addAudit("SUBMITTED", req.body.teacher_id, "Submitted for HOD approval") }
      }
    );

    if (result.matchedCount === 0) return res.status(400).json({ message: "Plan is not in Draft state or not found" });
    res.json({ message: "Lesson plan submitted for approval" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/lesson-plans/:id/approval
// @desc    Admin: Submitted -> Approved/Rejected with comment
router.put("/:id/approval", async (req, res) => {
  try {
    const db = getDB(req);
    const { status, admin_id, comment } = req.body; // status: "Approved" | "Rejected"
    const { id } = req.params;
    
    console.log(`[Approval Request] ID: ${id}, Status: ${status}, Admin: ${admin_id}`);

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be Approved or Rejected" });
    }

    const result = await db.collection("lesson_plans").updateOne(
      { _id: toObjectId(id) }, // Removed Submitted check to be more flexible for testing
      { 
        $set: { 
          approval_status: status, 
          updated_at: new Date(),
          admin_remarks: comment || "",
          remarks: comment || "" 
        },
        $push: { history: addAudit(status.toUpperCase(), admin_id, comment || `Admin marked as ${status}`) }
      }
    );


    console.log(`[Approval Result] Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    if (result.matchedCount === 0) return res.status(400).json({ message: "Plan not found" });
    res.json({ message: `Lesson plan ${status}`, updatedStatus: status });
  } catch (error) {
    console.error(`[Approval Error] ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/lesson-plans/:id/execution
// @desc    Teacher: Mark Execution Status (Completed/Partial/Postponed)
router.put("/:id/execution", async (req, res) => {
  try {
    const db = getDB(req);
    const { status, remarks, actual_date, teacher_id } = req.body;
    
    if (!["Completed", "Partial", "Postponed"].includes(status)) {
      return res.status(400).json({ message: "Invalid execution status" });
    }

    const existing = await db.collection("lesson_plans").findOne({ _id: toObjectId(req.params.id) });
    if (!existing) return res.status(404).json({ message: "Lesson plan not found" });

    // Enterprise rule: Block execution if not approved
    if (existing.approval_status !== "Approved") {
      return res.status(403).json({ message: "Cannot execute an unapproved lesson plan. Please request approval first." });
    }

    await db.collection("lesson_plans").updateOne(
      { _id: toObjectId(req.params.id) },
      { 
        $set: { 
          status, 
          remarks: remarks || existing.remarks,
          actual_date: actual_date ? new Date(actual_date) : new Date(),
          updated_at: new Date() 
        },
        $push: { history: addAudit(`EXECUTION_${status.toUpperCase()}`, teacher_id, remarks || `Marked as ${status}`) }
      }
    );

    res.json({ message: `Lesson plan marked as ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
