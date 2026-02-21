import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherResultsRoutes from './routes/teacher-results.js';
import studentResultsRoutes from './routes/student-results.js';
import adminRoutes from './routes/adminRoutes.js';
dotenv.config();

const app = express();

// Forced restart trigger: Fixed student results route mounting

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
// Serve uploaded files
import path from 'path';
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Connect to MongoDB and attach db to app
const startServer = async () => {
  try {
    const db = await connectDB();
    app.locals.db = db; // Make db available to routes

    // Routes
    app.get("/", (req, res) => {
      res.send("API is running...");
    });

    app.use("/api/teacher", teacherRoutes);
    app.use("/api/teacher/results", teacherResultsRoutes);

    app.use("/api/student", studentRoutes);
    app.use("/api/student", studentResultsRoutes);

    app.use("/api/admin", adminRoutes);


    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: "Something went wrong!" });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();