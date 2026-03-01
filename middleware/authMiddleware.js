// backend/src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin"); // Adjust if your admin model is different

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

// ---- Extract token safely from headers/query/body ----
function extractToken(req) {
  const auth = req.headers["authorization"] || req.headers["Authorization"];

  if (auth && typeof auth === "string") {
    // Possible formats:
    // "Bearer token"
    // "token"
    const parts = auth.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
    return parts[0]; // Token without Bearer
  }

  if (req.headers["x-access-token"]) return req.headers["x-access-token"];
  if (req.query && req.query.token) return req.query.token;
  if (req.body && req.body.token) return req.body.token;

  return null;
}

// ---- Verify token ----
async function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id || decoded._id,
      role: decoded.role,
      email: decoded.email,
      isAdmin: decoded.isAdmin || decoded.role === "admin",
      raw: decoded,
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// ---- Allow only admin ----
async function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // If token already says role=admin → accept immediately
  if (req.user.isAdmin) {
    return next();
  }

  // Fallback: check DB
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (admin) return next();

    return res.status(403).json({
      success: false,
      message: "Forbidden — Admin access only",
    });
  } catch (err) {
    console.error("Admin check failed:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during admin validation",
    });
  }
}

module.exports = { verifyToken, adminOnly };
