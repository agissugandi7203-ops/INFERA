import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { API_PREFIX } from '@healthathon/shared';
import apiRouter from './routes/api.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root welcome route
  app.get('/', (_req, res) => {
    res.json({
      name: 'HealthAthon BPJS API Service',
      version: '1.0.0',
      status: 'online',
      docs: `${API_PREFIX}/health`,
    });
  });

  // Mount API Router under /api/v1
  app.use(API_PREFIX, apiRouter);

  // 404 and Global Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
