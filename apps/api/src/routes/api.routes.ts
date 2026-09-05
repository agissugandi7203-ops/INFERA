import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import aiRoutes from './ai.routes.js';
import ragRoutes from './rag.routes.js';
import participantRiskRoutes from './participant-risk.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/rag', ragRoutes);
router.use('/participant-risk', participantRiskRoutes);

export default router;
