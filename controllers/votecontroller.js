// backend/src/controllers/voteController.js

const Voter = require("../models/Voter");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const { encrypt, decrypt } = require("../utils/crypto");
const { logFraud } = require("../utils/fraudLogger");

// =============================
// CAST VOTE
// =============================
exports.castVote = async (req, res) => {
  try {
    const voterId = req.user.id;
    const { candidateId } = req.body;
    const ip = req.ip;

    // =============================
    // FRAUD CHECK: MASS VOTING (IP)
    // =============================
    const recentVotes = await Vote.countDocuments({
      ipAddress: ip,
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) } // last 2 minutes
    });
    console.log("DEBUG MASS VOTING | IP:", ip, "| recentVotes:", recentVotes);


    if (recentVotes >= 1) {
      await logFraud({
        type: "MASS_VOTING_IP",
        severity: "HIGH",
        riskScore: 70,
        message: `Multiple voting attempts detected from same IP (${ip})`,
        voterId: voterId,
        ipAddress: ip,
        meta: {
          recentVoteCount: recentVotes
        }
      });
    }

    // =============================
    // NORMAL VOTE FLOW
    // =============================
    const voter = await Voter.findById(voterId);
    if (!voter) return res.status(404).json({ error: "Voter not found" });

    if (!voter.isApproved) {
      return res.status(403).json({ error: "Admin approval required to vote." });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ error: "You have already voted" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

   const encrypted = encrypt(candidate._id.toString());


    await Vote.create({
      voterId: voterId.toString(),
      encryptedCandidate: encrypted,
      ipAddress: ip // ✅ REQUIRED for fraud detection
    });

    voter.hasVoted = true;
    await voter.save();

    return res.json({ ok: true, message: "Vote cast successfully" });

  } catch (err) {
    console.error("Error in castVote:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =============================
// VOTER VOTE STATUS
// =============================
exports.voteStatus = async (req, res) => {
  try {
    const voterId = req.user?.id;

    if (!voterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const voter = await Voter.findById(voterId);

    if (!voter) {
      return res.status(404).json({ error: "Voter not found" });
    }

    // Simple, reliable response
    return res.json({
      ok: true,
      hasVoted: voter.hasVoted === true
    });

  } catch (err) {
    console.error("Vote Status Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


// =============================
// GET ELECTION RESULTS (ADMIN)
// =============================
exports.getResults = async (req, res) => {
  try {
    const votes = await Vote.find({});
    const candidates = await Candidate.find({});

    const counts = {};
    let validVotes = 0;

    for (const v of votes) {
      try {
        const candidateId = decrypt(v.encryptedCandidate);
        counts[candidateId] = (counts[candidateId] || 0) + 1;
        validVotes++;
      } catch (err) {
        console.error("Skipping invalid encrypted vote:", err);
        continue;
      }
    }

    const totalVotes = validVotes;

    const results = candidates.map(c => {
      const votesFor = counts[c._id.toString()] || 0;

      return {
        candidateId: c._id,
        name: c.name,
        party: c.party || "",
        photo: c.photo || "",
        votes: votesFor,
        percentage: totalVotes
          ? Number(((votesFor / totalVotes) * 100).toFixed(2))
          : 0
      };
    });

    results.sort((a, b) => b.votes - a.votes);
    results.forEach((item, index) => (item.rank = index + 1));

    return res.json({ totalVotes, results });

  } catch (err) {
    console.error("Error in getResults:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
