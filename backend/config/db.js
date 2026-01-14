import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db;

const connectDB = async () => {
  try {
    if (db) return db;

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();

    console.log("MongoDB Connected Successfully 🚀");

    db = client.db("schoolERP"); // <-- Must match DB name
    return db;

  } catch (err) {
    console.error("MongoDB Connection Failed ❌", err.message);
    throw err;
  }
};

export default connectDB;
