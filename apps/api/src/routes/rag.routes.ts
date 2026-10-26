import { Router } from 'express';
import { ragController } from '../controllers/rag.controller.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { ragSearchQuerySchema } from '../validators/rag.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Semantic search calls the paid embedding API → signed-in users only
router.get('/search', requireAuth, validateQuery(ragSearchQuerySchema), (req, res, next) =>
  ragController.search(req, res, next)
);
// Public regulation texts (no PII, no paid calls) remain publicly readable
router.get('/regulations', (req, res, next) => ragController.getAll(req, res, next));

export default router;
