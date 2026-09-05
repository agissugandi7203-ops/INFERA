import { Router } from 'express';
import { participantRiskController } from '../controllers/participant-risk.controller.js';

const router = Router();

router.post('/evaluate', (req, res, next) => participantRiskController.evaluate(req, res, next));
router.get('/metrics', (req, res, next) => participantRiskController.getMetrics(req, res, next));
router.get('/case-studies', (req, res, next) => participantRiskController.getCaseStudies(req, res, next));
router.get('/case-studies/:id', (req, res, next) => participantRiskController.getCaseStudyById(req, res, next));
router.get('/anomalies', (req, res, next) => participantRiskController.getAnomalies(req, res, next));

export default router;
