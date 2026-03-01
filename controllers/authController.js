const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Voter = require("../models/Voter");
const OTP = require("../models/OTP");
const { hmacEmail } = require("../utils/hash");
const { sendEmail } = require("../utils/email");
const { logFraud } = require("../utils/fraudLogger");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";
const OTP_TTL_MINUTES = 10;

// =============================
// HELPER
// =============================
function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

// =============================
// SEND OTP
// =============================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const normalized = email.trim().toLowerCase();
    const emailHash = hmacEmail(normalized);

    const voter = await Voter.findOne({ emailHash });
    if (!voter) return res.status(404).json({ error: "Not registered" });
    if (!voter.isApproved) return res.status(403).json({ error: "Not approved" });

    // 🔥 OTP FLOODING CHECK
    const recentOtps = await OTP.countDocuments({
      emailHash,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOtps >= 3) {
      await logFraud({
        type: "OTP_FLOODING",
        severity: "HIGH",
        riskScore: 80,
        message: "OTP flooding detected",
        ipAddress: ip,
        meta: { recentOtps }
      });
    }

    await OTP.deleteMany({ emailHash });

    const otp = generateOtp();
    await OTP.create({
      emailHash,
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60000)
    });

    await sendEmail(
      normalized,
      "Your OTP for Online Voting System",
      `Your OTP is: ${otp}`
    );

    return res.json({ message: "OTP sent" });

  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =============================
// VERIFY OTP
// =============================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Invalid input" });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const emailHash = hmacEmail(email.trim().toLowerCase());

    const otpDoc = await OTP.findOne({ emailHash }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(400).json({ error: "OTP not found" });

    if (otpDoc.expiresAt < new Date()) {
      await OTP.deleteMany({ emailHash });
      return res.status(400).json({ error: "OTP expired" });
    }

    if (otpDoc.otp !== otp) {
      await logFraud({
        type: "OTP_BRUTE_FORCE",
        severity: "MEDIUM",
        riskScore: 60,
        message: "Invalid OTP attempt",
        ipAddress: ip
      });
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const voter = await Voter.findOne({ emailHash });
    if (!voter) return res.status(404).json({ error: "Voter not found" });

    const token = jwt.sign(
      { id: voter._id, role: "voter" },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    await OTP.deleteMany({ emailHash });

    return res.json({ token });

  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =============================
// GET PROFILE (MUST EXIST)
// =============================
exports.getProfile = async (req, res) => {
  res.json({ ok: true });
};
