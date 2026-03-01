const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, default: "Independent" },
  photo: { type: String, default: "" }   // FINAL FIELD (single source of truth)
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
