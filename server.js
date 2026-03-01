// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Debug
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ======================================================
// FIX: require all routers first (avoid using undefined)
// ======================================================
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const candidateRoutes = require("./src/routes/candidateRoutes");
const voteRoutes = require("./src/routes/voteRoutes");
const voterRoutes = require("./src/routes/voterRoutes"); // <-- required before using below

// ======================================================
// FIX: CONTENT SECURITY POLICY (allow JS execution)
// Note: 'unsafe-inline' is permissive; tighten before production.
// ======================================================
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  );
  next();
});

// ======================================================
// API ROUTES (MUST COME BEFORE STATIC ROUTES)
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/voter", voterRoutes); // now works because voterRoutes is required above

// ===========================================
// STATIC FILES (CSS / JS / IMAGES)
// ===========================================
app.use(express.static(path.join(__dirname, "public")));

// ===========================================
// UPLOADS (Candidate Photos, User Photos)
// ===========================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===========================================
// ROUTE FOR ALL PAGES
// ===========================================
app.get("/pages/:file", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", req.params.file));
});

// ===========================================
// HOME ROUTE
// ===========================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/voter-login.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
