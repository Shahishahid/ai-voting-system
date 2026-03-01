// backend/src/routes/candidateRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "temp_uploads/" });

const {
  addCandidate,
  getAllCandidates,
  deleteCandidate
} = require("../controllers/candidateController");

const { verifyToken } = require("../middleware/authMiddleware");

// Admin adds candidate
router.post("/add", upload.single("image"), addCandidate);

// Voters must be authenticated to view candidates
router.get("/all", verifyToken, getAllCandidates);

// Admin delete candidate
router.delete("/delete/:id", deleteCandidate);

module.exports = router;
