import { env } from './env.js';

const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const safeOrigin = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

/** Exact origins trusted by the API (CORS + OAuth/password-reset redirects). */
export const trustedOrigins: ReadonlySet<string> = new Set(
  [
    safeOrigin(env.CLIENT_URL),
    ...env.extraAllowedOrigins.map(safeOrigin),
    ...(env.isProduction ? [] : DEV_ORIGINS),
  ].filter((o): o is string => Boolean(o))
);

/**
 * Vercel preview deployments are only trusted when scoped to THIS project's slug.
 * The old `*.vercel.app` wildcard allowed ANY attacker-owned Vercel app to call the API
 * and to receive password-reset / OAuth tokens via redirect.
 */
const previewPattern = env.VERCEL_PREVIEW_PROJECT
  ? new RegExp(`^https://${env.VERCEL_PREVIEW_PROJECT}(-[a-z0-9-]+)?\\.vercel\\.app$`)
  : null;

export const isTrustedOrigin = (origin: string | undefined | null): boolean => {
  if (!origin) return false;
  if (trustedOrigins.has(origin)) return true;
  return Boolean(previewPattern && previewPattern.test(origin));
};
