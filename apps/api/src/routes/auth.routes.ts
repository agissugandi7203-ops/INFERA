import { Router } from 'express';
import {
  getAuthStatus,
  login,
  register,
  forgotPassword,
  getGoogleAuthUrl,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  googleAuthQuerySchema,
} from '../validators/auth.validator.js';

const router = Router();

router.get('/status', getAuthStatus);
router.post('/login', validateBody(loginSchema), login);
router.post('/register', validateBody(registerSchema), register);
router.post('/reset-password', validateBody(forgotPasswordSchema), forgotPassword);
router.get('/google-url', validateQuery(googleAuthQuerySchema), getGoogleAuthUrl);
router.get('/me', getCurrentUser);

export default router;
