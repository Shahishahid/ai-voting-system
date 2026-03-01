// src/models/OTP.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  emailHash: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true // ✅ automatically adds createdAt & updatedAt
});

module.exports = mongoose.model("OTP", otpSchema);
