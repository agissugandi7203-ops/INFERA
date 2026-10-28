import { Router } from 'express';
import { chatCompletion, chatStream } from '../../controllers/v2/ai.v2.controller.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { aiChatSchema } from '../../validators/ai.validator.js';
import { aiChatLimiter } from '../../middleware/rate-limit.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /api/v2/ai/chat
router.post('/chat', requireAuth, aiChatLimiter, validateBody(aiChatSchema), chatCompletion);

// POST /api/v2/ai/chat/stream
router.post('/chat/stream', requireAuth, aiChatLimiter, validateBody(aiChatSchema), chatStream);

export default router;
