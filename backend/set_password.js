
import connectDB from "./config/db.js";
import bcrypt from "bcryptjs";

async function setPassword() {
    try {
        const db = await connectDB();
        const collection = db.collection("student");

        console.log("Setting password for student CH370...");

        // Hash "123"
        const hashedPassword = await bcrypt.hash("123", 10);

        const result = await collection.updateOne(
            { "creds.id": "CH370" },
            {
                $set: {
                    "creds.password": "123", // plaintext as requested/observed in some logic
                    "password": hashedPassword // hashed for security fallback
                }
            }
        );

        console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        console.log("Password set successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

setPassword();
