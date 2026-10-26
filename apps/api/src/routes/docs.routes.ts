import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.js';

const router = Router();

// Swagger UI needs inline styles + its own static scripts; scope that relaxation to docs only.
router.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://upload.wikimedia.org",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  next();
});

// Endpoint for raw OpenAPI JSON specification
router.get('/json', (_req, res) => {
  res.json(swaggerSpec);
});

// Serve Swagger UI
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'INFERA API Documentation — BPJS Kesehatan',
    customCss: `
      .swagger-ui .topbar { background-color: #007a3d; border-bottom: 2px solid #005a2b; }
      .swagger-ui .topbar-wrapper img { content: url('https://upload.wikimedia.org/wikipedia/commons/b/b4/BPJS_Kesehatan_logo.svg'); height: 38px; }
      .swagger-ui .info .title { color: #007a3d; font-family: system-ui, -apple-system, sans-serif; font-weight: 700; }
      .swagger-ui .btn.authorize { background-color: #007a3d; border-color: #007a3d; color: #fff; }
      .swagger-ui .btn.authorize svg { fill: #fff; }
    `,
    swaggerOptions: {
      persistAuthorization: false,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
    },
  })
);

export default router;
