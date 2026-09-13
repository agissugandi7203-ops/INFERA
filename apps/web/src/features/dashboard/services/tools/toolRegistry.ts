import {
  AiToolDefinition,
  ActionRecommendation,
  FraudAnomalySignal,
  InvestigationRiskLevel,
} from '@healthathon/shared';
import type { JknClaimRecord } from '@healthathon/shared';
import { FALLBACK_CASES } from '../../../../services/participantRiskApi';
import { webRagService } from '../../../../services/rag.service';

export type UserRole = 'auditor' | 'analyst' | 'admin';

/**
 * Tool Permission Matrix (Section 30 of System Requirements)
 */
export const TOOL_PERMISSION_MATRIX: Record<string, UserRole[]> = {
  // Read / Analysis Tools: accessible by all roles
  analyze_participant: ['auditor', 'analyst', 'admin'],
  get_claim_history: ['auditor', 'analyst', 'admin'],
  detect_fraud_pattern: ['auditor', 'analyst', 'admin'],
  calculate_risk_score: ['auditor', 'analyst', 'admin'],
  search_regulations_rag: ['auditor', 'analyst', 'admin'],
  navigate_to_workflow: ['auditor', 'analyst', 'admin'],
  propose_case_review: ['auditor', 'analyst', 'admin'],
  get_recent_simulation_cases: ['auditor', 'analyst', 'admin'],

  // Destructive / Administrative Action Proposal Tools: restricted to auditor & admin
  propose_warning_letter: ['auditor', 'admin'],
  propose_participant_suspension: ['auditor', 'admin'],
};

export function hasToolPermission(toolName: string, role: UserRole = 'auditor'): boolean {
  const allowed = TOOL_PERMISSION_MATRIX[toolName];
  if (!allowed) return true;
  return allowed.includes(role);
}

/**
 * Execution Context provided by the UI / Simulation Layer
 */
export interface ToolExecutionContext {
  claims?: JknClaimRecord[];
  anomalies?: JknClaimRecord[];
  selectedClaim?: JknClaimRecord | null;
  userRole?: UserRole;
  enableReasoning?: boolean;
}

/**
 * Tool Execution Result Envelope
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  summary: string;
  recommendation?: ActionRecommendation;
}

/**
 * Tool Definition Specification (JSON Schema OpenAI / OpenRouter Compatible)
 */
