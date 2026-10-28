import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { isTrustedOrigin } from './config/origins.js';
import { API_PREFIX, API_V2_PREFIX } from '@healthathon/shared';
import apiRouter from './routes/api.routes.js';
import apiV2Router from './routes/v2/api.v2.routes.js';
import docsRouter from './routes/docs.routes.js';
import { swaggerSpec } from './config/swagger.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rate-limit.middleware.js';
import { requestId, noStore, requireJsonBody } from './middleware/security.middleware.js';

export const createApp = (): Application => {
  const app = express();

  app.disable('x-powered-by');
  // Trust exactly one reverse proxy hop (Vercel / Railway) for accurate client IPs & rate limiting
  app.set('trust proxy', 1);

  app.use(requestId);

  // Security headers — strict CSP for a JSON API (Swagger UI gets its own relaxed policy in docs.routes)
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'no-referrer' },
    })
  );

  // CORS — strict allowlist (no more `*.vercel.app` wildcard). Auth uses Bearer headers, not cookies,
  // so credentials are not needed, which also removes cookie-based CSRF exposure.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests without Origin (curl, server-to-server, same-origin navigations) carry no ambient
        // browser credentials; they still have to pass Bearer-token auth on protected routes.
        if (!origin || isTrustedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: false,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
      maxAge: 86400,
    })
  );

  // Rate limiting (after CORS so 429 responses still carry CORS headers the browser can read)
  app.use(generalLimiter);

  // Request logging — log the path only: query strings may contain participant names / card numbers (PII)
  if (env.NODE_ENV !== 'test') {
    morgan.token('safe-url', (req) => (req as express.Request).path ?? '');
    morgan.token('rid', (req) => (req as express.Request).requestId ?? '-');
    app.use(
      morgan(
        env.isProduction
          ? ':remote-addr [:date[iso]] ":method :safe-url HTTP/:http-version" :status :res[content-length] :response-time ms rid=:rid'
          : ':method :safe-url :status :response-time ms rid=:rid'
      )
    );
  }

  // Body parsers — tight default limit; larger only where multimodal payloads are expected.
  app.use(requireJsonBody);
  app.use(`${API_PREFIX}/ai`, express.json({ limit: '12mb' })); // PDF/image attachments (base64)
  app.use(`${API_V2_PREFIX}/ai`, express.json({ limit: '12mb' }));
  app.use(`${API_PREFIX}/voice`, express.json({ limit: '4mb' })); // short audio clips for STT
  app.use(`${API_V2_PREFIX}/voice`, express.json({ limit: '4mb' }));
  app.use(express.json({ limit: '512kb', strict: true }));

  // Swagger documentation — disabled in production unless explicitly enabled
  const docsEnabled = !env.isProduction || env.ENABLE_API_DOCS;
  if (docsEnabled) {
    app.use('/docs', docsRouter);
    app.use('/api-docs', docsRouter);
    app.use(`${API_PREFIX}/docs`, docsRouter);
    app.get('/api-docs.json', (_req, res) => {
      res.json(swaggerSpec);
    });
  }

  // Root welcome route
  app.get('/', (_req, res) => {
    res.json({
      name: 'INFERA API Service',
      status: 'online',
      health: `${API_PREFIX}/health`,
      ...(docsEnabled ? { docs: '/docs' } : {}),
    });
  });

  // Mount API Router strictly under API_PREFIX (/api/v1) and API_V2_PREFIX (/api/v2) — never cache API responses
  app.use(API_PREFIX, noStore, apiRouter);
  app.use(API_V2_PREFIX, noStore, apiV2Router);

  // 404 and Global Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
