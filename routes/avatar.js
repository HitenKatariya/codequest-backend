import express from 'express';
import multer from 'multer';
import path from 'path';
import users from '../models/auth.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Temporary: Use local storage until Cloudinary is fixed
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Upload avatar route
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.userid;
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;
    if (!avatarPath) return res.status(400).json({ message: 'No file uploaded' });
    await users.findByIdAndUpdate(userId, { avatar: avatarPath });
    res.status(200).json({ avatar: avatarPath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