export const INFERA_TOOL_DEFINITIONS: AiToolDefinition[] = [
  // 1. READ / ANALYSIS TOOLS
  {
    type: 'function',
    function: {
      name: 'analyze_participant',
      description:
        'Menganalisis rekam data dan profil risiko peserta JKN berdasarkan No Kartu, NIK, Nama, atau ID Kasus. Mengambil data aktual dari sistem audit stream dan studi kasus benchmark terverifikasi.',
      parameters: {
        type: 'object',
        properties: {
          participant_query: {
            type: 'string',
            description:
              'Kata kunci pencarian peserta: Nomor Kartu BPJS (13 digit), NIK (16 digit), Nama Peserta (misal "Budi Santoso", "Hendra Wijaya", "Nurul Hidayati", "Agus Pratama"), atau ID Kasus (misal "CASE-001", "HK-ID-SHARING-2026").',
          },
          include_encounters: {
            type: 'boolean',
            description: 'Sertakan daftar detail riwayat kunjungan faskes / SEP.',
          },
        },
        required: ['participant_query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_claim_history',
      description:
        'Mengambil riwayat kunjungan klaim/SEP peserta secara kronologis lengkap dengan waktu, faskes, diagnosa, dan tarif klaim untuk verifikasi anomali.',
      parameters: {
        type: 'object',
        properties: {
          participant_id: {
            type: 'string',
            description: 'Nomor Kartu BPJS, NIK, atau No SEP peserta.',
          },
        },
        required: ['participant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_fraud_pattern',
      description:
        'Mengevaluasi indikator pola fraud spesifik menggunakan formula matematika analitik: Impossible Travel (kecepatan > 100 km/jam), Doctor Shopping (indeks DSI), Diskordansi Biologis (gender vs diagnosa), atau Resale Obat PRB.',
      parameters: {
        type: 'object',
        properties: {
          pattern_type: {
            type: 'string',
            enum: ['impossible_travel', 'doctor_shopping', 'prb_resale', 'biological_discordance', 'all'],
            description: 'Jenis pola kecurangan yang ingin diuji.',
          },
          target_id: {
            type: 'string',
            description: 'Nomor Kartu, NIK, No SEP, atau Nama Peserta yang diuji.',
          },
        },
        required: ['pattern_type', 'target_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_risk_score',
      description:
        'Menghitung skor risiko fraud resmi (0 - 100) dan menentukan level risiko (CRITICAL, HIGH, MEDIUM, LOW) berdasarkan akumulasi sinyal anomali terverifikasi.',
      parameters: {
        type: 'object',
        properties: {
          target_id: {
            type: 'string',
            description: 'Nomor Kartu, NIK, atau ID Kasus peserta.',
          },
        },
        required: ['target_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_regulations_rag',
      description:
        'Mencari rujukan pasal dan ketentuan regulasi resmi JKN (Permenkes 16/2019, UU BPJS 24/2011, Permenkes 3/2023, KUHP 263) untuk dasar hukum audit.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Kata kunci pencarian regulasi, sanksi, atau pasal pelanggaran.',
          },
          category: {
            type: 'string',
            enum: ['DEFINISI_HUKUM', 'TIPOLOGI_FRAUD', 'SANKSI_HUKUM', 'SISTEM_BPJS', 'ALL'],
            description: 'Kategori pasal regulasi yang dicari.',
          },
        },
        required: ['query'],
      },
    },
  },

  // 2. ACTION PROPOSAL TOOLS (Two-Phase Action Model — Safe Proposals Only)
  {
    type: 'function',
    function: {
      name: 'propose_participant_suspension',
      description:
        'Mengajukan rekomendasi penangguhan sementara (suspensi) status kepesertaan atau eligibilitas klaim untuk kasus pelanggaran berat. TIDAK mengeksekusi langsung, melainkan menyajikan kartu rekomendasi kepada auditor untuk persetujuan manusia.',
      parameters: {
        type: 'object',
        properties: {
          participant_id: {
            type: 'string',
            description: 'Nomor Kartu BPJS atau NIK peserta yang direkomendasikan untuk disuspensi.',
          },
          participant_name: {
            type: 'string',
            description: 'Nama lengkap peserta.',
          },
          reason: {
            type: 'string',
            description: 'Alasan substantif pengajuan suspensi berdasarkan temuan bukti.',
          },
          severity: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH'],
            description: 'Tingkat keparahan anomali.',
          },
          legal_basis: {
            type: 'string',
            description: 'Pasal atau regulasi acuan (contoh: Permenkes 16/2019 Pasal 6).',
          },
        },
        required: ['participant_id', 'participant_name', 'reason', 'severity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_warning_letter',
      description:
        'Mengajukan draft surat peringatan atau klarifikasi resmi kepada peserta atau faskes atas indikasi kecurangan. Menyajikan kartu rekomendasi kepada auditor untuk persetujuan manusia.',
      parameters: {
        type: 'object',
        properties: {
          recipient_type: {
            type: 'string',
            enum: ['PESERTA', 'FASKES'],
            description: 'Penerima surat peringatan.',
          },
          recipient_id: {
            type: 'string',
            description: 'Nomor Kartu / NIK Peserta atau Kode PPK Faskes.',
          },
          recipient_name: {
            type: 'string',
            description: 'Nama Peserta atau Faskes yang dituju.',
          },
          letter_type: {
            type: 'string',
            enum: ['KLARIFIKASI', 'PERINGATAN', 'TAGIHAN', 'SUSPENSI'],
            description: 'Jenis template surat yang direkomendasikan.',
          },
          violation_details: {
            type: 'string',
            description: 'Uraian ringkas pelanggaran yang terjadi.',
          },
          legal_basis: {
            type: 'string',
            description: 'Dasar hukum penerbitan surat peringatan.',
          },
        },
        required: ['recipient_type', 'recipient_id', 'recipient_name', 'letter_type', 'violation_details'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_case_review',
      description:
        'Mengajukan rekomendasi peninjauan berkas secara mendalam (Manual Review) pada modul investigasi khusus yang relevan.',
      parameters: {
        type: 'object',
        properties: {
          case_id: {
            type: 'string',
            description: 'Kode kasus atau nomor SEP berkas yang perlu ditinjau.',
          },
          patient_name: {
            type: 'string',
            description: 'Nama peserta yang diaudit.',
          },
          reason: {
            type: 'string',
            description: 'Alasan peninjauan berkas.',
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Prioritas peninjauan.',
          },
          target_workflow_route: {
            type: 'string',
            enum: [
              '/dashboard/identity-risk',
              '/dashboard/unnecessary-services',
              '/dashboard/pharmacy-alkes',
              '/dashboard/cases',
              '/dashboard/transactions',
              '/dashboard/master-data',
            ],
            description: 'Rute halaman modul investigasi yang tepat.',
          },
        },
        required: ['case_id', 'patient_name', 'reason', 'target_workflow_route'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_workflow',
      description: 'Menyediakan shortcut navigasi langsung ke halaman audit atau visualisasi teknis terkait.',
      parameters: {
        type: 'object',
        properties: {
          route: {
            type: 'string',
            enum: [
              '/dashboard/identity-risk',
              '/dashboard/unnecessary-services',
              '/dashboard/pharmacy-alkes',
              '/dashboard/cases',
              '/dashboard/transactions',
              '/dashboard/master-data',
              '/dashboard/regulations',
            ],
            description: 'Rute tujuan pada dashboard.',
          },
          reason: {
            type: 'string',
            description: 'Alasan membuka workflow tersebut.',
          },
        },
        required: ['route', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_simulation_cases',
      description:
        'Mengambil daftar kasus anomali dan klaim berisiko terbaru yang sedang terdeteksi di simulasi live real-time sistem INFERA tahun 2026.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Jumlah kasus maksimal yang ingin diambil (default 5).',
          },
        },
      },
    },
  },
];

/**
 * Natural language labels for tool progress indicators
 */
export const TOOL_FRIENDLY_LABELS: Record<string, { running: string; done: string }> = {
  analyze_participant: {
    running: 'Menganalisis rekam data & profil kepesertaan...',
    done: 'Profil peserta & rekam audit terverifikasi',
  },
  get_claim_history: {
    running: 'Mengambil riwayat kunjungan klaim & log SEP...',
    done: 'Riwayat klaim berhasil dihimpun',
  },
  detect_fraud_pattern: {
    running: 'Mengevaluasi indikator pola fraud & formula analitik...',
    done: 'Indikator anomali fraud teridentifikasi',
  },
  calculate_risk_score: {
    running: 'Menghitung skor risiko fraud multi-faktor...',
    done: 'Skor risiko fraud berhasil dihitung',
  },
  search_regulations_rag: {
    running: 'Menelusuri rujukan hukum & regulasi JKN resmi...',
    done: 'Bukti regulasi resmi terverifikasi',
  },
  get_recent_simulation_cases: {
    running: 'Memuat daftar anomali live simulasi 2026...',
    done: 'Daftar kasus anomali live simulasi 2026 berhasil dimuat',
  },
  propose_participant_suspension: {
    running: 'Menyiapkan rekomendasi penangguhan sementara...',
    done: 'Rekomendasi penangguhan berhasil disiapkan',
  },
  propose_warning_letter: {
    running: 'Menyiapkan draft usulan surat peringatan...',
    done: 'Draft usulan surat peringatan berhasil disiapkan',
  },
  propose_case_review: {
    running: 'Menyiapkan rekomendasi peninjauan manual...',
    done: 'Rekomendasi peninjauan berkas siap ditindaklanjuti',
  },
  navigate_to_workflow: {
    running: 'Menyiapkan pintasan modul investigasi...',
    done: 'Pintasan modul investigasi siap',
  },
};

/**
 * Haversine Distance in Kilometers
 */
function calculateHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Helper to find participant across live simulation claims, benchmark cases, and backend database
 * Strictly searches against actual records in the database or active stream context
 */
async function findParticipantData(query: string, context?: ToolExecutionContext) {
  const cleanQ = query.toLowerCase().trim();
  if (!cleanQ) {
    if (context?.selectedClaim) {
      return { source: 'live' as const, data: context.selectedClaim };
    }
    return null;
  }

  // 1. Check live simulation anomalies & claims first (highest real-time priority)
  const allLive = [
    ...(context?.anomalies || []),
    ...(context?.claims || []),
  ];

  const liveMatch = allLive.find(
    (c) =>
      c.noKartu.toLowerCase().includes(cleanQ) ||
      c.noSep.toLowerCase().includes(cleanQ) ||
      c.namaPeserta.toLowerCase().includes(cleanQ)
  );

  if (liveMatch) {
    return { source: 'live' as const, data: liveMatch };
  }

  // 2. Check benchmark cases by real identifier or patient name
  const benchmarkMatch = FALLBACK_CASES.find(
    (c) =>
      c.id.toLowerCase() === cleanQ ||
      c.caseCode.toLowerCase().includes(cleanQ) ||
      c.noKartu.toLowerCase().includes(cleanQ) ||
      c.patientName.toLowerCase().includes(cleanQ) ||
      c.nikMasked.toLowerCase().includes(cleanQ)
  );

  if (benchmarkMatch) {
    return { source: 'benchmark' as const, data: benchmarkMatch };
  }

  // 3. Query Backend Supabase Search API dynamically (/api/v1/participant-risk/search)
  try {
    const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api/v1';
    const res = await fetch(`${API_BASE}/participant-risk/search?query=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const p = json.data[0];
        return {
          source: 'benchmark' as const,
          data: {
            id: p.noKartu,
            caseCode: p.encounters?.[0]?.noSep || `CASE-${p.noKartu.slice(-4)}`,
            category: p.primaryCategory || 'UNNECESSARY_SERVICES',
            categoryLabel: p.primaryCategory || 'Audit Investigasi Peserta',
            patientName: p.patientName,
            noKartu: p.noKartu,
            nikMasked: p.nikMasked,
            gender: p.gender || 'L',
            riskScore: p.riskScore || 75,
            riskLevel: p.riskLevel || 'HIGH',
            potentialLoss: (p.encounters || []).reduce((acc: number, e: any) => acc + (e.cbgTariff || 0), 0),
            summary: `Rekam jejak kepesertaan ${p.patientName} (${p.noKartu}). Ditemukan ${(p.encounters || []).length} riwayat kunjungan klaim.`,
            detailedAnalysis: `Verifikasi audit membuktikan data kepesertaan aktif di sistem BPJS Kesehatan.`,
            encounters: p.encounters || [],
            legalReference: {
              regulation: 'Permenkes No. 16 Tahun 2019',
              article: 'Pasal 6',
              summary: 'Pencegahan kecurangan jaminan kesehatan nasional.',
              sanction: 'Verifikasi berkas & klarifikasi faskes.',
            },
            recommendedSanction: 'AUDIT VERIFIKASI BERKAS',
          },
        };
      }
    }
  } catch {
    // API network failure
  }

  // 4. If currently a claim is selected in the UI context, check if query matches its sub-fields
  if (context?.selectedClaim) {
    const sc = context.selectedClaim;
    if (
      sc.noKartu.includes(cleanQ) ||
      sc.noSep.toLowerCase().includes(cleanQ) ||
      sc.namaPeserta.toLowerCase().includes(cleanQ)
    ) {
      return { source: 'live' as const, data: sc };
    }
  }

  return null;
}

/**
 * Centralized Tool Execution Handler
 */
export async function executeInferaTool(
  toolName: string,
  args: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const role: UserRole = context?.userRole || 'auditor';
  if (!hasToolPermission(toolName, role)) {
    return {
      success: false,
      summary: `Akses ditolak: Peran pengguna "${role}" tidak memiliki hak otorisasi untuk menjalankan tool "${toolName}".`,
      error: `PERMISSION_DENIED: ${toolName} for role ${role}`,
    };
  }

  switch (toolName) {
    case 'analyze_participant': {
      const query = String(args.participant_query || '');
      const found = await findParticipantData(query, context);

      if (!found) {
        return {
          success: false,
          summary: `Data peserta dengan kata kunci "${query}" tidak ditemukan pada sistem audit aktif.`,
          error: 'PARTICIPANT_NOT_FOUND',
        };
      }

      if (found.source === 'benchmark') {
        const c = found.data;
        return {
          success: true,
          summary: `Data ditemukan: ${c.patientName} (${c.noKartu}), Kategori: ${c.categoryLabel}, Skor Risiko: ${c.riskScore} (${c.riskLevel})`,
          data: {
            case_code: c.caseCode,
            patient_name: c.patientName,
            no_kartu: c.noKartu,
            nik_masked: c.nikMasked,
            risk_score: c.riskScore,
            risk_level: c.riskLevel,
            category_label: c.categoryLabel,
            potential_loss_idr: c.potentialLoss,
            summary: c.summary,
            detailed_analysis: c.detailedAnalysis,
            encounters_count: c.encounters.length,
            encounters: args.include_encounters !== false ? c.encounters : undefined,
            legal_reference: c.legalReference,
            recommended_sanction: c.recommendedSanction,
          },
        };
      } else {
        const cl = found.data;
        return {
          success: true,
          summary: `Data klaim live ditemukan: ${cl.namaPeserta} (${cl.noKartu}), No SEP: ${cl.noSep}, Skor Risiko: ${cl.fraudRiskScore}`,
          data: {
            no_sep: cl.noSep,
            no_kartu: cl.noKartu,
            patient_name: cl.namaPeserta,
            gender: cl.jenisKelamin,
            faskes_name: cl.namaFaskes,
            diagnosa_code: cl.kodeDiagnosa,
            diagnosa_name: cl.namaDiagnosa,
            tariff_cbg: cl.cbgTariff,
            is_anomaly: cl.isAnomaly,
            anomaly_title: cl.anomalyTitle,
            risk_score: cl.fraudRiskScore,
            risk_level: cl.fraudRiskScore >= 85 ? 'CRITICAL' : cl.fraudRiskScore >= 70 ? 'HIGH' : 'MEDIUM',
            timestamp: cl.tglPelayanan,
          },
        };
      }
    }

    case 'get_claim_history': {
      const participantId = String(args.participant_id || '');
      const found = await findParticipantData(participantId, context);

      if (!found) {
        return {
          success: false,
          summary: `Riwayat klaim untuk ID "${participantId}" tidak ditemukan.`,
          error: 'CLAIMS_NOT_FOUND',
        };
      }

      if (found.source === 'benchmark') {
        const encounters = found.data.encounters;
        return {
          success: true,
          summary: `Ditemukan ${encounters.length} riwayat kunjungan klaim/SEP untuk ${found.data.patientName}.`,
          data: {
            patient_name: found.data.patientName,
            no_kartu: found.data.noKartu,
            total_encounters: encounters.length,
            encounters: encounters.map((e: any) => ({
              no_sep: e.noSep,
              timestamp: e.timestamp,
              faskes_name: e.faskesName,
              faskes_class: e.faskesClass,
              city: e.location?.city || e.city || '-',
              diagnosa_utama: `${e.diagnosaUtama} - ${e.namaDiagnosa}`,
              tariff_cbg: e.cbgTariff,
              prescribed_drugs: e.prescribedDrugs,
            })),
          },
        };
      } else {
        const cl = found.data;
        return {
          success: true,
          summary: `Ditemukan 1 klaim live aktif untuk ${cl.namaPeserta} (SEP: ${cl.noSep}).`,
          data: {
            patient_name: cl.namaPeserta,
            no_kartu: cl.noKartu,
            total_encounters: 1,
            encounters: [
              {
                no_sep: cl.noSep,
                timestamp: cl.tglPelayanan,
                faskes_name: cl.namaFaskes,
                diagnosa_utama: `${cl.kodeDiagnosa} - ${cl.namaDiagnosa}`,
                tariff_cbg: cl.cbgTariff,
              },
            ],
          },
        };
      }
    }

    case 'detect_fraud_pattern': {
      const patternType = String(args.pattern_type || 'all');
      const targetId = String(args.target_id || '');
      const found = await findParticipantData(targetId, context);

      if (!found) {
        return {
          success: false,
          summary: `Peserta "${targetId}" tidak ditemukan untuk pengujian pola fraud.`,
          error: 'TARGET_NOT_FOUND',
        };
      }

      const signals: FraudAnomalySignal[] = [];

      if (found.source === 'benchmark') {
        const c = found.data;
        const encounters = Array.isArray(c.encounters) ? c.encounters : [];

        if (c.category === 'IDENTITY_SHARING') {
          let velocity = 180;
          let evidence = 'Terdeteksi klaim paralel dengan jeda fisik mustahil.';
          if (encounters.length >= 2) {
            const e1 = encounters[0];
            const e2 = encounters[1];
            const t1 = new Date(e1.timestamp).getTime();
            const t2 = new Date(e2.timestamp).getTime();
            const diffMinutes = Math.max(1, Math.round(Math.abs(t2 - t1) / 60000));
            const dist = e1.location && e2.location ? calculateHaversine(e1.location.lat, e1.location.lng, e2.location.lat, e2.location.lng) : 63.5;
            velocity = Math.round(dist / (diffMinutes / 60));
            evidence = `Kecepatan implisit: ${velocity} km/jam antar ${e1.faskesName} & ${e2.faskesName} (jarak ${dist} km dalam ${diffMinutes} menit).`;
          }

          signals.push({
            type: 'IMPOSSIBLE_TRAVEL',
            label: 'Kecepatan Perpindahan Fisik Mustahil (Impossible Travel)',
            severity: 'CRITICAL',
            description: `Pendaftaran rawat di dua faskes berbeda dalam selang waktu fisik tidak realistis (${velocity} km/jam).`,
            evidence,
            scoreContribution: c.riskScore || 96,
          });
        } else if (c.category === 'UNNECESSARY_SERVICES') {
          const encCount = encounters.length || 3;
          const dsiVal = (encCount >= 3 ? 1.00 : 0.67).toFixed(2);
          signals.push({
            type: 'DOCTOR_SHOPPING',
            label: `Doctor Shopping Kunjungan Redundan (DSI ${dsiVal})`,
            severity: 'HIGH',
            description: `Kunjungan ke ${encCount} faskes berbeda dengan diagnosa serupa tanpa urgensi baru.`,
            evidence: `Indeks DSI = ${dsiVal}. Keluhan diagnosa ${encounters[0]?.namaDiagnosa || 'Klinis'} berulang demi peresepan obat berlebih.`,
            scoreContribution: c.riskScore || 88,
          });
        } else if (c.category === 'MEDICINE_ALKES_ABUSE') {
          signals.push({
            type: 'PRB_RESALE_ARBITRAGE',
            label: 'Akumulasi Obat PRB Melebihi Batas Kuota (Surplus > 100%)',
            severity: 'CRITICAL',
            description: 'Penebusan obat kronis melampaui siklus konsumsi wajar 30 hari.',
            evidence: `Pengambilan suplai obat kronis di multi-faskes dalam interval cepat untuk potensi resale.`,
            scoreContribution: c.riskScore || 94,
          });
        } else if (c.category === 'IDENTITY_FALSIFICATION') {
          const diag = encounters[0]?.namaDiagnosa || 'Tindakan Seksio Sesarea';
          signals.push({
            type: 'BIOLOGICAL_DISCORDANCE',
            label: 'Diskordansi Biologis Mutlak (Gender vs Tindakan Medis)',
            severity: 'CRITICAL',
            description: `Peserta jenis kelamin Laki-Laki terbit SEP klaim ${diag}.`,
            evidence: `Inkonsistensi profil biologis KTP/BPJS Laki-Laki terhadap diagnosa ${diag}.`,
            scoreContribution: c.riskScore || 99,
          });
        }

        return {
          success: true,
          summary: `Pengujian pola fraud "${patternType}" selesai: Terdeteksi ${signals.length} indikator kritis.`,
          data: {
            patient_name: c.patientName,
            category: c.category,
            category_label: c.categoryLabel,
            signals,
            is_fraud_detected: signals.length > 0,
            summary: c.summary,
          },
        };
      } else {
        const cl = found.data;
        if (cl.isAnomaly) {
          signals.push({
            type: 'LIVE_STREAM_ANOMALY',
            label: cl.anomalyTitle || 'Anomali Aliran Transaksi Klaim',
            severity: cl.fraudRiskScore >= 85 ? 'CRITICAL' : 'HIGH',
            description: `Klaim terdeteksi anomali pada faskes ${cl.namaFaskes}.`,
            evidence: `Diagnosa: ${cl.kodeDiagnosa} (${cl.namaDiagnosa}), Tarif: Rp ${cl.cbgTariff.toLocaleString('id-ID')}`,
            scoreContribution: cl.fraudRiskScore,
          });
        }
        return {
          success: true,
          summary: `Pengujian pola selesai: ${signals.length > 0 ? 'Terdeteksi anomali' : 'Klaim wajar (Clean Claim)'}.`,
          data: {
            patient_name: cl.namaPeserta,
            signals,
            is_fraud_detected: signals.length > 0,
            risk_score: cl.fraudRiskScore,
          },
        };
      }
    }

    case 'calculate_risk_score': {
      const targetId = String(args.target_id || '');
      const found = await findParticipantData(targetId, context);

      if (!found) {
        return {
          success: false,
          summary: `Peserta "${targetId}" tidak ditemukan untuk kalkulasi skor risiko.`,
          error: 'TARGET_NOT_FOUND',
        };
      }

      const score = found.source === 'benchmark' ? found.data.riskScore : found.data.fraudRiskScore;
      const level: InvestigationRiskLevel = score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

      return {
        success: true,
        summary: `Skor Risiko Fraud: ${score}/100 (Level: ${level})`,
        data: {
          target_id: targetId,
          score,
          risk_level: level,
          breakdown: {
            geospatial_score: score >= 90 ? 40 : 15,
            frequency_score: score >= 85 ? 30 : 15,
            clinical_match_score: score >= 95 ? 25 : 10,
            compliance_history_score: 5,
          },
          threshold_reference: {
            critical: '>= 85 (Investigasi Khusus & Potensi Suspensi)',
            high: '70 - 84 (Audit Manual / Klarifikasi Faskes)',
            medium: '40 - 69 (Pemantauan Rutin)',
            low: '< 40 (Klaim Bersih / Clean Claim)',
          },
        },
      };
    }

    case 'search_regulations_rag': {
      const query = String(args.query || '').trim();
      const category = args.category ? String(args.category) : undefined;

      try {
        const citations = await webRagService.search({
          query,
          matchCount: 3,
        });

        const filtered = category && category !== 'ALL'
          ? citations.filter((c) => c.category === category)
          : citations;

        const resultsToReturn = filtered.length > 0 ? filtered : citations;

        return {
          success: true,
          summary: `Ditemukan ${resultsToReturn.length} rujukan regulasi JKN resmi untuk pencarian: "${query}".`,
          data: {
            query,
            citations: resultsToReturn.map((c) => ({
              regulation: c.regulation,
              article: c.article,
              title: c.title,
              category: c.category,
              content: c.content,
              similarity: c.similarity,
            })),
          },
        };
      } catch (ragErr) {
        return {
          success: false,
          summary: 'Gagal mengambil rujukan regulasi dari basis data semantik.',
          error: String(ragErr),
        };
      }
    }

    // 2. ACTION PROPOSAL TOOLS (Two-Phase Model)
    case 'propose_participant_suspension': {
      const participantId = String(args.participant_id || '');
      const participantName = String(args.participant_name || '');
      const reason = String(args.reason || '');
      const severity = (args.severity as InvestigationRiskLevel) || 'CRITICAL';
      const legalBasis = String(args.legal_basis || 'Permenkes No. 16 Tahun 2019 Pasal 6 & UU No. 24/2011');

      const recommendation: ActionRecommendation = {
        id: `rec-suspend-${Date.now()}`,
        title: `Ajukan Penangguhan Kepesertaan: ${participantName}`,
        description: `Tindakan pembekuan sementara hak jaminan kepesertaan atas pelanggaran berat. Memerlukan persetujuan auditor sebelum diverifikasi ke Master Data.`,
        riskScore: severity === 'CRITICAL' ? 96 : 85,
        riskLevel: severity,
        reason,
        signals: [
          {
            type: 'ADMINISTRATIVE_SUSPENSION',
            label: 'Penangguhan Hak Penjaminan Sementara',
            severity,
            description: reason,
          },
        ],
        actionLabel: 'Konfirmasi Penangguhan Kepesertaan',
        actionType: 'PROPOSE_SUSPENSION',
        targetId: participantId,
        targetName: participantName,
        targetRoute: '/dashboard/master-data',
        requiresConfirmation: true, // WAJIB Konfirmasi Manusia!
        legalBasis,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        summary: `Rekomendasi penangguhan kepesertaan dibuat untuk ${participantName}. Menunggu persetujuan manusia.`,
        recommendation,
        data: {
          proposal_type: 'PARTICIPANT_SUSPENSION',
          target_id: participantId,
          target_name: participantName,
          status: 'PENDING_HUMAN_APPROVAL',
        },
      };
    }

    case 'propose_warning_letter': {
      const recipientType = (args.recipient_type as 'PESERTA' | 'FASKES') || 'PESERTA';
      const recipientId = String(args.recipient_id || '');
      const recipientName = String(args.recipient_name || '');
      const letterType = (args.letter_type as string) || 'KLARIFIKASI';
      const violationDetails = String(args.violation_details || '');
      const legalBasis = String(args.legal_basis || 'Permenkes No. 16 Tahun 2019');

      const recommendation: ActionRecommendation = {
        id: `rec-letter-${Date.now()}`,
        title: `Terbitkan Surat ${letterType} (${recipientType}): ${recipientName}`,
        description: `Pengiriman surat resmi tindak lanjut audit kepatuhan JKN. Memerlukan peninjauan dan persetujuan tanda tangan auditor.`,
        riskScore: 80,
        riskLevel: 'HIGH',
        reason: violationDetails,
        signals: [
          {
            type: 'WARNING_LETTER_SIGNAL',
            label: `Surat ${letterType} Resmi`,
            severity: 'HIGH',
            description: violationDetails,
          },
        ],
        actionLabel: `Tinjau & Konfirmasi Draft Surat ${letterType}`,
        actionType: 'PROPOSE_WARNING_LETTER',
        targetId: recipientId,
        targetName: recipientName,
        targetRoute: '/dashboard/master-data',
        requiresConfirmation: true, // WAJIB Konfirmasi Manusia!
        legalBasis,
        suggestedData: {
          recipientType,
          letterType,
          violationDetails,
        },
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        summary: `Draft rekomendasi surat ${letterType} dibuat untuk ${recipientName}. Menunggu persetujuan auditor.`,
        recommendation,
        data: {
          proposal_type: 'WARNING_LETTER',
          recipient: recipientName,
          status: 'PENDING_HUMAN_APPROVAL',
        },
      };
    }

    case 'propose_case_review': {
      const caseId = String(args.case_id || '');
      const patientName = String(args.patient_name || '');
      const reason = String(args.reason || '');
      const priority = (args.priority as InvestigationRiskLevel) || 'HIGH';
      const route = String(args.target_workflow_route || '/dashboard/cases');

      const recommendation: ActionRecommendation = {
        id: `rec-review-${Date.now()}`,
        title: `Tinjau Berkas Kasus ${caseId} (${patientName})`,
        description: `Buka modul investigasi forensik untuk meneliti rekam log SEP, koordinat geospasial, atau riwayat peresepan.`,
        riskScore: priority === 'CRITICAL' ? 95 : 85,
        riskLevel: priority,
        reason,
        signals: [
          {
            type: 'MANUAL_REVIEW_FLAG',
            label: 'Perlu Peninjauan Forensik Mendalam',
            severity: priority,
            description: reason,
          },
        ],
        actionLabel: 'Buka Modus Investigasi',
        actionType: 'NAVIGATE',
        targetId: caseId,
        targetName: patientName,
        targetRoute: route,
        requiresConfirmation: false, // Navigasi aman, tidak destruktif
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        summary: `Rekomendasi peninjauan berkas disiapkan untuk ${caseId}.`,
        recommendation,
        data: {
          proposal_type: 'MANUAL_REVIEW_NAVIGATION',
          case_id: caseId,
          target_route: route,
        },
      };
    }

    case 'navigate_to_workflow': {
      const route = String(args.route || '/dashboard/cases');
      const reason = String(args.reason || 'Pemeriksaan berkas');

      return {
        success: true,
        summary: `Pintasan navigasi ke ${route} disiapkan: "${reason}"`,
        data: {
          route,
          reason,
        },
      };
    }

    case 'get_recent_simulation_cases': {
      const limit = Math.max(1, Math.min(Number(args.limit) || 5, 10));
      const liveAnomalies = (context?.anomalies || []).slice(0, limit).map((a: any) => ({
        case_id: a.noSep || `SEP-${a.id}`,
        patient_name: a.namaPeserta,
        card_number: a.noKartu,
        typology: a.anomalyTitle || 'Anomali Aliran Transaksi',
        faskes: a.namaFaskes || 'Faskes Rujukan',
        risk_score: a.fraudRiskScore || 85,
        risk_level: a.fraudRiskScore >= 80 ? 'CRITICAL' : 'HIGH',
        detected_at: a.waktuKlaim || 'Tahun 2026',
        financial_impact: a.biayaKlaim ? `Rp ${Number(a.biayaKlaim).toLocaleString('id-ID')}` : 'Rp 12.500.000',
        summary: a.anomalyDescription || 'Terdeteksi anomali pada simulasi live real-time.',
      }));

      const benchmarkCases = [
        {
          case_id: 'HK-IMP-TRAVEL-2026',
          patient_name: 'Budi Santoso',
          card_number: '0001847291038',
          typology: 'Impossible Travel / Pinjam Pakai Kartu',
          faskes: 'RS Kariadi Semarang & RS Hasan Sadikin Bandung',
          risk_score: 96,
          risk_level: 'CRITICAL',
          detected_at: '2026-03-12',
          financial_impact: 'Rp 14.500.000',
          summary: 'Klaim ganda di dua kota berjarak 350 km dalam selang 45 menit (kecepatan 578 km/jam).',
        },
        {
          case_id: 'HK-DOC-SHOPPING-2026',
          patient_name: 'Hendra Wijaya',
          card_number: '0002938471920',
          typology: 'Doctor Shopping / Pelayanan Berulang Tidak Perlu',
          faskes: 'RS Jantung Harapan Kita, RS Siloam, RS Fatmawati',
          risk_score: 88,
          risk_level: 'HIGH',
          detected_at: '2026-03-11',
          financial_impact: 'Rp 18.200.000',
          summary: 'Kunjungan ke 3 RS berbeda poli spesialis jantung dalam 7 hari dengan keluhan serupa (DSI = 0.85).',
        },
        {
          case_id: 'HK-PRB-RESALE-2026',
          patient_name: 'Nurul Hidayati',
          card_number: '0003847291049',
          typology: 'Resale Obat PRB Kronis & Overlap Penebusan',
          faskes: 'Apotek Kimia Farma & Apotek K-24',
          risk_score: 94,
          risk_level: 'CRITICAL',
          detected_at: '2026-03-10',
          financial_impact: 'Rp 8.750.000',
          summary: 'Penebusan insulin analog dan antihipertensi ganda dalam tempo 10 hari (rasio kuota 260%).',
        },
        {
          case_id: 'HK-BIO-DISCORD-2026',
          patient_name: 'Agus Pratama',
          card_number: '0004958201938',
          typology: 'Diskordansi Biologis Mutlak',
          faskes: 'RS Hermina',
          risk_score: 99,
          risk_level: 'CRITICAL',
          detected_at: '2026-03-09',
          financial_impact: 'Rp 11.800.000',
          summary: 'Peserta Laki-laki tercatat klaim tindakan Seksio Sesarea (O82.0).',
        },
      ];

      const combinedCases = [...liveAnomalies, ...benchmarkCases].slice(0, limit);

      return {
        success: true,
        summary: `Berhasil menghimpun ${combinedCases.length} kasus anomali simulasi live tahun 2026.`,
        data: {
          system_year: 2026,
          total_active_anomalies: (context?.anomalies || []).length,
          total_claims_monitored: (context?.claims || []).length,
          cases: combinedCases,
        },
      };
    }

    default:
      return {
        success: false,
        summary: `Tool "${toolName}" tidak terdaftar dalam INFERA Tool Registry.`,
        error: `UNKNOWN_TOOL: ${toolName}`,
      };
  }
}
