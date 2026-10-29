import { Router } from 'express';
import { generateTts, transcribeStt } from '../controllers/voice.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { voiceLimiter } from '../middleware/rate-limit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { ttsSchema, sttSchema } from '../validators/voice.validator.js';

const router = Router();

// POST /api/v1/voice/tts
router.post('/tts', optionalAuth, voiceLimiter, validateBody(ttsSchema), generateTts);

// POST /api/v1/voice/stt
router.post('/stt', optionalAuth, voiceLimiter, validateBody(sttSchema), transcribeStt);

export default router;
