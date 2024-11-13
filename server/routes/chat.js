// /routes/chatRoutes.js
import express from 'express';
import { createNewThread, addMessageToThread, getUserThreads, getThreadMessages } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import Thread from '../models/Thread.js';

const router = express.Router();

router.post('/new-thread', authenticate, createNewThread);
router.post('/threads/:threadId/message', authenticate, addMessageToThread);
router.get('/threads', authenticate, getUserThreads);
router.get('/threads/:threadId/messages', authenticate, getThreadMessages);

export default router;
