import { Router } from 'express';
import { generateTts } from '../controllers/voice.controller.js';

const router = Router();

// POST /api/v1/voice/tts
router.post('/tts', generateTts);

export default router;
