// backend/src/routes/voterRoutes.js

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const Voter = require("../models/Voter");

// Helper to mask email for dashboard
function maskEmail(email) {
  const [user, domain] = email.split("@");
  return user[0] + "*****@" + domain;
}

// =======================================
// GET VOTER PROFILE (Dashboard Data)
// =======================================
router.get("/profile", verifyToken, async (req, res) => {
  try {
    // req.user.id comes from JWT payload
    const voter = await Voter.findById(req.user.id).lean();

    if (!voter) {
      return res.status(404).json({
        ok: false,
        error: "Voter not found",
      });
    }

    return res.json({
      ok: true,
      name: voter.name,
      email: maskEmail(voter.email),
      voterId: voter.voterId,
      department: voter.department,
      hasVoted: voter.hasVoted,
      isApproved: voter.isApproved,
    });

  } catch (err) {
    console.error("Voter profile error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;
