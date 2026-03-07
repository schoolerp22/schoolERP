import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const num = '7743057950';
    const email = 'prashant130108@gmail.com';

    const cols = ['students', 'teachers', 'schoolAdmin', 'admin', 'admins', 'accountants', 'superAdmins', 'parents'];

    for (const c of cols) {
        const res = await db.collection(c).findOne({
            $or: [
                { teacher_id: num }, { admission_no: num }, { admin_id: num },
                { accountant_id: num }, { super_admin_id: num }, { parent_id: num },
                { mobile: num }, { email: num },
                { email: email }
            ]
        });
        if (res) console.log(`Found in: ${c} | ID: ${res._id} | Role if any: ${res.role}`);
    }

    await client.close();
}

run().catch(console.error);
