import { Router } from 'express';
import { ragController } from '../controllers/rag.controller.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { ragSearchQuerySchema } from '../validators/rag.validator.js';

const router = Router();

router.get('/search', validateQuery(ragSearchQuerySchema), (req, res, next) =>
  ragController.search(req, res, next)
);
router.get('/regulations', (req, res, next) => ragController.getAll(req, res, next));

export default router;

