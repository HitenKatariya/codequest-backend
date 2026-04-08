import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  improveQuestion,
  generateAnswer,
  suggestTags,
} from '../controller/ai.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.userid || req.ip,
  message: { message: 'Too many AI requests. Please try again later.' },
});

// Auth enabled so only logged-in users can spend tokens.
router.post('/improve-question', auth, aiLimiter, improveQuestion);
router.post('/generate-answer', auth, aiLimiter, generateAnswer);
router.post('/suggest-tags', auth, aiLimiter, suggestTags);

export default router;
