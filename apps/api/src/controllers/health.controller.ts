import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { supabaseService } from '../services/supabase.service.js';
import { openRouterService } from '../services/openrouter.service.js';
import { env } from '../config/env.js';
import type { HealthStatus } from '@healthathon/shared';

const START_TIME = Date.now();

export const getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [dbHealth, aiHealth] = await Promise.all([
      supabaseService.checkHealth(),
      openRouterService.checkHealth(),
    ]);

    const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
    const hasIssues = dbHealth.status === 'unreachable';

    const healthData: HealthStatus = {
      service: 'HealthAthon BPJS Express API',
      status: hasIssues ? 'degraded' : 'ok',
      version: '1.0.0',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: dbHealth,
        aiProvider: aiHealth,
      },
    };

    sendSuccess(res, healthData, 200);
  } catch (error) {
    next(error);
  }
};
