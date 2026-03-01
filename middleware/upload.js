const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/candidates');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "cand_" + Date.now() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

module.exports = multer({ storage, fileFilter });
