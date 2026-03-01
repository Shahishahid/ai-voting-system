// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");
const { getFraudAlerts } = require("../controllers/adminController");


const { addVoter } = require("../controllers/voterController");

// Controllers
const {
  adminLogin,
  addCandidate,
  getAllCandidates,
  getAdminProfile,
  approveVoter
} = require("../controllers/adminController");

// Multer for candidate photo upload
const upload = require("../middleware/upload");

// Import Voter model to build search route
const Voter = require("../models/Voter"); // required for search


// ------------------------------------------------------
// Helper functions for masking (SECURE)
// ------------------------------------------------------
function maskEmail(email) {
  if (!email) return "";
  const [user, domain] = email.split("@");
  return user[0] + "*****@" + domain;
}

function maskVoterId(voterId) {
  if (!voterId) return "";
  if (voterId.length <= 3) return voterId[0] + "***";
  return voterId.substring(0, 1) + "***" + voterId.substring(voterId.length - 2);
}



// ------------------------------------------------------
// Admin Login  (Not Protected)
// ------------------------------------------------------
router.post("/login", adminLogin);



// ------------------------------------------------------
// Admin Profile (Protected)
// ------------------------------------------------------
router.get("/me", verifyToken, adminOnly, getAdminProfile);



// ------------------------------------------------------
// Add Voter (Protected)
// ------------------------------------------------------
router.post("/add-voter", verifyToken, adminOnly, addVoter);



// ------------------------------------------------------
// 🔥 FINAL SEARCH API — Admin Voter Search + Masked Data
// ------------------------------------------------------
// ------------------------------------------------------
// Admin Voter Search (UNMASKED)
// ------------------------------------------------------
router.get("/voters", verifyToken, adminOnly, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const status = req.query.status || "All";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 200);
    const skip = (page - 1) * limit;

    const filters = {};

    if (status === "Approved") filters.isApproved = true;
    if (status === "Pending") filters.isApproved = false;

    if (q) {
      const regex = new RegExp(q, "i");
      filters.$or = [{ name: regex }, { email: regex }, { voterId: regex }];
    }

    const docs = await Voter.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name email voterId isApproved hasVoted")
      .lean();

    const total = await Voter.countDocuments(filters);

    const finalData = docs.map((v) => ({
      id: v._id.toString(),
      name: v.name,
      email: v.email,       // FULL, UNMASKED
      voterId: v.voterId,   // FULL, UNMASKED
      isApproved: v.isApproved,
      hasVoted: v.hasVoted,
    }));

    res.json({
      ok: true,
      total,
      page,
      limit,
      data: finalData,
    });
  } catch (err) {
    console.error("Voter Search Error:", err);
    res.status(500).json({ ok: false, error: "Server Error" });
  }
});




// ------------------------------------------------------
// Approve voter (Protected)
// ------------------------------------------------------
router.put("/approve-voter/:voterId", verifyToken, adminOnly, approveVoter);



// ------------------------------------------------------
// Candidate Management (Protected)
// ------------------------------------------------------
router.post(
  "/candidates",
  verifyToken,
  adminOnly,
  upload.single("photo"),
  addCandidate
);

router.get("/candidates", verifyToken, adminOnly, getAllCandidates);
router.delete(
  "/candidates/:id",
  verifyToken,
  adminOnly,
  require("../controllers/candidateController").deleteCandidate
);
// Fraud Alerts
router.get(
  "/fraud-alerts",
  verifyToken,
  adminOnly,
  getFraudAlerts
);

module.exports = router;
