import express from 'express';
import users from '../models/auth.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Add friend
router.post('/add', auth, async (req, res) => {
  try {
    const userId = req.userid;
    const { friendId } = req.body;
    if (userId === friendId) return res.status(400).json({ message: 'Cannot add yourself as friend' });
    const user = await users.findById(userId);
    const friend = await users.findById(friendId);
    if (!user || !friend) return res.status(404).json({ message: 'User not found' });
    if (user.friends.includes(friendId)) return res.status(400).json({ message: 'Already friends' });
    user.friends.push(friendId);
    friend.friends.push(userId);
    await user.save();
    await friend.save();
    res.status(200).json({ message: 'Friend added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove friend
router.post('/remove', auth, async (req, res) => {
  try {
    const userId = req.userid;
    const { friendId } = req.body;
    const user = await users.findById(userId);
    const friend = await users.findById(friendId);
    if (!user || !friend) return res.status(404).json({ message: 'User not found' });
    user.friends = user.friends.filter(f => f.toString() !== friendId);
    friend.friends = friend.friends.filter(f => f.toString() !== userId);
    await user.save();
    await friend.save();
    res.status(200).json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friends list
router.get('/list', auth, async (req, res) => {
  try {
    const user = await users.findById(req.userid).populate('friends', 'name avatar');
    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
