// backend/src/controllers/voterController.js

const Voter = require("../models/Voter");
const { hmacEmail } = require("../utils/hash");

// =============================
// ADD VOTER (ADMIN ONLY)
// =============================
exports.addVoter = async (req, res) => {
  try {
    const { name, email, voterId, department, phone, idNumber } = req.body;

    // Validate required fields
    if (!name || !email || !voterId || !department) {
      return res
        .status(400)
        .json({ error: "Name, email, voterId, and department are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = hmacEmail(normalizedEmail);

    // Check existing voter by HMAC email hash
    const existingEmail = await Voter.findOne({ emailHash });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already exists." });
    }

    // Check duplicate voterId
    const existingId = await Voter.findOne({ voterId });
    if (existingId) {
      return res.status(409).json({ error: "Voter ID already exists." });
    }

    // Create voter entry
    const voter = new Voter({
      name,
      email: normalizedEmail,
      emailHash,              // 🔥 IMPORTANT FIELD
      voterId,
      department,
      phone: phone || "",
      idNumber: idNumber || "",
      isApproved: true,
      hasVoted: false,
    });

    await voter.save();

    return res.json({
      success: true,
      message: "Voter added successfully.",
      voter,
    });

  } catch (err) {
    console.error("Add voter error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
