import express from "express";
import { ObjectId } from "mongodb";
import path from "path";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { validateFeeSetup, validatePayment } from "../utils/validators.js";
import upload from "../middleware/upload.js";

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

        const studentClass = String(student.academic?.current_class || student.class || "");
        const studentSection = student.academic?.section || student.section || "";

        // Get fee structure for student's class
        let feeStructure = await db.collection("accounting_fee_structures").findOne({ className: studentClass });
        if (!feeStructure && !isNaN(Number(studentClass))) {
            feeStructure = await db.collection("accounting_fee_structures")
                .findOne({ className: Number(studentClass) });
        }

        // Get all paid receipts for this student
        const paidReceipts = await db.collection("accounting_receipts")
            .find({ admissionNo, status: { $in: ["paid", "partial"] } })
            .toArray();

        // Track paid months (fully paid only)
        const paidMonths = new Set();
        // Track partially paid months and remaining amounts per fee head
        const partialPayments = {}; // monthKey -> { headName -> amountPaid }
        paidReceipts.forEach(r => {
            const mKeys = r.months || (r.monthKey ? [r.monthKey] : []);
            mKeys.forEach(m => {
                // If the receipt itself is fully paid, mark month as such
                if (r.status === "paid") {
                    paidMonths.add(m);
                }

                // All receipts contribute to head-wise partial payments tracking
                if (!partialPayments[m]) partialPayments[m] = {};
                (r.feeBreakdown || []).forEach(fb => {
                    const amt = Number(fb.amount || 0);
                    partialPayments[m][fb.headName] = (partialPayments[m][fb.headName] || 0) + amt;
                });
            });
        });

        // Academic year logic (updated 2026-03-03)
        // If current month is Jan-Mar, academic year started previous April
        // If current month is Apr-Dec, academic year started this April
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-based (0=Jan, 3=Apr, 11=Dec)
        const currentYear = now.getFullYear();
        let academicStartYear, academicEndYear;
        if (currentMonth < 3) { // Jan(0), Feb(1), Mar(2)
            academicStartYear = currentYear - 1;
            academicEndYear = currentYear;
        } else { // Apr(3) to Dec(11)
            academicStartYear = currentYear;
            academicEndYear = currentYear + 1;
        }

        // Generate dues from April of start year to current month
        const dues = [];
        const monthlyFees = feeStructure?.feeHeads?.filter(h => h.frequency === "Monthly") || [];
        const quarterlyFees = feeStructure?.feeHeads?.filter(h => h.frequency === "Quarterly") || [];
        // Quarterly months (0-based): Apr=3, Jul=6, Oct=9, Jan=0
        const quarterlyMonthNums = [3, 6, 9, 0];
        // Quarter labels for display
        const quarterLabel = { 3: "Apr-Jun", 6: "Jul-Sep", 9: "Oct-Dec", 0: "Jan-Mar" };

        // Start from April of academic start year
        let iterDate = new Date(academicStartYear, 3, 1); // April
        // Generate dues for the entire academic year (up to March of academicEndYear)
        const endDate = new Date(academicEndYear, 2, 1); // 1st of March
        console.log(`[DUES] Academic year: ${academicStartYear}-${academicEndYear}, generating Apr ${academicStartYear} to Mar ${academicEndYear}`);

        while (iterDate <= endDate) {
            const y = iterDate.getFullYear();
            const m = iterDate.getMonth(); // 0-based
            const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
            const label = iterDate.toLocaleString("default", { month: "short", year: "numeric" });

            const isQuarterStart = quarterlyMonthNums.includes(m);
            const isFullyPaid = paidMonths.has(monthKey);

            // Calculate per-head remaining amounts considering partial payments
            const feeBreakdown = [];

            // Add monthly fee heads on all months
            monthlyFees.forEach(h => {
                const paidForHead = partialPayments[monthKey]?.[h.name] || 0;
                feeBreakdown.push({
                    name: h.name,
                    amount: h.amount || 0,
                    paidAmount: paidForHead,
                    remainingAmount: Math.max(0, (h.amount || 0) - paidForHead)
                });
            });

            // Add quarterly fee heads on quarter-start months (Apr, Jul, Oct, Jan)
            if (isQuarterStart) {
                quarterlyFees.forEach(h => {
                    const paidForHead = partialPayments[monthKey]?.[h.name] || 0;
                    feeBreakdown.push({
                        name: h.name,
                        amount: h.amount || 0,
                        paidAmount: paidForHead,
                        remainingAmount: Math.max(0, (h.amount || 0) - paidForHead),
                        isQuarterly: true
                    });
                });
            }

            const totalDue = feeBreakdown.reduce((sum, h) => sum + h.remainingAmount, 0);

            // Push the month for processing; isPaid will be finalized after ad-hoc merge
            if (feeBreakdown.length > 0 || isFullyPaid) {
                dues.push({ monthKey, label, isPaid: isFullyPaid, totalDue, feeBreakdown });
            }

            // Move to next month
            iterDate = new Date(y, m + 1, 1);
        }

        // One-time fees
        const oneTimeFees = [];
        const oneTimeHeads = feeStructure?.feeHeads?.filter(h => h.frequency === "One-time") || [];
        // Check which one-time fees have been paid
        const paidOneTimeHeads = new Set();
        paidReceipts.forEach(r => {
            (r.feeBreakdown || []).forEach(fb => paidOneTimeHeads.add(fb.headName));
        });
        oneTimeHeads.forEach(h => {
            const isPaid = paidOneTimeHeads.has(h.name);
            oneTimeFees.push({
                name: h.name,
                amount: h.amount || 0,
                isPaid
            });
        });
        // Ad-hoc / Additional fees (per-student + class-level)
        const allAdhocFees = await db.collection("accounting_adhoc_fees")
            .find({
                $or: [
                    { appliedTo: "student", admissionNo },
                    { appliedTo: "class", className: studentClass }
                ]
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Filter class-level fees by section
        const adhocFiltered = allAdhocFees.filter(f => {
            if (f.appliedTo === "class" && f.section && f.section !== "") {
                return f.section === studentSection;
            }
            return true;
        });

        // Separate by frequency
        const monthlyAdhoc = adhocFiltered.filter(f => f.frequency === "Monthly");
        const quarterlyAdhoc = adhocFiltered.filter(f => f.frequency === "Quarterly");
        const onetimeAdhoc = adhocFiltered.filter(f => !f.frequency || f.frequency === "One-time");

        // Merge monthly/quarterly ad-hoc fees into existing dues
        dues.forEach(due => {
            const dueMonth = parseInt(due.monthKey.split("-")[1]) - 1; // 0-based

            // Add monthly ad-hoc heads
            monthlyAdhoc.forEach(af => {
                const paidForHead = partialPayments[due.monthKey]?.[af.name] || 0;
                const remaining = Math.max(0, af.amount - paidForHead);
                if (remaining > 0) {
                    due.feeBreakdown.push({
                        name: af.name,
                        amount: af.amount,
                        paidAmount: paidForHead,
                        remainingAmount: remaining,
                        isAdhoc: true,
                        category: af.category || "Other"
                    });
                    due.totalDue += remaining;
                }
            });

            // Add quarterly ad-hoc heads (Apr, Jul, Oct, Jan)
            if (quarterlyMonthNums.includes(dueMonth)) {
                quarterlyAdhoc.forEach(af => {
                    const paidForHead = partialPayments[due.monthKey]?.[af.name] || 0;
                    const remaining = Math.max(0, af.amount - paidForHead);
                    if (remaining > 0) {
                        due.feeBreakdown.push({
                            name: af.name,
                            amount: af.amount,
                            paidAmount: paidForHead,
                            remainingAmount: remaining,
                            isAdhoc: true,
                            category: af.category || "Other"
                        });
                        due.totalDue += remaining;
                    }
                });
            }
        });

        // Finalize isPaid and totalDue consistency
        dues.forEach(due => {
            due.isPaid = (due.totalDue <= 0);
        });

        // Re-filter: remove months that became fully paid after partial payments
        const finalDues = dues;
        console.log(`[DUES_DEBUG] Total dues in response: ${finalDues.length}.`);

        res.json({
            student: {
                name: `${student.personal_details?.first_name || ""} ${student.personal_details?.last_name || ""}`.trim(),
                admission_no: student.admission_no,
                class: studentClass,
                section: studentSection,
            },
            feeStructure,
            dues: finalDues,
            oneTimeFees,
            adhocFees: onetimeAdhoc  // Only one-time ad-hoc fees shown separately
        });
    } catch (error) {
        console.error("Student dues error:", error);
        res.status(500).json({ message: "Error fetching dues", error: error.message });
    }
});

