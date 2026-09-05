import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { API_PREFIX } from '@healthathon/shared';
import apiRouter from './routes/api.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rate-limit.middleware.js';

export const createApp = (): Application => {
  const app = express();

  // Rate limiting (General API protection against spam & DOS)
  app.use(generalLimiter);

  // Security headers
  app.use(helmet());

  // CORS configuration (allow Vercel domains, custom domains, and local dev)
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Body parsers (Strict payload size limiting)
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Root welcome route for both '/' and '/api'
  app.get(['/', '/api'], (_req, res) => {
    res.json({
      name: 'INFERA API Service',
      version: '1.0.0',
      status: 'online',
      docs: `${API_PREFIX}/health`,
    });
  });

  // Mount API Router under /api/v1, /v1, and /api for Vercel serverless routing
  app.use(API_PREFIX, apiRouter);
  app.use('/api', apiRouter);
  app.use('/v1', apiRouter);
  app.use(apiRouter);

  // 404 and Global Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
