// src/models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
