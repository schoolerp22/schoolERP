import express from "express";
import { ObjectId } from "mongodb";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { validateFeeSetup, validatePayment } from "../utils/validators.js";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// All routes require authentication
router.use(verifyToken);

// ==========================================
// 1. CLASS MANAGEMENT
// ==========================================
// GET all classes — pulls distinct class names from existing students + any custom accounting_classes
router.get("/classes", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const schoolId = req.user.schoolId;

        // Students store class in 'academic.current_class' (can be number or string)
        const rawClasses = await db.collection("student").distinct("academic.current_class");

        // Also try top-level 'class' field as fallback
        const rawClassesAlt = await db.collection("student").distinct("class");

        console.log("🔍 academic.current_class:", rawClasses);
        console.log("🔍 class field:", rawClassesAlt);

        // Merge both sources, convert numbers to strings
        const studentClasses = [...new Set([...rawClasses, ...rawClassesAlt]
            .filter(c => c !== null && c !== undefined && c !== "")
            .map(c => String(c))
        )];

        // Also check for any manually added accounting_classes
        const customClasses = await db.collection("accounting_classes")
            .find({ schoolId })
            .toArray();
        const customClassNames = customClasses.map(c => c.className).filter(Boolean);

        const allClassNames = [...new Set([...studentClasses, ...customClassNames])];

        // Sort intelligently
        const classOrder = ["LKG", "UKG", "Nursery", "Pre-Nursery", "Prep", "KG", "KG1", "KG2",
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
            "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
            "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

        allClassNames.sort((a, b) => {
            const ai = classOrder.findIndex(c => c.toLowerCase() === String(a).toLowerCase());
            const bi = classOrder.findIndex(c => c.toLowerCase() === String(b).toLowerCase());
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            // Numeric sort for class numbers
            const aNum = Number(a), bNum = Number(b);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return String(a).localeCompare(String(b));
        });

        const result = allClassNames.map((cn, idx) => ({
            _id: cn,
            className: String(cn),
            order: idx,
            schoolId
        }));

        console.log("✅ Returning classes:", result.map(r => r.className));
        res.json(result);
    } catch (error) {
        console.error("Error fetching classes:", error);
        res.status(500).json({ message: "Error fetching classes", error: error.message });
    }
});


router.post("/classes", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { className, order } = req.body;
        const schoolId = req.user.schoolId;
        if (!className) return res.status(400).json({ message: "className is required" });
        const existingClass = await db.collection("accounting_classes").findOne({ className, schoolId });
        if (existingClass) return res.status(400).json({ message: "Class already exists" });
        const newClass = { className, order: order || 99, schoolId, createdAt: new Date(), updatedAt: new Date() };
        const result = await db.collection("accounting_classes").insertOne(newClass);
        res.status(201).json({ message: "Class created successfully", classId: result.insertedId, ...newClass });
    } catch (error) {
        res.status(500).json({ message: "Error creating class", error: error.message });
    }
});

// ==========================================
// 2. FEE HEADS MANAGEMENT
// ==========================================

router.get("/fee-heads", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        // Don't filter by schoolId — fee heads are shared across the school
        // (admin and accountant may have different schoolId values)
        const feeHeads = await db.collection("accounting_fee_heads")
            .find({})
            .sort({ name: 1 })
            .toArray();
        res.json(feeHeads);
    } catch (error) {
        res.status(500).json({ message: "Error fetching fee heads", error: error.message });
    }
});

router.post("/fee-heads", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { name, type, frequency, optional } = req.body;
        const schoolId = req.user.schoolId;
        if (!name) return res.status(400).json({ message: "Fee head name is required" });
        const newFeeHead = {
            name, type: type || "Standard", frequency: frequency || "Monthly",
            optional: !!optional, schoolId, createdAt: new Date(), updatedAt: new Date()
        };
        const result = await db.collection("accounting_fee_heads").insertOne(newFeeHead);
        res.status(201).json({ message: "Fee head created successfully", headId: result.insertedId, ...newFeeHead });
    } catch (error) {
        res.status(500).json({ message: "Error creating fee head", error: error.message });
    }
});

// ==========================================
// 3. FEE STRUCTURE
// ==========================================

router.get("/fee-structure/class/:className", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { className } = req.params;
        const schoolId = req.user.schoolId;

        // First try without schoolId (works across admin/accountant boundaries)
        let structure = await db.collection("accounting_fee_structures").findOne({ className });
        // If not found, try with schoolId (strict multi-tenant)
        if (!structure) structure = await db.collection("accounting_fee_structures").findOne({ className, schoolId });
        if (!structure) return res.status(404).json({ message: "Fee structure not found for this class" });
        res.json(structure);
    } catch (error) {
        res.status(500).json({ message: "Error fetching fee structure", error: error.message });
    }
});

