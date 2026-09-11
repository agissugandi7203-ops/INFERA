import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { API_PREFIX } from '@healthathon/shared';
import apiRouter from './routes/api.routes.js';
import docsRouter from './routes/docs.routes.js';
import { swaggerSpec } from './config/swagger.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rate-limit.middleware.js';

export const createApp = (): Application => {
  const app = express();

  // Trust reverse proxy for accurate IP identification & rate limiting
  app.set('trust proxy', 1);

  // Rate limiting (General API protection against spam & DOS)
  app.use(generalLimiter);

  // Security headers (Allow Swagger UI inline styles and scripts)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration (strictly whitelisted origins)
  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, internal server calls) or whitelisted origins
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin '${origin}' tidak diizinkan oleh kebijakan keamanan CORS.`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400,
    })
  );

  // Request logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Body parsers (Strict payload size limiting)
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Swagger Documentation Routes
  app.use('/docs', docsRouter);
  app.use('/api-docs', docsRouter);
  app.use(`${API_PREFIX}/docs`, docsRouter);
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });

  // Root welcome route
  app.get('/', (_req, res) => {
    res.json({
      name: 'INFERA API Service',
      version: '1.0.0',
      status: 'online',
      docs: '/docs',
      health: `${API_PREFIX}/health`,
    });
  });

  // Mount API Router strictly under API_PREFIX (/api/v1)
  app.use(API_PREFIX, apiRouter);

  // 404 and Global Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