// ==========================================
// 5. PAYMENTS & RECEIPTS
// ==========================================

// Collect Payment (supports file upload for transaction proof)
router.post("/payments/collect", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), upload.single('transactionProof'), async (req, res) => {
    try {
        const db = getDB(req);
        const schoolId = req.user.schoolId;
        const {
            admissionNo, months, feeBreakdown, totalAmount, amountPaid,
            paymentMode, chequeNo, bankName, transactionId,
            lateFee, discountAmount, remarks
        } = req.body;

        // Parse JSON strings (FormData sends strings)
        const parsedMonths = typeof months === 'string' ? JSON.parse(months) : (months || []);
        const parsedFeeBreakdown = typeof feeBreakdown === 'string' ? JSON.parse(feeBreakdown) : (feeBreakdown || []);
        const parsedTotalAmount = Number(totalAmount) || 0;
        const parsedAmountPaid = Number(amountPaid) || parsedTotalAmount;
        const parsedLateFee = Number(lateFee) || 0;
        const parsedDiscount = Number(discountAmount) || 0;

        if (!admissionNo || !parsedTotalAmount || !paymentMode) {
            return res.status(400).json({ message: "admissionNo, totalAmount, and paymentMode are required" });
        }

        // Calculate remaining due
        const netPayable = parsedTotalAmount + parsedLateFee - parsedDiscount;
        const remainingDue = Math.max(0, netPayable - parsedAmountPaid);
        const paymentStatus = remainingDue > 0 ? "partial" : "paid";

        // Generate receipt number
        const receiptCount = await db.collection("accounting_receipts").countDocuments({ schoolId });
        const receiptNo = `RCT-${schoolId.slice(0, 5).toUpperCase()}-${String(receiptCount + 1).padStart(4, "0")}`;

        const student = await db.collection("student").findOne({ admission_no: admissionNo });

        const receipt = {
            receiptNo,
            admissionNo,
            studentName: student ? `${student.personal_details?.first_name || ""} ${student.personal_details?.last_name || ""}`.trim() : "Unknown",
            class: String(student?.academic?.current_class || student?.class || ""),
            section: student?.academic?.section || student?.section || "",
            months: parsedMonths,
            feeBreakdown: parsedFeeBreakdown,
            totalAmount: parsedTotalAmount,
            lateFee: parsedLateFee,
            discountAmount: parsedDiscount,
            netPayable,
            amountPaid: parsedAmountPaid,
            remainingDue,
            paymentMode,
            transactionId: transactionId || null,
            chequeNo: chequeNo || null,
            bankName: bankName || null,
            transactionProof: req.file ? `/uploads/${req.file.filename}` : null,
            transactionProofOriginalName: req.file ? req.file.originalname : null,
            remarks: remarks || "",
            status: paymentStatus,
            collectedBy: req.user.id,
            schoolId,
            paidAt: new Date(),
            createdAt: new Date()
        };

        const result = await db.collection("accounting_receipts").insertOne(receipt);
        res.status(201).json({ message: "Payment collected successfully", receiptId: result.insertedId, receiptNo, receipt });
    } catch (error) {
        console.error("Payment collect error:", error);
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

// Download transaction proof file
router.get("/payments/receipt/:id/download-proof", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        let receipt;
        try {
            receipt = await db.collection("accounting_receipts").findOne({ _id: new ObjectId(req.params.id) });
        } catch {
            receipt = await db.collection("accounting_receipts").findOne({ receiptNo: req.params.id });
        }
        if (!receipt || !receipt.transactionProof) {
            return res.status(404).json({ message: "Transaction proof not found" });
        }
        const __dirname = path.resolve();
        const filePath = path.join(__dirname, receipt.transactionProof);
        const fileName = receipt.transactionProofOriginalName || path.basename(receipt.transactionProof);
        res.download(filePath, fileName);
    } catch (error) {
        res.status(500).json({ message: "Error downloading proof", error: error.message });
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
// ==========================================
// 7. AD-HOC / ADDITIONAL FEES
// ==========================================

// Create ad-hoc fee (per student or per class)
router.post("/adhoc-fees", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { name, amount, appliedTo, admissionNo, className, section, month, category, frequency } = req.body;
        const schoolId = req.user.schoolId;

        if (!name || !amount) {
            return res.status(400).json({ message: "Fee name and amount are required" });
        }
        if (!appliedTo || !["student", "class"].includes(appliedTo)) {
            return res.status(400).json({ message: "appliedTo must be 'student' or 'class'" });
        }
        if (appliedTo === "student" && !admissionNo) {
            return res.status(400).json({ message: "admissionNo is required for student-level fees" });
        }
        if (appliedTo === "class" && !className) {
            return res.status(400).json({ message: "className is required for class-level fees" });
        }

        const fee = {
            name: name.trim(),
            amount: Number(amount),
            appliedTo,
            admissionNo: appliedTo === "student" ? admissionNo : null,
            className: appliedTo === "class" ? String(className) : null,
            section: section || "",  // optional section filter
            frequency: frequency || "One-time",  // Monthly, One-time, Quarterly
            month: month || "",  // for One-time: specific month (optional)
            category: category || "Other",  // Activity, Event, Fine, Program, Other
            isPaid: false,
            paidAmount: 0,
            addedBy: req.user.id,
            addedByRole: req.user.role,
            schoolId,
            createdAt: new Date()
        };

        const result = await db.collection("accounting_adhoc_fees").insertOne(fee);
        res.status(201).json({ message: "Additional fee added successfully", feeId: result.insertedId, fee });
    } catch (error) {
        console.error("Ad-hoc fee create error:", error);
        res.status(500).json({ message: "Error adding fee", error: error.message });
    }
});

// Get ad-hoc fees for a student (includes class-level fees)
router.get("/adhoc-fees/student/:admissionNo", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { admissionNo } = req.params;

        // Get student's class and section
        const student = await db.collection("student").findOne({ admission_no: admissionNo });
        const studentClass = String(student?.academic?.current_class || student?.class || "");
        const studentSection = student?.academic?.section || student?.section || "";

        // Get fees applied to this student directly + fees applied to their class
        const fees = await db.collection("accounting_adhoc_fees")
            .find({
                $or: [
                    { appliedTo: "student", admissionNo },
                    { appliedTo: "class", className: studentClass }
                ]
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Filter class-level fees by section if section is specified
        const filtered = fees.filter(f => {
            if (f.appliedTo === "class" && f.section && f.section !== "") {
                return f.section === studentSection;
            }
            return true;
        });

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: "Error fetching ad-hoc fees", error: error.message });
    }
});