router.post("/fee-structure", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const validation = validateFeeSetup(req.body);
        if (!validation.isValid) return res.status(400).json({ message: validation.message });
        const { className, feeHeads } = req.body;
        const schoolId = req.user.schoolId;
        await db.collection("accounting_fee_structures").updateOne(
            { className, schoolId },
            {
                $set: { feeHeads, updatedAt: new Date() },
                $setOnInsert: { className, schoolId, createdAt: new Date() }
            },
            { upsert: true }
        );
        res.json({ message: "Fee structure saved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error saving fee structure", error: error.message });
    }
});

// ==========================================
// 4. STUDENTS (for accounting context)
// ==========================================

router.get("/students", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { className, search } = req.query;

        let query = {};

        if (className) {
            // class can be string or number; try both via $or
            const classNum = isNaN(Number(className)) ? null : Number(className);
            query.$or = classNum !== null
                ? [{ "academic.current_class": className }, { "academic.current_class": classNum }, { class: className }]
                : [{ "academic.current_class": className }, { class: className }];
        }

        if (search) {
            const searchCond = [
                { admission_no: { $regex: search, $options: "i" } },
                { "personal_details.first_name": { $regex: search, $options: "i" } },
                { "personal_details.last_name": { $regex: search, $options: "i" } }
            ];
            // Merge with existing $or if className used
            query = className
                ? { $and: [{ $or: query.$or }, { $or: searchCond }] }
                : { $or: searchCond };
        }

        const students = await db.collection("student")
            .find(query, {
                projection: {
                    admission_no: 1, class: 1, section: 1, roll_no: 1,
                    academic: 1,
                    "personal_details.first_name": 1, "personal_details.last_name": 1,
                    "personal_details.email": 1, "parent_record.father_name": 1,
                    "parent_record.primary_contact": 1
                }
            })
            .limit(50)
            .toArray();

        // Map to a cleaner format — handle both nested and flat structure
        const mapped = students.map(s => ({
            _id: s._id,
            admission_no: s.admission_no,
            name: `${s.personal_details?.first_name || ""} ${s.personal_details?.last_name || ""}`.trim(),
            class: String(s.academic?.current_class || s.class || ""),
            section: s.academic?.section || s.section || "",
            roll_no: s.academic?.roll_no || s.roll_no || "",
            father_name: s.parent_record?.father_name || "",
            contact: s.parent_record?.primary_contact || "",
            email: s.personal_details?.email || ""
        }));

        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: "Error fetching students", error: error.message });
    }
});


router.get("/students/:admissionNo", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const student = await db.collection("student").findOne({ admission_no: req.params.admissionNo });
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "Error fetching student", error: error.message });
    }
});

router.get("/students/:admissionNo/dues", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { admissionNo } = req.params;

        const student = await db.collection("student").findOne({ admission_no: admissionNo });
        if (!student) return res.status(404).json({ message: "Student not found" });

        // Get student's class — check both nested and flat field
        const studentClass = String(student.academic?.current_class || student.class || "");
        const studentSection = student.academic?.section || student.section || "";

        console.log(`📚 Student ${admissionNo} class: "${studentClass}" section: "${studentSection}"`);

        // Get fee structure for student's class — NO schoolId filter (admin/accountant may differ)
        let feeStructure = await db.collection("accounting_fee_structures").findOne({ className: studentClass });

        // Try numeric version of class too (e.g., "2" vs 2)
        if (!feeStructure && !isNaN(Number(studentClass))) {
            feeStructure = await db.collection("accounting_fee_structures")
                .findOne({ className: Number(studentClass) });
        }

        console.log(`💰 Fee structure for class "${studentClass}":`, feeStructure ? "found" : "NOT FOUND");

        // Get all paid receipts for this student
        const paidReceipts = await db.collection("accounting_receipts")
            .find({ admissionNo, status: { $in: ["paid", "partial"] } })
            .toArray();

        const paidMonths = new Set();
        paidReceipts.forEach(r => {
            if (r.months) r.months.forEach(m => paidMonths.add(m));
        });

        // Generate last 6 months dues
        const dues = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleString("default", { month: "short", year: "numeric" });
            const isPaid = paidMonths.has(monthKey);
            const monthlyFees = feeStructure?.feeHeads?.filter(h => h.frequency === "Monthly") || [];
            const totalDue = monthlyFees.reduce((sum, h) => sum + (h.amount || 0), 0);
            dues.push({ monthKey, label, isPaid, totalDue: isPaid ? 0 : totalDue, feeBreakdown: monthlyFees });
        }

        res.json({
            student: {
                name: `${student.personal_details?.first_name || ""} ${student.personal_details?.last_name || ""}`.trim(),
                admission_no: student.admission_no,
                class: studentClass,
                section: studentSection,
            },
            feeStructure,
            dues
        });
    } catch (error) {
        console.error("Student dues error:", error);
        res.status(500).json({ message: "Error fetching dues", error: error.message });
    }
});

