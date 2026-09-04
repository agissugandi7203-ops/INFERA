import { Router } from 'express';
import { ragController } from '../controllers/rag.controller.js';

const router = Router();

router.get('/search', (req, res, next) => ragController.search(req, res, next));
router.get('/regulations', (req, res, next) => ragController.getAll(req, res, next));

export default router;
