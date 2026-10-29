import { Router } from 'express';
import { chatCompletion, chatStream, actionApproval } from '../../controllers/v2/ai.v2.controller.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { aiChatSchema } from '../../validators/ai.validator.js';
import { aiChatLimiter } from '../../middleware/rate-limit.middleware.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /api/v2/ai/chat
router.post('/chat', optionalAuth, aiChatLimiter, validateBody(aiChatSchema), chatCompletion);

// POST /api/v2/ai/chat/stream
router.post('/chat/stream', optionalAuth, aiChatLimiter, validateBody(aiChatSchema), chatStream);

// POST /api/v2/ai/action/approval
router.post('/action/approval', optionalAuth, actionApproval);

export default router;
