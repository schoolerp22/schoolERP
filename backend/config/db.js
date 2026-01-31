import { MongoClient } from "mongodb";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();

let db;

const connectDB = async () => {
  try {
    if (db) return db;

    dns.setServers(["1.1.1.1", "8.8.8.8"]);

    const srvRecords = await dns.promises.resolveSrv(
      "_mongodb._tcp.cluster0.kvftfqd.mongodb.net"
    );

    const hosts = srvRecords
      .map((rec) => `${rec.name}:${rec.port}`)
      .join(",");

    // IMPORTANT: add authSource=admin
    const uri = process.env.MONGO_URI
      .replace("mongodb+srv://", "mongodb://")
      .replace("cluster0.kvftfqd.mongodb.net", hosts)
      + "&authSource=admin";

    console.log("Connecting to URI:", uri);

    const client = new MongoClient(uri, { tls: true });

    await client.connect();
    console.log("MongoDB Connected Successfully 🚀");

    db = client.db("schoolERP");
    return db;

  } catch (err) {
    console.error("MongoDB Connection Failed ❌", err);
    throw err;
  }
};

export default connectDB;
