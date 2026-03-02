import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

const seedAccounting = async () => {
    try {
        const client = new MongoClient(uri, { tls: true });
        await client.connect();
        console.log("Connected to MongoDB for Seeding");

        const db = client.db("schoolERP");
        const schoolId = "demo_school_123";

        // 1. Create Accountant User
        const hashedPass = await bcrypt.hash("password123", 10);
        await db.collection("accountants").deleteOne({ accountant_id: "ACC-001" });
        await db.collection("accountants").insertOne({
            accountant_id: "ACC-001",
            name: "Demo Accountant",
            email: "acc@demo.com",
            password: hashedPass,
            schoolId: schoolId,
            createdAt: new Date()
        });
        console.log("✅ Accountant ACC-001 created (password123)");

        // 2. Clear existing accounting data for this school
        await db.collection("accounting_classes").deleteMany({ schoolId });
        await db.collection("accounting_fee_heads").deleteMany({ schoolId });
        await db.collection("accounting_fee_structures").deleteMany({ schoolId });

        // 3. Insert Classes
        const classes = [
            { className: "Pre-Nursery", order: 1, schoolId },
            { className: "Nursery", order: 2, schoolId },
            { className: "KG", order: 3, schoolId },
            { className: "Class 1", order: 4, schoolId },
            { className: "Class 2", order: 5, schoolId }
        ];
        await db.collection("accounting_classes").insertMany(classes);
        console.log("✅ Classes seeded");

        // 4. Insert Fee Heads
        const feeHeads = [
            { name: "Tuition Fee", type: "Tuition", frequency: "Monthly", optional: false, schoolId },
            { name: "Transport Fee", type: "Transport", frequency: "Monthly", optional: true, schoolId },
            { name: "Admission Fee", type: "Admission", frequency: "One-time", optional: false, schoolId },
            { name: "Annual Charges", type: "Annual", frequency: "Yearly", optional: false, schoolId }
        ];
        await db.collection("accounting_fee_heads").insertMany(feeHeads);
        const savedHeads = await db.collection("accounting_fee_heads").find({ schoolId }).toArray();
        console.log("✅ Fee Heads seeded");

        // 5. Create Fee Structure for Class 1
        const class1Structure = {
            className: "Class 1",
            schoolId,
            feeHeads: [
                { headId: savedHeads.find(h => h.name === "Tuition Fee")._id, name: "Tuition Fee", amount: 600, frequency: "Monthly" },
                { headId: savedHeads.find(h => h.name === "Transport Fee")._id, name: "Transport Fee", amount: 400, frequency: "Monthly" },
                { headId: savedHeads.find(h => h.name === "Annual Charges")._id, name: "Annual Charges", amount: 2000, frequency: "Yearly" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await db.collection("accounting_fee_structures").insertOne(class1Structure);

        // Fee Structure for Pre-Nursery
        const preNurseryStructure = {
            className: "Pre-Nursery",
            schoolId,
            feeHeads: [
                { headId: savedHeads.find(h => h.name === "Tuition Fee")._id, name: "Tuition Fee", amount: 500, frequency: "Monthly" },
                { headId: savedHeads.find(h => h.name === "Annual Charges")._id, name: "Annual Charges", amount: 1500, frequency: "Yearly" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await db.collection("accounting_fee_structures").insertOne(preNurseryStructure);
        console.log("✅ Fee Structures seeded");

        // 6. Create some demo students (simulating existing ones)
        // First, clear previous demo students
        await db.collection("students").deleteMany({ schoolId, admission_no: /^DEMO-/ });
        const students = [
            {
                admission_no: "DEMO-001",
                name: "Rahul Kumar",
                class_name: "Class 1",
                section: "A",
                father_name: "Rajesh Kumar",
                contact_no: "9876543210",
                transport_opted: "Yes",
                status: "Active",
                schoolId,
                password: "password123" // required by auth system
            },
            {
                admission_no: "DEMO-002",
                name: "Anita Singh",
                class_name: "Pre-Nursery",
                section: "A",
                father_name: "Vikram Singh",
                contact_no: "9876543211",
                transport_opted: "No",
                status: "Active",
                schoolId,
                password: "password123"
            }
        ];
        await db.collection("students").insertMany(students);
        console.log("✅ Demo Students seeded");

        console.log("🚀 Seeding Complete!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedAccounting();
