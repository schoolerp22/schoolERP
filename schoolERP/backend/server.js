import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherResultsRoutes from './routes/teacher-results.js';
import studentResultsRoutes from './routes/student-results.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO for WebRTC signaling
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
// Serve uploaded files
import path from 'path';
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// ─── Socket.IO Signaling ───
const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // User registers with their userId
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join a chat room (for room-based calls)
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Initiate a call to a specific user
  socket.on("call-user", ({ to, from, fromName, offer, callType, roomId }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", {
        from,
        fromName,
        offer,
        callType, // 'video' | 'audio'
        roomId
      });
    } else {
      // User not online
      socket.emit("call-failed", { reason: "User is offline" });
    }
  });

  // Call accepted — send answer back
  socket.on("call-accepted", ({ to, answer }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-answered", { answer });
    }
  });

  // Call rejected
  socket.on("call-rejected", ({ to, reason }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-rejected", { reason });
    }
  });

  // ICE candidate exchange
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("ice-candidate", { candidate });
    }
  });

  // End call
  socket.on("end-call", ({ to }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-ended");
    }
  });

  // Room-based group call signaling
  socket.on("group-call-start", ({ roomId, from, fromName, callType }) => {
    socket.to(roomId).emit("incoming-call", {
      from,
      fromName,
      callType,
      roomId,
      isGroupCall: true
    });
  });

  socket.on("disconnect", () => {
    // Remove user from online map
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

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
    app.use("/api/chat", chatRoutes);


    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: "Something went wrong!" });
    });

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT} (with Socket.IO)`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();