// ==========================================
// 5. PAYMENTS & RECEIPTS
// ==========================================

// Collect Payment
router.post("/payments/collect", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const schoolId = req.user.schoolId;
        const { admissionNo, months, feeBreakdown, totalAmount, paymentMode, chequeNo, bankName, remarks } = req.body;

        if (!admissionNo || !totalAmount || !paymentMode) {
            return res.status(400).json({ message: "admissionNo, totalAmount, and paymentMode are required" });
        }

        // Generate receipt number
        const receiptCount = await db.collection("accounting_receipts").countDocuments({ schoolId });
        const receiptNo = `RCT-${schoolId.slice(0, 5).toUpperCase()}-${String(receiptCount + 1).padStart(4, "0")}`;

        const student = await db.collection("student").findOne({ admission_no: admissionNo });

        const receipt = {
            receiptNo,
            admissionNo,
            studentName: student ? `${student.personal_details?.first_name || ""} ${student.personal_details?.last_name || ""}`.trim() : "Unknown",
            class: student?.class || "",
            section: student?.section || "",
            months: months || [],
            feeBreakdown: feeBreakdown || [],
            totalAmount,
            paymentMode,
            chequeNo: chequeNo || null,
            bankName: bankName || null,
            remarks: remarks || "",
            status: "paid",
            collectedBy: req.user.id,
            schoolId,
            paidAt: new Date(),
            createdAt: new Date()
        };

        const result = await db.collection("accounting_receipts").insertOne(receipt);
        res.status(201).json({ message: "Payment collected successfully", receiptId: result.insertedId, receiptNo, receipt });
    } catch (error) {
        res.status(500).json({ message: "Error collecting payment", error: error.message });
    }
});

// List Receipts
router.get("/payments/receipts", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { studentId, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Don't filter by schoolId — receipts should be visible across admin/accountant
        let query = {};

        if (studentId) {
            // Case-insensitive match for admissionNo
            query.admissionNo = { $regex: `^${studentId}$`, $options: "i" };
        }

        if (startDate || endDate) {
            query.paidAt = {};
            if (startDate) {
                // Start of selected date in IST (UTC-5:30 means we go back 5:30h from midnight IST)
                query.paidAt.$gte = new Date(startDate + "T00:00:00+05:30");
            }
            if (endDate) {
                // End of selected date in IST
                query.paidAt.$lte = new Date(endDate + "T23:59:59+05:30");
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const receipts = await db.collection("accounting_receipts")
            .find(query)
            .sort({ paidAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const total = await db.collection("accounting_receipts").countDocuments(query);
        res.json({ receipts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        res.status(500).json({ message: "Error fetching receipts", error: error.message });
    }
});


// Get Single Receipt
router.get("/payments/receipt/:id", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        let receipt;
        try {
            receipt = await db.collection("accounting_receipts").findOne({ _id: new ObjectId(req.params.id) });
        } catch {
            receipt = await db.collection("accounting_receipts").findOne({ receiptNo: req.params.id });
        }
        if (!receipt) return res.status(404).json({ message: "Receipt not found" });
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ message: "Error fetching receipt", error: error.message });
    }
});

// ==========================================
// 6. DASHBOARD STATS
// ==========================================

router.get("/dashboard/stats", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Today's collection — no schoolId filter
        const todayReceipts = await db.collection("accounting_receipts")
            .find({ paidAt: { $gte: today, $lte: todayEnd } })
            .toArray();
        const todayCollection = todayReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        // Monthly collection
        const monthReceipts = await db.collection("accounting_receipts")
            .find({ paidAt: { $gte: monthStart } })
            .toArray();
        const monthlyCollection = monthReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        const totalReceiptsThisMonth = monthReceipts.length;

        // Total students
        const totalStudents = await db.collection("student").countDocuments();

        // Recent receipts
        const recentReceipts = await db.collection("accounting_receipts")
            .find({})
            .sort({ paidAt: -1 })
            .limit(5)
            .toArray();

        res.json({
            todayCollection,
            monthlyCollection,
            totalReceiptsThisMonth,
            totalStudents,
            recentReceipts
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
    }
});

export default router;
