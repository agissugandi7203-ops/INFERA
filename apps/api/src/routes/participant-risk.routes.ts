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
  getCaseStudiesQuerySchema,
  searchQuerySchema,
} from '../validators/participant-risk.validator.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { sensitiveDataLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Participant-risk analytics support optional auth for smooth dashboard demo
router.use(optionalAuth);

router.post(
  '/evaluate',
  validateBody(evaluateProfileSchema),
  (req, res, next) => participantRiskController.evaluate(req, res, next)
);
router.get('/metrics', (req, res, next) =>
  participantRiskController.getMetrics(req, res, next)
);
router.get(
  '/search',
  sensitiveDataLimiter,
  validateQuery(searchQuerySchema),
  (req, res, next) => participantRiskController.search(req, res, next)
);
router.get(
  '/case-studies',
  validateQuery(getCaseStudiesQuerySchema),
  (req, res, next) => participantRiskController.getCaseStudies(req, res, next)
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
