import type { Request, Response, NextFunction } from 'express';
import { participantRiskService } from '../services/participant-risk.service.js';
import { AppError } from '../utils/app-error.js';
import type {
  ApiResponse,
  PesertaProfile,
  ParticipantRiskEvaluationResult,
  ParticipantRiskMetrics,
  ParticipantAuditCase,
  ParticipantRiskCategory,
} from '@healthathon/shared';

export class ParticipantRiskController {
  /**
   * POST /api/v1/participant-risk/evaluate
   * Evaluate a participant's profile and encounters for risk/fraud moduses
   */
  public async evaluate(
    req: Request,
    res: Response<ApiResponse<ParticipantRiskEvaluationResult>>,
    next: NextFunction
  ) {
    try {
      const profile = req.body as PesertaProfile;

      if (!profile || !profile.noKartu || !Array.isArray(profile.encounters)) {
        throw AppError.badRequest(
          'Payload tidak valid. Pastikan noKartu dan daftar encounters tersedia.'
        );
      }

      const result = participantRiskService.evaluateParticipant(profile);

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          evaluatedEncountersCount: profile.encounters.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/participant-risk/metrics
   * Aggregate metrics & KPIs for participant risk track
   */
  public async getMetrics(
    _req: Request,
    res: Response<ApiResponse<ParticipantRiskMetrics>>,
    next: NextFunction
  ) {
    try {
      const metrics = participantRiskService.getMetrics();

      return res.status(200).json({
        success: true,
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/participant-risk/case-studies
   * 4 Verified Benchmark In-depth Case Studies for pitching
   */
  public async getCaseStudies(
    req: Request,
    res: Response<ApiResponse<ParticipantAuditCase[]>>,
    next: NextFunction
  ) {
    try {
      const { category, riskLevel } = req.query;
      let cases = participantRiskService.getCaseStudies();

      if (category && typeof category === 'string') {
        cases = cases.filter((c) => c.category === category);
      }

      if (riskLevel && typeof riskLevel === 'string') {
        cases = cases.filter((c) => c.riskLevel === riskLevel);
      }

      return res.status(200).json({
        success: true,
        data: cases,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          totalCases: cases.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/participant-risk/case-studies/:id
   * Get single case study by ID or caseCode
   */
  public async getCaseStudyById(
    req: Request,
    res: Response<ApiResponse<ParticipantAuditCase>>,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const cases = participantRiskService.getCaseStudies();
      const found = cases.find(
        (c) => c.id === id || c.caseCode.toLowerCase() === id?.toLowerCase()
      );

      if (!found) {
        throw AppError.notFound(`Studi kasus dengan ID atau kode '${id}' tidak ditemukan`);
      }

      return res.status(200).json({
        success: true,
        data: found,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/participant-risk/anomalies
   * List recent anomaly findings formatted for feed and tabular display
   */
  public async getAnomalies(
    req: Request,
    res: Response<ApiResponse<any[]>>,
    next: NextFunction
  ) {
    try {
      const { category, limit } = req.query;
      const cases = participantRiskService.getCaseStudies();

      // Transform benchmark cases into list of detected anomalies
      const anomalies = cases.map((c) => ({
        caseId: c.id,
        caseCode: c.caseCode,
        category: c.category,
        categoryLabel: c.categoryLabel,
        patientName: c.patientName,
        noKartu: c.noKartu,
        nikMasked: c.nikMasked,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel,
        potentialLoss: c.potentialLoss,
        summary: c.summary,
        legalReference: c.legalReference,
        recommendedSanction: c.recommendedSanction,
        lastEncounterDate: c.encounters[c.encounters.length - 1]?.timestamp,
        encounterCount: c.encounters.length,
      }));

      let filtered = anomalies;
      if (category && typeof category === 'string') {
        filtered = filtered.filter((a) => a.category === (category as ParticipantRiskCategory));
      }

      const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
      const result = filtered.slice(0, parsedLimit);

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          totalCount: result.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const participantRiskController = new ParticipantRiskController();
