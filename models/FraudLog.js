// backend/src/models/FraudLog.js

const mongoose = require("mongoose");

const fraudLogSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
        // Examples:
        // "MASS_VOTING"
        // "OTP_FLOOD"
        // "BRUTE_FORCE"
        // "VOTE_SPIKE"
        // "INSIDER_THREAT"
    },

    severity: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW"
    },

    riskScore: {
        type: Number,
        default: 0 // 0–100
    },

    message: {
        type: String,
        required: true
    },

    voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voter",
        default: null
    },

    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null
    },

    ipAddress: {
        type: String,
        default: ""
    },

    deviceId: {
        type: String,
        default: ""
    },

    meta: {
        type: Object,
        default: {}
        // extra data (counts, timestamps, etc.)
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("FraudLog", fraudLogSchema);
