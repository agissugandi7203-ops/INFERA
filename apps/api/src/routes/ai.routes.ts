import { Router } from 'express';
import { getAiStatus, chatCompletion, chatStream } from '../controllers/ai.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { aiChatSchema } from '../validators/ai.validator.js';
import { aiChatLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

router.get('/status', getAiStatus);
router.post('/chat', aiChatLimiter, validateBody(aiChatSchema), chatCompletion);
router.post('/chat/stream', aiChatLimiter, validateBody(aiChatSchema), chatStream);

export default router;
