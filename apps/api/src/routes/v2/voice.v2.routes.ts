import { Router } from 'express';
import { createRealtimeSession } from '../../controllers/v2/voice.v2.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { voiceLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

// POST /api/v2/voice/realtime-session
router.post('/realtime-session', requireAuth, voiceLimiter, createRealtimeSession);

export default router;
