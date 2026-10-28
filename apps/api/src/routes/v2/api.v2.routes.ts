import { Router } from 'express';
import voiceV2Routes from './voice.v2.routes.js';
import aiV2Routes from './ai.v2.routes.js';
import healthRoutes from '../health.routes.js';
import authRoutes from '../auth.routes.js';
import ragRoutes from '../rag.routes.js';
import participantRiskRoutes from '../participant-risk.routes.js';

const router = Router();

router.use('/voice', voiceV2Routes);
router.use('/ai', aiV2Routes);

// Shared core services (Clean DRY pattern: reused seamlessly in v2)
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rag', ragRoutes);
router.use('/participant-risk', participantRiskRoutes);

export default router;
