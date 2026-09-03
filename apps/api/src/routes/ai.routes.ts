import { Router } from 'express';
import { getAiStatus, chatCompletion } from '../controllers/ai.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { aiChatSchema } from '../validators/ai.validator.js';

const router = Router();

router.get('/status', getAiStatus);
router.post('/chat', validateBody(aiChatSchema), chatCompletion);

export default router;
