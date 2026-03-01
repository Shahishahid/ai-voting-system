const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true
    },
    encryptedCandidate: {
  iv: String,
  ciphertext: String,
  tag: String
},

    ipAddress: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true // ✅ REQUIRED FOR FRAUD TIME CHECK
  }
);

module.exports = mongoose.model("Vote", voteSchema);
