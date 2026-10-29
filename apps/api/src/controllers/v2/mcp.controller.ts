import type { Request, Response } from 'express';
import {
  INFERA_TOOL_DEFINITIONS,
  getTemporalAnchorContext,
  type McpJsonRpcRequest,
  type McpJsonRpcResponse,
  type McpToolDefinition,
  type McpListToolsResult,
  type McpCallToolResult,
} from '@healthathon/shared';

/**
 * Transforms INFERA tool definitions to standard MCP tool format
 */
function getMcpToolsList(): McpToolDefinition[] {
  return INFERA_TOOL_DEFINITIONS.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: {
      type: 'object',
      properties: tool.function.parameters.properties || {},
      required: tool.function.parameters.required || [],
    },
  }));
}

/**
 * Executes forensic investigation tools or generates action proposals
 */
async function executeMcpTool(
  toolName: string,
  args: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const temporal = getTemporalAnchorContext();
  const targetId = String(args.participant_id || args.target_id || args.participant_query || 'P-10294');
  const targetName = String(args.participant_name || 'Budi Santoso');

  switch (toolName) {
    case 'audit_impossible_travel': {
      // Simulate real forensic impossible travel computation
      const distanceKm = 745; // Jakarta - Surabaya
      const durationHours = 1.65;
      const velocityKmH = Math.round(distanceKm / durationHours);
      const isAnomaly = velocityKmH > 100;

      return {
        tool: 'audit_impossible_travel',
        targetId,
        distanceKm,
        durationHours,
        velocityKmH,
        thresholdKmH: 100,
        isAnomaly,
        riskLevel: isAnomaly ? 'CRITICAL' : 'LOW',
        evidence: `Ditemukan 2 klaim di RS Jakarta dan RS Surabaya dengan selisih waktu ${durationHours} jam (kecepatan ${velocityKmH} km/jam).`,
        legalBasis: 'Permenkes No. 16 Tahun 2019 Pasal 6 Ayat 1 (Indikasi peminjaman kartu/ID sharing).',
        timestamp: temporal.iso,
      };
    }

    case 'audit_doctor_shopping': {
      const windowDays = Number(args.window_days || args.timeWindowDays || 7);
      const faskesCount = 4;
      const dsiScore = 0.78; // Above 0.5 threshold
      const isAnomaly = dsiScore >= 0.5;

      return {
        tool: 'audit_doctor_shopping',
        targetId,
        windowDays,
        faskesCount,
        dsiScore,
        threshold: 0.5,
        isAnomaly,
        riskLevel: isAnomaly ? 'HIGH' : 'LOW',
        evidence: `Pasien mengunjungi ${faskesCount} faskes berbeda dalam kurun waktu ${windowDays} hari dengan keluhan gejala yang identik.`,
        legalBasis: 'Permenkes No. 16 Tahun 2019 Pasal 7 (Pelayanan tidak sesuai indikasi medis).',
        timestamp: temporal.iso,
      };
    }

    case 'audit_prescription_overlap': {
      const porRatio = 185; // %
      const overlapDays = 14;
      const isAnomaly = porRatio > 140;

      return {
        tool: 'audit_prescription_overlap',
        targetId,
        medicationCode: args.drug_code || 'PRB-AMLODIPINE-10',
        porRatio,
        thresholdRatio: 140,
        overlapDays,
        isAnomaly,
        riskLevel: isAnomaly ? 'CRITICAL' : 'LOW',
        evidence: `Prescription Overlap Ratio sebesar ${porRatio}% (melebihi ambang batas 140%). Indikasi akumulasi obat kronis PRB untuk diperjualbelikan.`,
        legalBasis: 'UU BPJS No. 24 Tahun 2011 Pasal 17 jo. Permenkes No. 16 Tahun 2019.',
        timestamp: temporal.iso,
      };
    }

    case 'audit_cooling_off_violation': {
      const deviceType = String(args.device_type || 'KACAMATA');
      const requiredYears = deviceType.toUpperCase().includes('ALAT_BANTU_DENGAR') ? 5 : 2;
      const elapsedMonths = 8;
      const isViolation = elapsedMonths < requiredYears * 12;

      return {
        tool: 'audit_cooling_off_violation',
        targetId,
        deviceType,
        requiredYears,
        elapsedMonths,
        isViolation,
        riskLevel: isViolation ? 'HIGH' : 'LOW',
        evidence: `Klaim diajukan pada bulan ke-${elapsedMonths}, sedangkan masa tunggu minimal adalah ${requiredYears} tahun (${requiredYears * 12} bulan).`,
        legalBasis: 'Peraturan Direksi BPJS Kesehatan tentang Tata Cara Klaim Alat Bantu Medis.',
        timestamp: temporal.iso,
      };
    }

    case 'calculate_risk_score': {
      return {
        tool: 'calculate_risk_score',
        targetId,
        overallScore: 88,
        riskLevel: 'CRITICAL',
        signalsDetected: [
          'Impossible Travel Velocity (451 km/h)',
          'Doctor Shopping Index (0.78)',
          'Prescription Overlap Ratio (185%)',
        ],
        financialExposure: 18750000,
        timestamp: temporal.iso,
      };
    }

    case 'search_regulations_rag': {
      const query = String(args.query || 'Permenkes 16/2019');
      return {
        tool: 'search_regulations_rag',
        query,
        matchedRegulations: [
          {
            title: 'Permenkes No. 16 Tahun 2019',
            clause: 'Pasal 6 ayat (1) huruf b',
            text: 'Kecurangan yang dilakukan oleh Peserta meliputi: meminjamkan atau memberikan kartu BPJS Kesehatan miliknya kepada orang lain untuk memperoleh manfaat pelayanan kesehatan.',
          },
          {
            title: 'UU No. 17 Tahun 2023 tentang Kesehatan',
            clause: 'Pasal 426',
            text: 'Setiap Orang yang secara melawan hukum memperoleh atau menyalahgunakan dana jaminan sosial kesehatan dipidana dengan pidana penjara atau denda.',
          },
          {
            title: 'KUHP',
            clause: 'Pasal 263',
            text: 'Pemalsuan surat atau dokumen identitas dapat diancam pidana penjara paling lama 6 tahun.',
          },
        ],
        timestamp: temporal.iso,
      };
    }

    case 'analyze_participant': {
      return {
        tool: 'analyze_participant',
        participantId: targetId,
        fullName: targetName,
        nik: '3201234567890001',
        membershipStatus: 'AKTIF_DALAM_PENGAWASAN',
        riskScore: 88,
        riskLevel: 'CRITICAL',
        recentEncountersCount: 6,
        anomaliesCount: 3,
        timestamp: temporal.iso,
      };
    }

    case 'get_claim_history': {
      return {
        tool: 'get_claim_history',
        participantId: targetId,
        claims: [
          {
            sepNumber: 'SEP-2026-JKT-001',
            serviceDate: '2026-10-29T10:15:00+07:00',
            facilityName: 'RS Hermina Kemayoran (Jakarta)',
            primaryDiagnosis: 'I10 - Essential Hypertension',
            tariffInaCbg: 1850000,
          },
          {
            sepNumber: 'SEP-2026-SBY-002',
            serviceDate: '2026-10-29T11:45:00+07:00',
            facilityName: 'RSUD Dr. Soetomo (Surabaya)',
            primaryDiagnosis: 'I10 - Essential Hypertension',
            tariffInaCbg: 2450000,
          },
        ],
        timestamp: temporal.iso,
      };
    }

    case 'propose_participant_suspension': {
      const ticketId = `BPJS-SUSP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        tool: 'propose_participant_suspension',
        actionType: 'PROPOSAL_CREATED',
        approvalRequired: true,
        ticketId,
        targetId,
        targetName,
        severity: args.severity || 'CRITICAL',
        reason: args.reason || 'Terdeteksi anomali Impossible Travel berkecepatan 450 km/jam.',
        legalBasis: args.legal_basis || 'Permenkes No. 16 Tahun 2019 Pasal 6 Ayat 1.',
        status: 'PENDING_HUMAN_APPROVAL',
        instruction: 'Tampilkan ActionApprovalCard pada antarmuka auditor untuk konfirmasi penangguhan kartu.',
        timestamp: temporal.iso,
      };
    }

    case 'propose_warning_letter': {
      const ticketId = `BPJS-WARN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        tool: 'propose_warning_letter',
        actionType: 'PROPOSAL_CREATED',
        approvalRequired: true,
        ticketId,
        recipientType: args.recipient_type || 'FASKES',
        recipientId: args.recipient_id || targetId,
        recipientName: args.recipient_name || targetName,
        letterType: args.letter_type || 'KLARIFIKASI',
        violationDetails: args.violation_details || 'Indikasi penagihan klaim ganda berulang.',
        legalBasis: args.legal_basis || 'Permenkes No. 16 Tahun 2019 Pasal 8.',
        status: 'PENDING_HUMAN_APPROVAL',
        timestamp: temporal.iso,
      };
    }

    case 'propose_case_review': {
      const ticketId = `BPJS-REV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        tool: 'propose_case_review',
        actionType: 'PROPOSAL_CREATED',
        approvalRequired: true,
        ticketId,
        caseId: args.case_id || 'CASE-001',
        title: args.title || 'Telaah Forensik ID Sharing Antar-Faskes',
        priority: args.priority || 'CRITICAL',
        estimatedLoss: args.estimated_loss || 18750000,
        status: 'PENDING_HUMAN_APPROVAL',
        timestamp: temporal.iso,
      };
    }

    case 'dispatch_supervisor_alert': {
      const ticketId = `BPJS-ALT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        tool: 'dispatch_supervisor_alert',
        actionType: 'ALERT_DISPATCHED',
        ticketId,
        channel: 'MICROSOFT_TEAMS_WEBHOOK',
        recipient: 'Kepala Cabang BPJS Kesehatan',
        summary: `Kasus anomali kritis peserta ${targetName} (${targetId}) telah diteruskan ke tim investigasi lapangan.`,
        timestamp: temporal.iso,
      };
    }

    default: {
      return {
        tool: toolName,
        status: 'SUCCESS',
        arguments: args,
        timestamp: temporal.iso,
      };
    }
  }
}

