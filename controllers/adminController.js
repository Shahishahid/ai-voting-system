// src/controllers/adminController.js
const Admin = require('../models/Admin');
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



// =============================
// Admin Profile (Token-Based)
// =============================
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    return res.json({
      ok: true,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (err) {
    console.error("Admin Profile Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


// =============================
// Admin Login
// =============================
// =============================
// Admin Login
// =============================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and Password required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    return res.json({
      ok: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (err) {
    console.error("Admin Login Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =============================
// Get All Voters (Admin Only)
// =============================
exports.getAllVoters = async (req, res) => {
  try {
    const voters = await Voter.find().sort({ createdAt: -1 });

    return res.json({
      ok: true,
      voters
    });

  } catch (err) {
    console.error("Get All Voters Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =============================
// Approve a Voter
// =============================
exports.approveVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await Voter.findById(voterId);

    if (!voter) {
      return res.status(404).json({ error: "Voter not found" });
    }

    voter.isApproved = true;
    await voter.save();

    return res.json({
      ok: true,
      message: "Voter approved successfully",
      voter
    });

  } catch (err) {
    console.error("Approve Voter Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =============================
// Add Candidate
// =============================
exports.addCandidate = async (req, res) => {
  try {
    const { name, party } = req.body;

    if (!name || !party) {
      return res.status(400).json({ error: "Name and party are required" });
    }

    const photoPath = req.file ? req.file.path : "";

    const candidate = await Candidate.create({
      name,
      party,
      photo: photoPath
    });

    return res.json({
      ok: true,
      message: "Candidate added successfully",
      candidate
    });

  } catch (err) {
    console.error("Add Candidate Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =============================
// Get All Candidates
// =============================
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });

    return res.json({
      ok: true,
      candidates
    });

  } catch (err) {
    console.error("Get All Candidates Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
// APPROVE VOTER
exports.approveVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await Voter.findByIdAndUpdate(
      voterId,
      { isApproved: true },
      { new: true }
    );

    if (!voter) {
      return res.status(404).json({ error: "Voter not found" });
    }

    return res.json({ ok: true, message: "Voter approved", voter });

  } catch (err) {
    console.error("Approve voter error:", err);
    return res.status(500).json({ error: "Server error" });
  }
  
};
// =============================
// GET FRAUD ALERTS (ADMIN)
// =============================
const FraudLog = require("../models/FraudLog");

exports.getFraudAlerts = async (req, res) => {
  try {
    const alerts = await FraudLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      ok: true,
      count: alerts.length,
      alerts
    });

  } catch (err) {
    console.error("Get Fraud Alerts Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
