const express = require("express"); 
const router = express.Router();
const { castVote, voteStatus, getResults } = require("../controllers/voteController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");



// Voter actions
router.post("/cast", verifyToken, castVote);
router.get("/status", verifyToken, voteStatus);

// Admin action: Get results
router.get("/results", verifyToken, adminOnly, getResults);



module.exports = router;
