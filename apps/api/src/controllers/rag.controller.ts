import type { Request, Response, NextFunction } from 'express';
import { ragService } from '../services/rag.service.js';
import { AppError } from '../utils/app-error.js';
import type { ApiResponse, RagSearchResult, RegulationChunk } from '@healthathon/shared';

export class RagController {
  public async search(
    req: Request,
    res: Response<ApiResponse<RagSearchResult[]>>,
    next: NextFunction
  ) {
    try {
      const { query, threshold, limit, category } = req.query;

      if (!query || typeof query !== 'string') {
        throw AppError.badRequest('Query string parameter is required');
      }

      const results = await ragService.search({
        query,
        matchThreshold: threshold ? parseFloat(threshold as string) : 0.35,
        matchCount: limit ? parseInt(limit as string, 10) : 3,
        filterCategory: category as any,
      });

      return res.status(200).json({
        success: true,
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          totalMatches: results.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAll(
    _req: Request,
    res: Response<ApiResponse<RegulationChunk[]>>,
    next: NextFunction
  ) {
    try {
      const regulations = ragService.getAllRegulations();

      return res.status(200).json({
        success: true,
        data: regulations,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          totalChunks: regulations.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const ragController = new RagController();
