const Candidate = require("../models/Candidate");
const fs = require("fs");
const path = require("path");

exports.addCandidate = async (req, res) => {
  try {
    const { name, party } = req.body;
    let photo = "";

    if (req.file) {
      photo = "uploads/candidates/" + req.file.filename;   // store full usable path
    }

    const candidate = new Candidate({
      name,
      party: party || "Independent",
      photo
    });

    await candidate.save();
    res.json({ ok: true, candidate });

  } catch (err) {
    console.error("addCandidate error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().lean();

    const formatted = candidates.map(c => ({
      _id: c._id,
      name: c.name,
      party: c.party,
      photo: c.photo || null         // always return photo
    }));

    res.json({ ok: true, candidates: formatted });

  } catch (err) {
    console.error("getAllCandidates error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const cand = await Candidate.findById(id);
    if (!cand) return res.status(404).json({ error: "Candidate not found" });

    if (cand.photo) {
      const imgPath = path.join(__dirname, "../../", cand.photo);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Candidate.deleteOne({ _id: id });
    res.json({ ok: true, message: "Candidate deleted" });

  } catch (err) {
    console.error("deleteCandidate error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
