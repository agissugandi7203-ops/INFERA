import { Router } from 'express';
import { generateTts, transcribeStt } from '../controllers/voice.controller.js';

const router = Router();

// POST /api/v1/voice/tts
router.post('/tts', generateTts);

// POST /api/v1/voice/stt
router.post('/stt', transcribeStt);

export default router;