// Get ad-hoc fees for a class
router.get("/adhoc-fees/class/:className", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { className } = req.params;
        const fees = await db.collection("accounting_adhoc_fees")
            .find({ appliedTo: "class", className })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: "Error fetching class fees", error: error.message });
    }
});

// Delete an unpaid ad-hoc fee
router.delete("/adhoc-fees/:id", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const fee = await db.collection("accounting_adhoc_fees").findOne({ _id: new ObjectId(req.params.id) });
        if (!fee) return res.status(404).json({ message: "Fee not found" });
        if (fee.isPaid) return res.status(400).json({ message: "Cannot delete a paid fee" });

        await db.collection("accounting_adhoc_fees").deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: "Fee deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting fee", error: error.message });
    }
});



// Edit an unpaid ad-hoc fee
router.put("/adhoc-fees/:id", authorizeRoles("schoolAdmin", "accountant", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const feeId = new ObjectId(req.params.id);
        const { name, amount, category, frequency, section } = req.body;

        const fee = await db.collection("accounting_adhoc_fees").findOne({ _id: feeId });
        if (!fee) return res.status(404).json({ message: "Fee not found" });
        if (fee.isPaid && amount !== undefined && Number(amount) !== fee.amount) {
            return res.status(400).json({ message: "Cannot modify amount of a paid fee" });
        }

        const updates = {};
        if (name) updates.name = name;
        if (amount !== undefined) updates.amount = Number(amount);
        if (category) updates.category = category;
        if (frequency) updates.frequency = frequency;
        if (section !== undefined) updates.section = section;

        await db.collection("accounting_adhoc_fees").updateOne(
            { _id: feeId },
            { $set: updates }
        );
        res.json({ message: "Fee updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating fee", error: error.message });
    }
});

export default router;
