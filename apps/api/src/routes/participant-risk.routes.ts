import { Router } from 'express';
import { participantRiskController } from '../controllers/participant-risk.controller.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import {
  evaluateProfileSchema,
  caseStudyParamSchema,
  getAnomaliesQuerySchema,
} from '../validators/participant-risk.validator.js';

const router = Router();

router.post(
  '/evaluate',
  validateBody(evaluateProfileSchema),
  (req, res, next) => participantRiskController.evaluate(req, res, next)
);
router.get('/metrics', (req, res, next) =>
  participantRiskController.getMetrics(req, res, next)
);
router.get('/search', (req, res, next) =>
  participantRiskController.search(req, res, next)
);
router.get('/case-studies', (req, res, next) =>
  participantRiskController.getCaseStudies(req, res, next)
);
router.get(
  '/case-studies/:id',
  validateParams(caseStudyParamSchema),
  (req, res, next) => participantRiskController.getCaseStudyById(req, res, next)
);
router.get(
  '/anomalies',
  validateQuery(getAnomaliesQuerySchema),
  (req, res, next) => participantRiskController.getAnomalies(req, res, next)
);

export default router;

