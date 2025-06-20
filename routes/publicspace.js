import express from 'express';
import multer from 'multer';
import path from 'path';
import Post from '../models/Post.js';
import users from '../models/auth.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper: count today's posts
async function countTodayPosts(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return await Post.countDocuments({ user: userId, createdAt: { $gte: start, $lte: end } });
}

// Create a post (image/video/text)
router.post('/create', auth, upload.single('media'), async (req, res) => {
  try {
    const userId = req.userid;
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Limit: max 2 posts per day
    const todayCount = await countTodayPosts(userId);
    if (todayCount >= 2) return res.status(403).json({ message: 'Max 2 posts per day allowed' });
    let mediaUrl = null;
    let type = 'text';
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) type = 'image';
      if ([".mp4", ".mov", ".avi", ".webm"].includes(ext)) type = 'video';
    }
    const post = await Post.create({
      user: userId,
      content: req.body.content,
      media: mediaUrl,
      type
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like/unlike a post
router.post('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const userId = req.userid;
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ user: req.userid, text: req.body.text });
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all posts (public space)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().populate('user', 'name avatar').sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public space post with friend-based posting limits
router.post('/post', auth, async (req, res) => {
  const user = await users.findById(req.userid);
  const today = new Date().toDateString();

  if (!user) return res.status(404).send('User not found.');
  if (user.lastPostDate !== today) {
    user.postCountToday = 0;
    user.lastPostDate = today;
  }
  if (!user.friends || user.friends.length === 0) return res.status(403).send('No friends. Cannot post.');
  if (user.friends.length < 2 && user.postCountToday >= 1)
    return res.status(403).send('Limit reached.');
  if (user.friends.length <= 10 && user.postCountToday >= 2)
    return res.status(403).send('Limit reached.');

  user.postCountToday = (user.postCountToday || 0) + 1;
  await user.save();
  await Post.create({ user: user._id, content: req.body.content, type: 'text' });
  res.send('Post created');
});

export default router;