/**
 * MCP Server POST Handler
 * Serves tools/list and tools/call JSON-RPC 2.0 requests
 */
export const handleMcpRequest = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as McpJsonRpcRequest<Record<string, unknown>>;
  const requestId = body?.id ?? 1;

  if (!body || body.jsonrpc !== '2.0') {
    const errorResponse: McpJsonRpcResponse = {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32600,
        message: 'Invalid Request: jsonrpc must be "2.0"',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  const { method, params } = body;

  try {
    // 1. tools/list: Returns the manifest of available tools
    if (method === 'tools/list') {
      const result: McpListToolsResult = {
        tools: getMcpToolsList(),
      };
      const response: McpJsonRpcResponse<McpListToolsResult> = {
        jsonrpc: '2.0',
        id: requestId,
        result,
      };
      res.status(200).json(response);
      return;
    }

    // 2. tools/call: Executes an approved or automated tool call
    if (method === 'tools/call') {
      const toolName = (params as { name?: string })?.name;
      const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments || {};

      if (!toolName) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32602,
            message: 'Invalid params: "name" is required for tools/call',
          },
        });
        return;
      }

      const executionOutput = await executeMcpTool(toolName, toolArgs);
      const result: McpCallToolResult = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(executionOutput, null, 2),
          },
        ],
      };

      const response: McpJsonRpcResponse<McpCallToolResult> = {
        jsonrpc: '2.0',
        id: requestId,
        result,
      };
      res.status(200).json(response);
      return;
    }

    // Method not found
    res.status(404).json({
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32601,
        message: `Method not found: ${method}. Supported methods: "tools/list", "tools/call"`,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32603,
        message: `Internal error executing MCP tool: ${errorMessage}`,
      },
    });
  }
};
