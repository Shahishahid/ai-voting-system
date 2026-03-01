console.log("🟢 Voter.js LOADED:", __filename);

const mongoose = require("mongoose");
const { hmacEmail } = require("../utils/hash");

const voterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // Always stored lowercase & trimmed
    email: { type: String, unique: true, required: true },

    // HMAC-SHA256 hashed email
    emailHash: { type: String, required: false, index: true },


    voterId: { type: String, unique: true, required: true },

    department: { type: String, required: true },

    phone: { type: String, default: "" },

    idNumber: { type: String, default: "" },

    isApproved: { type: Boolean, default: false },

    hasVoted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ======================================================
// 🔥 PRE-SAVE: normalize email + ALWAYS regenerate HMAC
// ======================================================
// === inside Voter.js ===


voterSchema.pre("save", async function () {
  console.log("🔥 PRE-SAVE FIRED");

  if (this.email) {
    this.email = this.email.trim().toLowerCase();
    this.emailHash = hmacEmail(this.email);
    console.log("🔐 Normalized Email:", this.email);
    console.log("🔐 HMAC emailHash:", this.emailHash);
  }
});




module.exports = mongoose.model("Voter", voterSchema);
