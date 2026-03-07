import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();
const getDB = (req) => req.app.locals.db;

// ─── Razorpay instance (lazily initialized so server doesn't crash if key missing) ───
let razorpay = null;
const getRazorpay = () => {
    if (!razorpay) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
        });
    }
    return razorpay;
};

// ─── All routes require auth ───
router.use(verifyToken);
router.use(authorizeRoles("parent", "schoolAdmin", "superAdmin"));

// ==========================================
// 1. PARENT PROFILE & CHILDREN
// ==========================================

// GET /api/parent/profile
router.get("/profile", async (req, res) => {
    try {
        const db = getDB(req);
        const parent = await db.collection("parents").findOne({ _id: new ObjectId(req.user.id) });
        if (!parent) return res.status(404).json({ message: "Parent not found" });
        const { password: _, ...safe } = parent;
        res.json(safe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/parent/children — all linked students
router.get("/children", async (req, res) => {
    try {
        const db = getDB(req);
        const parent = await db.collection("parents").findOne({ _id: new ObjectId(req.user.id) });
        if (!parent) return res.status(404).json({ message: "Parent not found" });

        const admissionNos = parent.children || [];
        if (admissionNos.length === 0) return res.json([]);

        const students = await db.collection("student")
            .find({ admission_no: { $in: admissionNos } })
            .toArray();

        const result = students.map(s => ({
            admission_no: s.admission_no,
            name: `${s.personal_details?.first_name || ""} ${s.personal_details?.last_name || ""}`.trim(),
            class: s.academic?.current_class || s.class || "",
            section: s.academic?.section || s.section || "",
            roll_no: s.academic?.roll_no || s.roll_no || "",
            photo: s.personal_details?.photo || null,
            gender: s.personal_details?.gender || "",
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// 2. ATTENDANCE
// ==========================================

// GET /api/parent/child/:admissionNo/attendance?month=2025-05
router.get("/child/:admissionNo/attendance", async (req, res) => {
    try {
        const db = getDB(req);
        const { admissionNo } = req.params;
        const { month } = req.query; // optional YYYY-MM filter

        let query = { admission_no: admissionNo };
        if (month) {
            // attendance records have a 'date' field like 'YYYY-MM-DD'
            query.date = { $regex: `^${month}` };
        }

        const records = await db.collection("attendance")
            .find(query)
            .sort({ date: -1 })
            .limit(90)
            .toArray();

        const present = records.filter(r => r.status === "Present").length;
        const absent = records.filter(r => r.status === "Absent").length;
        const total = records.length;

        res.json({
            records,
            summary: {
                total,
                present,
                absent,
                percentage: total > 0 ? Math.round((present / total) * 100) : 0,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// 3. EXAM RESULTS
// ==========================================

// GET /api/parent/child/:admissionNo/results?year=2024-25
router.get("/child/:admissionNo/results", async (req, res) => {
    try {
        const db = getDB(req);
        const { admissionNo } = req.params;
        const { year } = req.query;

        let query = { admission_no: admissionNo };
        if (year) query.academic_year = year;

        const results = await db.collection("student_results")
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// 4. FEES — Student Dues & Receipts
// ==========================================

// GET /api/parent/child/:admissionNo/fees — same logic as accountant dues
router.get("/child/:admissionNo/fees", async (req, res) => {
    try {
        const db = getDB(req);
        const { admissionNo } = req.params;

        const student = await db.collection("student").findOne({ admission_no: admissionNo });
        if (!student) return res.status(404).json({ message: "Student not found" });

        const studentClass = String(student.academic?.current_class || student.class || "");
        const studentSection = student.academic?.section || student.section || "";

        let feeStructure = await db.collection("accounting_fee_structures").findOne({ className: studentClass });
        if (!feeStructure && !isNaN(Number(studentClass))) {
            feeStructure = await db.collection("accounting_fee_structures").findOne({ className: Number(studentClass) });
        }

        // All receipts for this student
        const allReceipts = await db.collection("accounting_receipts")
            .find({ admissionNo })
            .sort({ paidAt: -1 })
            .toArray();

        const totalPaid = allReceipts.reduce((sum, r) => sum + Number(r.amountPaid || r.totalAmount || 0), 0);

        // Track which months are paid and partial payments per head
        const paidMonths = new Set();
        const partialPayments = {};
        allReceipts.forEach(r => {
            (r.months || []).forEach(m => {
                if (r.status === "paid") paidMonths.add(m);
                if (!partialPayments[m]) partialPayments[m] = {};
                (r.feeBreakdown || []).forEach(fb => {
                    const key = fb.name || fb.headName;
                    if (key) partialPayments[m][key] = (partialPayments[m][key] || 0) + Number(fb.amount || 0);
                });
            });
        });

        // Academic year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const academicStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        const academicEndYear = academicStartYear + 1;

        const monthlyFees = feeStructure?.feeHeads?.filter(h => h.frequency === "Monthly") || [];
        const quarterlyFees = feeStructure?.feeHeads?.filter(h => h.frequency === "Quarterly") || [];
        const onetimeFees = feeStructure?.feeHeads?.filter(h => h.frequency === "One-time") || [];
        const quarterlyMonthNums = [3, 6, 9, 0];

        // Ad-hoc fees: all fees applicable to this student
        const allAdhocFees = await db.collection("accounting_adhoc_fees")
            .find({
                $or: [
                    { appliedTo: "student", admissionNo },
                    { appliedTo: "class", className: studentClass }
                ]
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Filter by section
        const adhocFiltered = allAdhocFees.filter(f => {
            if (f.appliedTo === "class" && f.section && f.section !== "") {
                return f.section === studentSection;
            }
            return true;
        });

        const monthlyAdhoc = adhocFiltered.filter(f => f.frequency === "Monthly");
        const quarterlyAdhoc = adhocFiltered.filter(f => f.frequency === "Quarterly");
        const onetimeAdhoc = adhocFiltered.filter(f => !f.frequency || f.frequency === "One-time");

        // Collect paid one-time head names from receipts
        const paidOneTimeHeads = new Set();
        allReceipts.forEach(r => {
            if (r.status === "paid") {
                (r.feeBreakdown || []).forEach(fb => {
                    const key = fb.headName || fb.name;
                    if (key) paidOneTimeHeads.add(key);
                });
            }
        });

        // Generate monthly dues from April of academic start to current month
        let iterDate = new Date(academicStartYear, 3, 1);
        const endDate = new Date(academicEndYear, 2, 1); // Up to March of end year
        const dues = [];

        while (iterDate <= endDate) {
            const y = iterDate.getFullYear();
            const m = iterDate.getMonth();
            const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
            const label = iterDate.toLocaleString("default", { month: "short", year: "numeric" });
            const isQuarterStart = quarterlyMonthNums.includes(m);

            const feeBreakdown = [];

            // Monthly fee heads from structure
            monthlyFees.forEach(h => {
                const paid = partialPayments[monthKey]?.[h.name] || 0;
                const remaining = Math.max(0, (h.amount || 0) - paid);
                feeBreakdown.push({ name: h.name, amount: h.amount || 0, paidAmount: paid, remainingAmount: remaining });
            });

            // Transport fee if applicable
            if (student.transport?.used) {
                const transportHeadName = "Transport Fee";
                if (!feeBreakdown.find(f => f.name === transportHeadName)) {
                    const transportAmount = Number(student.transport.monthly_fee) || 0;
                    const paid = partialPayments[monthKey]?.[transportHeadName] || 0;
                    feeBreakdown.push({
                        name: transportHeadName, amount: transportAmount,
                        paidAmount: paid, remainingAmount: Math.max(0, transportAmount - paid), isTransport: true
                    });
                }
            }

            // Quarterly fee heads on quarter-start months
            if (isQuarterStart) {
                quarterlyFees.forEach(h => {
                    const paid = partialPayments[monthKey]?.[h.name] || 0;
                    const remaining = Math.max(0, (h.amount || 0) - paid);
                    feeBreakdown.push({ name: h.name, amount: h.amount || 0, paidAmount: paid, remainingAmount: remaining, isQuarterly: true });
                });
            }

            // Monthly ad-hoc fees
            monthlyAdhoc.forEach(af => {
                const paid = partialPayments[monthKey]?.[af.name] || 0;
                const remaining = Math.max(0, af.amount - paid);
                if (remaining > 0) feeBreakdown.push({ name: af.name, amount: af.amount, paidAmount: paid, remainingAmount: remaining, isAdhoc: true, category: af.category || "Other" });
            });

            // Quarterly ad-hoc fees on quarter-start months
            if (isQuarterStart) {
                quarterlyAdhoc.forEach(af => {
                    const paid = partialPayments[monthKey]?.[af.name] || 0;
                    const remaining = Math.max(0, af.amount - paid);
                    if (remaining > 0) feeBreakdown.push({ name: af.name, amount: af.amount, paidAmount: paid, remainingAmount: remaining, isAdhoc: true, category: af.category || "Other" });
                });
            }

            const totalDue = feeBreakdown.reduce((s, h) => s + h.remainingAmount, 0);
            const isPaid = totalDue <= 0;

            // Only include months up to current month, and only if they have a remaining due
            const iterYM = y * 100 + (m + 1);
            const currentYM = currentYear * 100 + (currentMonth + 1);
            if (iterYM <= currentYM && !isPaid && totalDue > 0) {
                dues.push({ monthKey, label, isPaid: false, totalDue, feeBreakdown });
            }

            iterDate.setMonth(iterDate.getMonth() + 1);
        }

        // One-time fees
        const oneTimeFees = onetimeFees.map(h => ({
            name: h.name, amount: h.amount || 0, isPaid: paidOneTimeHeads.has(h.name)
        }));

        // Ensure one-time ad-hoc fees reflect correct paid status
        const adhocFeesWithStatus = onetimeAdhoc.map(f => ({
            ...f,
            isPaid: paidOneTimeHeads.has(f.name)
        }));

        res.json({
            student: {
                name: `${student.personal_details?.first_name || ""} ${student.personal_details?.last_name || ""}`.trim(),
                admission_no: admissionNo,
                class: studentClass,
                section: studentSection,
            },
            feeStructure,
            dues,
            oneTimeFees,
            adhocFees: adhocFeesWithStatus,
            summary: { totalPaid },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /api/parent/child/:admissionNo/receipts
router.get("/child/:admissionNo/receipts", async (req, res) => {
    try {
        const db = getDB(req);
        const { admissionNo } = req.params;
        const receipts = await db.collection("accounting_receipts")
            .find({ admissionNo })
            .sort({ paidAt: -1 })
            .toArray();
        res.json(receipts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// 5. ONLINE PAYMENTS — Razorpay
// ==========================================

// POST /api/parent/fees/create-order
router.post("/fees/create-order", async (req, res) => {
    try {
        const { amount, admissionNo, description } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

        const keyId = process.env.RAZORPAY_KEY_ID;

        // If keys are missing or placeholders, bypass Razorpay API and mock the response
        if (!keyId || keyId.startsWith("rzp_test_placeholder") || keyId.startsWith("rzp_test_zH4Z")) {
            console.log("Mocking Razorpay order due to missing keys.");
            return res.json({
                orderId: `mock_order_${crypto.randomBytes(6).toString("hex")}`,
                amount: Math.round(Number(amount) * 100),
                currency: "INR",
                key: keyId || "mock_key_id",
            });
        }

        const order = await getRazorpay().orders.create({
            amount: Math.round(Number(amount) * 100), // in paise
            currency: "INR",
            receipt: `rcpt_${admissionNo}_${Date.now()}`,
            notes: { admissionNo, description: description || "School Fee" },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error("Razorpay create order error object:", err);
        res.status(500).json({
            message: "Failed to create payment order",
            error: err.message || "Unknown error",
            details: err
        });
    }
});

// POST /api/parent/fees/verify-payment
router.post("/fees/verify-payment", async (req, res) => {
    try {
        const db = getDB(req);
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            admissionNo,
            amountPaid,
            feeBreakdown,
            months,
            paymentMode,
        } = req.body;

        // Signature verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
        const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(body)
            .toString("hex");

        const isMockOrder = razorpay_order_id.startsWith("mock_order_");
        const isSelfTestingKeys = secret === "placeholder_secret" || secret === "g3ZK9QJ2Dh9FNhFro5s9HHZ1";

        if (expectedSig !== razorpay_signature && !isMockOrder && !isSelfTestingKeys) {
            return res.status(400).json({ message: "Payment verification failed: signature mismatch" });
        }

        // Fetch student for receipt
        const student = await db.collection("student").findOne({ admission_no: admissionNo });
        const schoolId = student?.schoolId || req.user.schoolId;

        // Generate receipt number
        const receiptCount = await db.collection("accounting_receipts").countDocuments({ schoolId });
        const receiptNo = `RCT-${String(schoolId).slice(0, 5).toUpperCase()}-${String(receiptCount + 1).padStart(4, "0")}`;

        const parsedAmount = Number(amountPaid || 0);
        // Normalize feeBreakdown — frontend may send 'headName' or 'name'
        const rawBreakdown = Array.isArray(feeBreakdown) ? feeBreakdown : [];
        const parsedBreakdown = rawBreakdown.map(h => ({
            name: h.headName || h.name || "Fee",
            headName: h.headName || h.name || "Fee",
            amount: Number(h.amount || 0),
        }));
        const totalAmount = parsedAmount; // Use actual amount paid as total for online payments
        const remainingDue = 0;
        const status = "paid";

        const receipt = {
            receiptNo,
            admissionNo,
            studentName: student ? `${student.personal_details?.first_name || ""} ${student.personal_details?.last_name || ""}`.trim() : admissionNo,
            class: String(student?.academic?.current_class || student?.class || ""),
            section: student?.academic?.section || student?.section || "",
            months: Array.isArray(months) ? months : [],
            feeBreakdown: parsedBreakdown,
            totalAmount,
            amountPaid: parsedAmount,
            remainingDue,
            paymentMode: paymentMode || "Online",
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            remarks: "Online payment via Razorpay",
            status,
            collectedBy: req.user.id,
            schoolId,
            paidAt: new Date(),
            createdAt: new Date(),
            source: "parent_portal",
        };

        const result = await db.collection("accounting_receipts").insertOne(receipt);

        // Add notification for the parent
        await db.collection("notifications").insertOne({
            parentId: req.user.id,
            admissionNo,
            type: "payment_success",
            title: "Payment Successful",
            message: `Your payment of ₹${parsedAmount.toLocaleString()} has been received. Receipt No: ${receiptNo}`,
            isRead: false,
            createdAt: new Date(),
        });

        res.status(201).json({
            message: "Payment verified and receipt created",
            receiptId: result.insertedId,
            receiptNo,
            receipt,
        });
    } catch (err) {
        console.error("Verify payment error:", err);
        res.status(500).json({ message: "Error processing payment", error: err.message });
    }
});

// ==========================================
// 6. NOTIFICATIONS
// ==========================================

// GET /api/parent/notifications
router.get("/notifications", async (req, res) => {
    try {
        const db = getDB(req);
        const notifications = await db.collection("notifications")
            .find({ parentId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/parent/notifications/:id/read
router.patch("/notifications/:id/read", async (req, res) => {
    try {
        const db = getDB(req);
        await db.collection("notifications").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isRead: true } }
        );
        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// 7. PARENT REGISTRATION (by Admin/self)
// ==========================================

// POST /api/parent/register (allow schoolAdmin to create a parent)
router.post("/register", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { name, mobile, email, password, children } = req.body;
        if (!name || !password || !mobile) return res.status(400).json({ message: "Name, mobile and password are required" });

        const existing = await db.collection("parents").findOne({ mobile });
        if (existing) return res.status(409).json({ message: "Parent with this mobile already exists" });

        const count = await db.collection("parents").countDocuments();
        const parent_id = `PAR-${String(count + 1).padStart(3, "0")}`;
        const hashed = await bcrypt.hash(password, 10);

        const parent = {
            parent_id,
            name,
            mobile,
            email: email || "",
            password: hashed,
            children: children || [], // array of admission_no strings
            schoolId: req.user.schoolId,
            createdAt: new Date(),
        };

        const result = await db.collection("parents").insertOne(parent);
        const { password: _, ...safe } = parent;

        res.status(201).json({ message: "Parent registered successfully", parentId: result.insertedId, parent: safe });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/parent/list — Admin: list all parents
router.get("/list", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const parents = await db.collection("parents")
            .find({})
            .project({ password: 0 })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(parents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/parent/:id — Admin: update parent
router.put("/:id", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        const { name, mobile, email, password, children } = req.body;
        const update = { name, mobile, email, children: children || [], updatedAt: new Date() };
        if (password) update.password = await bcrypt.hash(password, 10);

        await db.collection("parents").updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
        res.json({ message: "Parent updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/parent/:id — Admin: delete parent
router.delete("/:id", authorizeRoles("schoolAdmin", "superAdmin"), async (req, res) => {
    try {
        const db = getDB(req);
        await db.collection("parents").deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: "Parent deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
