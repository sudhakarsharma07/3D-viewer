require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const objectRoutes = require("./routes/objects");
const stateRoutes = require("./routes/states");

const app = express();

// --- Security & core middleware ---
app.use(helmet({ crossOriginResourcePolicy: false })); // allow serving /uploads cross-origin
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Basic rate limiting to slow down brute-force / abuse (tune per env)
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", apiLimiter);

// Serve uploaded 3D model files
// In production this should point at an S3 bucket / CloudFront distribution instead.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/objects", objectRoutes);
app.use("/api/states", stateRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// --- Error handler (catches multer errors etc.) ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

// --- DB connection + server start ---
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
