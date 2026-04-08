import express from 'express';
import multer from 'multer';
import users from '../models/auth.js';
import auth from '../middleware/auth.js';
import { storage as cloudinaryStorage } from '../config/cloudinary.js';

const router = express.Router();

// Use Cloudinary storage for avatars
const upload = multer({ storage: cloudinaryStorage });

// Upload avatar route
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.userid;
    const avatarUrl = req.file?.path; // Cloudinary URL from multer-storage-cloudinary
    if (!avatarUrl) return res.status(400).json({ message: 'No file uploaded' });
    await users.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.status(200).json({ avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
