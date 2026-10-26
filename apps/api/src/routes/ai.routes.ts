import { Router } from 'express';
import { getAiStatus, chatCompletion, chatStream } from '../controllers/ai.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { aiChatSchema } from '../validators/ai.validator.js';
import { aiChatLimiter } from '../middleware/rate-limit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/status', getAiStatus);
// AI calls are billed per token → only signed-in users, throttled per user
router.post('/chat', requireAuth, aiChatLimiter, validateBody(aiChatSchema), chatCompletion);
router.post('/chat/stream', requireAuth, aiChatLimiter, validateBody(aiChatSchema), chatStream);

export default router;
