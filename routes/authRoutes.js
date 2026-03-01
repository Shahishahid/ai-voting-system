const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  getProfile
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", verifyToken, getProfile);

module.exports = router;
