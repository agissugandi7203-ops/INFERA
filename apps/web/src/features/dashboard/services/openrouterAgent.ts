import {
  ActionRecommendation,
  ToolProgressStep,
  RagSearchResult,
  InvestigationRiskLevel,
} from '@healthathon/shared';
import {
  INFERA_TOOL_DEFINITIONS,
  TOOL_FRIENDLY_LABELS,
  executeInferaTool,
  ToolExecutionContext,
} from './tools/toolRegistry';
import {
  ChatMessage,
  ChatAttachment,
  formatMessageContent,
  OpenRouterSettings,
  AiShortcut,
  extractShortcuts,
  cleanRawAiResponse,
  getStreamingVisibleText,
  streamOpenRouterChat,
} from './openrouter';
import { FALLBACK_CASES } from '../../../services/participantRiskApi';

export interface AgentStreamCallbacks {
  onMetadata?: (meta: {
    model: string;
    citations?: RagSearchResult[];
  }) => void;
  onToolStep?: (step: ToolProgressStep) => void;
  onRecommendation?: (rec: ActionRecommendation) => void;
  onDelta?: (delta: string, accumulated: string) => void;
  onReasoning?: (delta: string, accumulatedReasoning: string) => void;
  onDone?: (
    fullText: string,
    recommendations: ActionRecommendation[],
    shortcuts: AiShortcut[]
  ) => void;
  onError?: (err: Error) => void;
}

export function buildAgentSystemPrompt(context?: ToolExecutionContext): string {
  const currentYear = 2026;
  const claimsMonitored = context?.claims?.length || 0;
  const liveAnomalies = context?.anomalies || [];
  const totalAnomalies = liveAnomalies.length;

  let liveCasesSummary = '';
  if (liveAnomalies.length > 0) {
    liveCasesSummary = liveAnomalies
      .slice(0, 4)
      .map(
        (a, i) =>
          `  ${i + 1}. [No. SEP: ${a.noSep}] ${a.namaPeserta} (Kartu: ${a.noKartu}) - ${a.namaFaskes}: ${
            a.anomalyTitle || 'Anomali Aliran Klaim'
          } (Skor Risiko: ${a.fraudRiskScore}/100, Potensi Klaim: Rp ${Number(a.cbgTariff || a.tarifRs || 0).toLocaleString(
            'id-ID'
          )})`
      )
      .join('\n');
  }

  return `IDENTITAS SISTEM (MUTLAK & RESMI):
- Nama Sistem/Platform: INFERA (Integrated Fraud Early-Warning & Risk Analytics).
- Anda adalah INFERA AI, asisten intelijen dan investigasi fraud integritas klaim BPJS Kesehatan. Karakter Anda analitis, objektif, tajam, dan taat regulasi JKN.
- PANTANGAN NAMA SISTEM: DILARANG KERAS menyebut atau mengasumsikan platform ini sebagai "platform VEDIKA", "sistem VEDIKA", atau lainnya. Platform Anda adalah INFERA. (VEDIKA hanyalah prosedur administratif verifikasi digital pra-bayar BPJS di tingkat faskes, BUKAN nama platform investigasi ini). Jangan pernah berkata "di platform VEDIKA BPJS Kesehatan", melainkan katakan "di platform INFERA BPJS Kesehatan" atau "pada sistem pemantauan INFERA".

MEMORI KONVERSASI MULTI-TURN:
- Anda WAJIB mengingat dan menyambung konteks dari pesan-pesan sebelumnya dalam riwayat percakapan (nama peserta yang baru dibahas, nomor SEP, temuan kecurangan, pertanyaan sebelumnya).
- Jika pengguna bertanya secara ringkas atau lanjutan (seperti "Ada ga sekarang kasusnya?", "Bagaimana kelanjutan kasus Budi?", "Apa sanksinya?"), jawablah dengan mengaitkan langsung pada kasus atau topik yang sedang berlangsung tanpa amnesia konteks.

LINGKUNGAN & DATA SISTEM OPERASIONAL:
- Tahun Sistem Aktif: TAHUN ${currentYear} (Sistem INFERA beroperasi secara real-time pada Tahun 2026).
- Status Engine Simulasi Live: Terkoneksi (${claimsMonitored} klaim aktif dipantau, ${totalAnomalies} anomali terdeteksi).
- Kasus Anomali & Klaim Live Terkini (Tahun 2026):
${
  liveCasesSummary ||
  `  1. [No. SEP: 1114R0010926V0001] Budi Santoso (Kartu: 0001847291038) - Impossible Travel / Kartu Dipinjamkan (RS Kariadi Semarang & RS Hasan Sadikin Bandung dalam selang 45 menit, kecepatan 578 km/jam, DJS Rp 14.500.000).
  2. [No. SEP: 0112P0010926V0010] Hendra Wijaya (Kartu: 0002938471920) - Doctor Shopping / Pelayanan Berulang Tidak Perlu (Kunjungan 3 RS berbeda poli spesialis jantung dalam 7 hari, DSI = 0.85, DJS Rp 18.200.000).
  3. [No. SEP: 0003R0010926V0003] Nurul Hidayati (Kartu: 0003847291049) - Resale Obat PRB Kronis & Overlap Kuota (Penebusan ganda insulin dan antihipertensi di Apotek Kimia Farma & K-24 dalam tempo 10 hari, rasio kuota 260%, DJS Rp 8.750.000).
  4. [No. SEP: 0004R0010926V0004] Agus Pratama (Kartu: 0004958201938) - Diskordansi Biologis Mutlak (Peserta Laki-laki tercatat klaim tindakan Seksio Sesarea O82.0, Risk Score 99, DJS Rp 11.800.000).`
}

FORMAT & STRUKTUR RESPON AUDIT RESMI (TEGAS, TO-THE-POINT, DILARANG BERTELE-TELE):
- DILARANG menggunakan kata pengantar panjang atau struktur kaku "Section 1", "Section 2", dsb.
- Sajikan analisis audit secara TEGAS, RINGKAS, dan LUGAS dengan alur langsung:
  1. Berikut pelanggaran yang terdeteksi pada klaim ini: [uraikan indikasi fraud/anomali, pihak terlibat, dan kerugian DJS secara lugas]
  2. Berdasarkan [nama regulasi & pasal resmi, misal Permenkes 16/2019, UU 24/2011]: [ketentuan yang dilanggar]
  3. Tindakan yang direkomendasikan adalah: [tindakan berjenjang: penangguhan klaim, verifikasi biometrik, audit faskes]
  4. Maka saya sarankan Anda untuk mengambil tindakan: [langkah konkret auditor, misal mengonfirmasi penangguhan klaim pada kartu aksi di atas]

ATURAN WAJIB & ANTI-HALUSINASI:
1. Grounding Data Tahun 2026:
   - DILARANG KERAS merujuk atau menyebut data kadaluarsa dari internet seperti "Juli 2024", berita lama media, atau rekaan di luar sistem INFERA.
   - Jika pengguna bertanya "Ada kasus terbaru?", "Apa kasus terkini?", "Ada ga sekarang kasusnya?", dsb., sajikan kasus-kasus anomali simulasi live Tahun 2026 di atas secara terperinci (No. SEP, nama peserta, modus fraud, faskes, skor risiko, dan nilai potensi kerugian DJS).
2. Respon Percakapan Santai / Sapaan:
   - Jika pengguna hanya menyapa ("halo", "hai", "selamat pagi", "apa kabar", dsb), jawablah secara ramah, singkat, dan hangat (1-2 kalimat) yang menyatakan kesiapan Anda membantu pengawasan klaim. JANGAN memanggil tool, JANGAN membuat laporan audit unprompted, dan JANGAN mengeluarkan sitasi hukum yang tidak diminta.
3. Grounding Fakta Mutlak:
   - Jika pengguna meminta investigasi atau audit peserta/klaim tertentu, gunakan hasil analisis tool ("analyze_participant", "get_claim_history", "detect_fraud_pattern"). Dilarang mengarang identitas atau angka.
4. Regulasi Presisi:
   - Gunakan rujukan pasal resmi (Permenkes 16/2019, Permenkes 3/2023, UU 24/2011, Perpres 82/2018, KUHP 263).
5. Human-in-the-Loop:
   - Rekomendasikan tindakan berjenjang ("propose_participant_suspension", "propose_warning_letter", "propose_case_review") tanpa eksekusi sepihak.
6. Format Markdown Bersih:
   - Sajikan teks Markdown bersih. JANGAN PERNAH membungkus respon dalam format JSON atau objek {"text": ...}.`;
}

const AGENT_FALLBACK_MODELS = [
  'openai/gpt-oss-120b:nitro',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'openai/gpt-4o-mini',
];

interface RawToolCallAccumulator {
  id: string;
  name: string;
  arguments: string;
}

interface PlannedTool {
  name: string;
  args: Record<string, unknown>;
}

/**
 * Robust conversational greeting detector.
 * Prevents heavy forensic workflows or unprompted case audits when user only says "halo" or chats casually.
 */
export function isSimpleGreetingOrChat(text: string): boolean {
  if (!text) return true;
  const t = text.toLowerCase().trim().replace(/[.,!?;:'"\\/]/g, '');
  const greetings = [
    'halo', 'halo asisten', 'halo fera', 'halo vera', 'halo luna', 'halo ai', 'halo infera',
    'hai', 'hi', 'hello', 'hey', 'hei',
    'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
    'pagi', 'siang', 'sore', 'malam',
    'assalamualaikum', 'assalamu alaikum', 'salam',
    'tes', 'test', 'testing', 'ping',
    'apa kabar', 'gimana kabarnya', 'bagaimana kabarmu',
    'siapa kamu', 'kamu siapa', 'siapa anda', 'anda siapa',
    'bisa apa', 'apa yang bisa kamu lakukan', 'kamu bisa apa',
    'terima kasih', 'makasih', 'terimakasih', 'thanks', 'thank you',
    'ok', 'oke', 'sip', 'siap', 'baik', 'iya', 'ya'
  ];
  if (greetings.includes(t)) return true;
  if (t.length <= 16 && greetings.some((g) => t.startsWith(g))) return true;
  return false;
}

/**
 * Intelligent Intent & Entity Detector:
 * Identifies target participant, fraud typologies, and required tools from the query and active context
 */
function planInvestigationTools(
  query: string,
  context?: ToolExecutionContext
): PlannedTool[] {
  const clean = query.toLowerCase().trim();

  // Rule 0: Never force forensic tools on simple greetings or casual chat
  if (isSimpleGreetingOrChat(query)) {
    return [];
  }

  const tools: PlannedTool[] = [];

  // 1. Dynamically Detect Target Participant / Claim Entities from Query or Explicit Context Reference
  let targetQuery = '';
  let participantName = '';
  let caseCode = '';

  const isExplicitAuditIntent =
    clean.includes('audit') ||
    clean.includes('periksa') ||
    clean.includes('cek') ||
    clean.includes('investigasi') ||
    clean.includes('klaim ini') ||
    clean.includes('kasus ini') ||
    clean.includes('peserta ini') ||
    clean.includes('tinjau');

  // Only bind context.selectedClaim if the user explicitly references an audit or the active claim
  if (context?.selectedClaim && isExplicitAuditIntent) {
    targetQuery = context.selectedClaim.namaPeserta || context.selectedClaim.noKartu;
    participantName = context.selectedClaim.namaPeserta;
    caseCode = context.selectedClaim.noSep;
  } else {
    // Extract actual numeric or alphanumeric identifiers from user query
    const cardMatch = query.match(/\b\d{13}\b/);
    const nikMatch = query.match(/\b\d{16}\b/);
    const sepMatch = query.match(/\b(0001R\w+|SEP-\w+|CASE-\w+|HK-\w+)\b/i);

    if (cardMatch) {
      targetQuery = cardMatch[0];
    } else if (nikMatch) {
      targetQuery = nikMatch[0];
    } else if (sepMatch) {
      targetQuery = sepMatch[0];
      caseCode = sepMatch[0];
    } else {
      // Check if user specifically named a participant present in the actual database
      const allKnown = [
        ...(context?.anomalies || []),
        ...(context?.claims || []),
        ...FALLBACK_CASES,
      ];
      for (const item of allKnown) {
        const pName = ('patientName' in item ? item.patientName : item.namaPeserta) || '';
        if (pName && pName.length > 3 && clean.includes(pName.toLowerCase())) {
          targetQuery = pName;
          participantName = pName;
          caseCode = ('caseCode' in item ? item.caseCode : item.noSep) || '';
          break;
        }
      }
    }
  }

  // 2. Plan Participant & Claim Verification ONLY if an actual target was identified
  if (targetQuery) {
    tools.push({
      name: 'analyze_participant',
      args: {
        participant_query: targetQuery,
        include_encounters: true,
      },
    });

    tools.push({
      name: 'get_claim_history',
      args: {
        participant_id: targetQuery,
      },
    });

    tools.push({
      name: 'calculate_risk_score',
      args: {
        target_id: targetQuery,
      },
    });

    // Detect patterns relevant to this target
    let patternType: 'impossible_travel' | 'doctor_shopping' | 'prb_resale' | 'biological_discordance' | 'all' = 'all';
    if (clean.includes('travel') || clean.includes('jarak') || clean.includes('kecepatan')) {
      patternType = 'impossible_travel';
    } else if (clean.includes('shopping') || clean.includes('dsi') || clean.includes('kunjungan ganda')) {
      patternType = 'doctor_shopping';
    } else if (clean.includes('prb') || clean.includes('obat') || clean.includes('resale') || clean.includes('insulin')) {
      patternType = 'prb_resale';
    } else if (clean.includes('biologi') || clean.includes('gender') || clean.includes('sesar') || clean.includes('caesar')) {
      patternType = 'biological_discordance';
    }

    tools.push({
      name: 'detect_fraud_pattern',
      args: {
        pattern_type: patternType,
        target_id: targetQuery,
      },
    });

    // Propose review for this target
    tools.push({
      name: 'propose_case_review',
      args: {
        case_id: caseCode || `AUDIT-${Date.now().toString().slice(-4)}`,
        patient_name: participantName || targetQuery,
        reason: `Peninjauan rekam audit dan verifikasi anomali klaim subjek ${participantName || targetQuery}.`,
        priority: 'HIGH',
        target_workflow_route: '/dashboard/cases',
      },
    });
  }

  // 3. Plan Regulation Search (RAG) using user's ACTUAL input query
  // Triggered when user asks about regulations, laws, sanctions, coding, or when doing general queries
  if (
    clean.includes('regulasi') ||
    clean.includes('permenkes') ||
    clean.includes('pasal') ||
    clean.includes('hukum') ||
    clean.includes('sanksi') ||
    clean.includes('uu') ||
    clean.includes('aturan') ||
    clean.includes('tarif') ||
    clean.includes('cbg') ||
    clean.includes('alkes') ||
    clean.includes('prb') ||
    clean.includes('fraud') ||
    clean.includes('kecurangan')
  ) {
    tools.push({
      name: 'search_regulations_rag',
      args: {
        query: query.trim(),
        category: 'ALL',
      },
    });
  }

  // 4. Plan Recent Simulation Cases Tool
  // Triggered when user asks for recent cases, updates, or anomalies in the system
  const isRecentCasesQuery =
    clean.includes('kasus terbaru') ||
    clean.includes('kasus terkini') ||
    clean.includes('ada kasus') ||
    clean.includes('ada ga sekarang') ||
    clean.includes('ada ga kasus') ||
    clean.includes('ada sekarang kasus') ||
    (clean.includes('ada') && clean.includes('kasus')) ||
    clean.includes('daftar kasus') ||
    clean.includes('kasus apa saja') ||
    clean.includes('anomali terbaru') ||
    clean.includes('anomali terkini') ||
    clean.includes('update kasus') ||
    clean.includes('temuan terbaru') ||
    clean.includes('apa kasus') ||
    clean.includes('kasus hari ini') ||
    clean.includes('kasus fraud terbaru');

  if (isRecentCasesQuery) {
    tools.push({
      name: 'get_recent_simulation_cases',
      args: {
        limit: 5,
      },
    });
  }

  // Deduplicate planned tools by name
  const seen = new Set<string>();
  const uniqueTools: PlannedTool[] = [];
  for (const t of tools) {
    if (!seen.has(t.name)) {
      seen.add(t.name);
      uniqueTools.push(t);
    }
  }

  return uniqueTools;
}

/**
 * Synthesizes an expert structured audit report if the backend LLM is unreachable or in sandbox mode
 */
function synthesizeStructuredReport(
  query: string,
  executedSteps: Array<{ name: string; summary: string; data?: any }>,
  recommendations: ActionRecommendation[]
): string {
  // Conversational fallback if query was casual or no investigative tools were executed
  if (isSimpleGreetingOrChat(query) || executedSteps.length === 0) {
    return 'Halo! Saya INFERA AI, asisten investigasi pencegahan fraud dan integritas klaim BPJS Kesehatan. Silakan sebutkan nomor SEP, nama peserta, atau regulasi yang ingin Anda teliti hari ini.';
  }

  const participantStep = executedSteps.find((s) => s.name === 'analyze_participant');
  const fraudStep = executedSteps.find((s) => s.name === 'detect_fraud_pattern');
  const riskStep = executedSteps.find((s) => s.name === 'calculate_risk_score');
  const ragStep = executedSteps.find((s) => s.name === 'search_regulations_rag');
  const recentCasesStep = executedSteps.find((s) => s.name === 'get_recent_simulation_cases');

  // If user asked about recent simulation cases
  if (recentCasesStep?.data?.cases) {
    const cases = recentCasesStep.data.cases;
    let out = `Berikut daftar kasus anomali klaim terbaru yang terdeteksi pada sistem simulasi live INFERA (Tahun 2026):\n\n`;
    for (const c of cases) {
      out += `- **[${c.case_id}] ${c.patient_name}** (${c.faskes})\n`;
      out += `  * Modus: ${c.typology}\n`;
      out += `  * Skor Risiko: **${c.risk_score}/100** (\`${c.risk_level}\`) | Dampak Finansial: **${c.financial_impact}**\n`;
      out += `  * Catatan: ${c.summary}\n\n`;
    }
    out += `Berdasarkan **Permenkes No. 16 Tahun 2019**, kasus-kasus di atas memenuhi kriteria prioritas audit forensik.\n\n`;
    out += `Tindakan yang direkomendasikan adalah melakukan penelusuran rekam log SEP dan konfirmasi langsung ke fasilitas kesehatan terkait.\n\n`;
    out += `Maka saya sarankan Anda untuk memilih salah satu kasus di atas untuk memulai investigasi mendalam.`;
    return out;
  }

  const pData = participantStep?.data;
  const fData = fraudStep?.data;
  const rData = riskStep?.data;
  const citations = ragStep?.data?.citations || [];

  const pName = pData?.patient_name || 'Peserta Terperiksa';
  const sep = pData?.no_sep || pData?.case_code || '';
  const riskScore = rData?.score || pData?.risk_score || 88;
  const loss = pData?.potential_loss_idr ? `Rp ${Number(pData.potential_loss_idr).toLocaleString('id-ID')}` : null;

  let out = `Berikut pelanggaran yang terdeteksi pada klaim **${pName}**${sep ? ` (No. SEP: \`${sep}\`)` : ''}:\n`;
  if (fData && fData.signals && fData.signals.length > 0) {
    for (const sig of fData.signals) {
      out += `- **${sig.label}** (\`${sig.severity}\`): ${sig.description}${sig.evidence ? ` [Bukti: \`${sig.evidence}\`]` : ''}\n`;
    }
  } else {
    out += `- Terindikasi anomali pola ${pData?.category_label || 'klaim berulang'} dengan skor risiko **${riskScore}/100**${loss ? ` dan potensi kerugian DJS sebesar **${loss}**` : ''}.\n`;
  }
  out += `\n`;

  out += `Berdasarkan regulasi resmi JKN:\n`;
  if (citations.length > 0) {
    for (const cit of citations.slice(0, 2)) {
      out += `- **${cit.regulation}${cit.article ? ` ${cit.article}` : ''}**: ${cit.title} — *${cit.content.slice(0, 160).trim()}...*\n`;
    }
  } else {
    out += `- **Permenkes No. 16 Tahun 2019**: Mengatur pencegahan dan penindakan kecurangan (fraud) serta kewajiban pengembalian kerugian dana jaminan sosial.\n`;
  }
  out += `\n`;

  out += `Tindakan yang direkomendasikan adalah:\n`;
  if (recommendations.length > 0) {
    for (const rec of recommendations) {
      out += `- **${rec.title}**: ${rec.description || rec.reason}\n`;
    }
  } else {
    out += `- Penangguhan pembayaran klaim sementara dan penerbitan surat klarifikasi kepada faskes terkait.\n`;
  }
  out += `\n`;

  out += `Maka saya sarankan Anda untuk mengambil tindakan:\n`;
  if (recommendations.some((r) => r.requiresConfirmation)) {
    out += `Mengonfirmasi rekomendasi tindakan resmi pada kartu aksi di atas guna membekukan eligibilitas klaim dan memulai audit lapangan sesuai prosedur.`;
  } else {
    out += `Membuka modul investigasi forensik untuk memeriksa log geospasial dan rekam jejak rujukan secara terperinci.`;
  }

  return out;
}

/**
 * Executes a full multi-turn agent tool loop with streaming support.
 * Resiliently handles direct OpenRouter client or backend proxy modes.
 */
export async function runAgentInvestigationStream(
  userQuery: string,
  history: ChatMessage[],
  settings: OpenRouterSettings,
  context?: ToolExecutionContext,
  callbacks?: AgentStreamCallbacks,
  signal?: AbortSignal,
  attachments?: ChatAttachment[]
): Promise<{
  reply: string;
  recommendations: ActionRecommendation[];
  shortcuts: AiShortcut[];
  toolSteps: ToolProgressStep[];
}> {
  const apiKey = settings.apiKey.trim();
  const targetModel = settings.model || 'openai/gpt-oss-120b:nitro';

  const collectedRecommendations: ActionRecommendation[] = [];
  const completedSteps: ToolProgressStep[] = [];
  const executedToolSummaries: Array<{ name: string; summary: string; data?: any }> = [];
  let fullAccumulatedText = '';

  // 0. Fast-path for simple conversational greetings or non-investigation chat:
  // "Let the model decide" — do not plan or execute forensic tools, do not inject fake dossiers, just stream natural polite reply!
  if (isSimpleGreetingOrChat(userQuery)) {
    try {
      const streamResult = await streamOpenRouterChat(
        userQuery,
        history,
        settings,
        'chat',
        {
          onMetadata: callbacks?.onMetadata,
          onReasoning: callbacks?.onReasoning,
          onDelta: (delta, acc) => {
            const visible = getStreamingVisibleText(acc);
            fullAccumulatedText = visible;
            callbacks?.onDelta?.(delta, visible);
          },
        },
        signal,
        undefined,
        attachments
      );
      const cleanReply = cleanRawAiResponse(streamResult);
      const shortcuts = extractShortcuts(cleanReply);
      callbacks?.onDone?.(cleanReply, [], shortcuts);
      return {
        reply: cleanReply,
        recommendations: [],
        shortcuts,
        toolSteps: [],
      };
    } catch {
      const friendlyFallback =
        'Halo! Saya INFERA AI, asisten digital investigasi klaim dan deteksi kecurangan BPJS Kesehatan. Ada yang bisa saya bantu terkait telaah berkas atau kepatuhan regulasi hari ini?';
      callbacks?.onDelta?.(friendlyFallback, friendlyFallback);
      callbacks?.onDone?.(friendlyFallback, [], []);
      return {
        reply: friendlyFallback,
        recommendations: [],
        shortcuts: [],
        toolSteps: [],
      };
    }
  }

  // 1. Intelligently plan tools based on query and simulation context
  const plannedTools = planInvestigationTools(userQuery, context);

  // 2. Helper to execute planned tools locally
  const runLocalPlannedTools = async () => {
    for (const pt of plannedTools) {
      if (signal?.aborted) break;

      const friendlyMeta = TOOL_FRIENDLY_LABELS[pt.name] || {
        running: `Menjalankan analisis ${pt.name}...`,
        done: `Analisis ${pt.name} selesai`,
      };

      const stepId = `step-${pt.name}-${Date.now()}`;
      const stepRunning: ToolProgressStep = {
        id: stepId,
        toolName: pt.name,
        label: friendlyMeta.running,
        status: 'running',
        timestamp: new Date().toISOString(),
      };
      callbacks?.onToolStep?.(stepRunning);

      // Brief yield for reactive UI feedback
      await new Promise((r) => setTimeout(r, 90));

      try {
        const result = await executeInferaTool(pt.name, pt.args, context);

        if (result.recommendation) {
          collectedRecommendations.push(result.recommendation);
          callbacks?.onRecommendation?.(result.recommendation);
        }

        const stepDone: ToolProgressStep = {
          id: stepId,
          toolName: pt.name,
          label: friendlyMeta.done,
          status: result.success ? 'completed' : 'failed',
          detail: result.summary,
          timestamp: new Date().toISOString(),
        };
        callbacks?.onToolStep?.(stepDone);
        completedSteps.push(stepDone);

        executedToolSummaries.push({
          name: pt.name,
          summary: result.summary,
          data: result.data,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Tool failure';
        const stepFailed: ToolProgressStep = {
          id: stepId,
          toolName: pt.name,
          label: `Kendala eksekusi ${pt.name}`,
          status: 'failed',
          detail: errMsg,
          timestamp: new Date().toISOString(),
        };
        callbacks?.onToolStep?.(stepFailed);
        completedSteps.push(stepFailed);
      }
    }
  };

  // 3. Check whether we should run direct OpenRouter client or backend proxy / local agent
  const hasDirectKey = !!apiKey && !settings.useBackendProxy;

  // Extract completed past messages, excluding current query, bounded to last 6 messages (3 conversation turns)
  const priorHistory = history
    .filter((m) => m.content && m.content.trim() && (m.role === 'user' || m.role === 'assistant'))
    .filter((m) => m.content !== userQuery)
    .slice(-6);

  if (hasDirectKey) {
    // Attempt Direct OpenRouter API Function Calling Loop
    try {
      const hasPdfAttachment =
        Boolean(attachments?.some((a) => a.type === 'pdf')) ||
        priorHistory.some((m) => m.attachments?.some((a) => a.type === 'pdf'));

      const conversationMessages: Array<{
        role: string;
        content?: any;
        tool_call_id?: string;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      }> = [
        { role: 'system', content: buildAgentSystemPrompt(context) },
        ...priorHistory.map((m) => ({
          role: m.role,
          content: formatMessageContent(m.content, m.attachments),
          ...(m.annotations ? { annotations: m.annotations } : {}),
        })),
        { role: 'user', content: formatMessageContent(userQuery, attachments) },
      ];

      callbacks?.onMetadata?.({ model: targetModel });

      const MAX_ITERATIONS = 4;
      let iteration = 0;

      while (iteration < MAX_ITERATIONS) {
        if (signal?.aborted) break;
        iteration += 1;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'INFERA BPJS AI Investigation Assistant',
          },
          body: JSON.stringify({
            models: [targetModel, ...AGENT_FALLBACK_MODELS.filter((m) => m !== targetModel)],
            messages: conversationMessages,
            tools: INFERA_TOOL_DEFINITIONS,
            tool_choice: 'auto',
            temperature: 0.3,
            max_tokens: 3000,
            ...(context?.enableReasoning ? { reasoning: { effort: 'medium' } } : {}),
            stream: true,
            provider: { allow_fallbacks: true },
            ...(hasPdfAttachment ? { plugins: [{ id: 'file-parser', pdf: { engine: 'cloudflare-ai' } }] } : {}),
          }),
          signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`OpenRouter returned status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const toolCallAccumulators: Record<number, RawToolCallAccumulator> = {};
        let iterationText = '';
        let fullReasoningText = '';

        while (true) {
          if (signal?.aborted) {
            reader.cancel().catch(() => {});
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') break;
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const choice = parsed.choices?.[0];
                if (!choice) continue;

                const delta = choice.delta;
                if (!delta) continue;

                const deltaReasoning =
                  delta.reasoning ||
                  delta.reasoning_content ||
                  (Array.isArray(delta.reasoning_details) ? delta.reasoning_details[0]?.text : '');

                if (context?.enableReasoning && deltaReasoning) {
                  fullReasoningText += deltaReasoning;
                  callbacks?.onReasoning?.(deltaReasoning, fullReasoningText);
                }

                if (delta.content) {
                  iterationText += delta.content;
                  fullAccumulatedText += delta.content;
                  callbacks?.onDelta?.(delta.content, fullAccumulatedText);
                }

                if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!toolCallAccumulators[idx]) {
                      toolCallAccumulators[idx] = {
                        id: tc.id || `call_${Date.now()}_${idx}`,
                        name: tc.function?.name || '',
                        arguments: '',
                      };
                    }
                    if (tc.id) toolCallAccumulators[idx].id = tc.id;
                    if (tc.function?.name) toolCallAccumulators[idx].name = tc.function.name;
                    if (tc.function?.arguments) {
                      toolCallAccumulators[idx].arguments += tc.function.arguments;
                    }
                  }
                }
              } catch {
                // Ignore chunk parse errors
              }
            }
          }
        }

        const toolCallList = Object.values(toolCallAccumulators).filter((tc) => tc.name);

        if (toolCallList.length === 0) {
          // If no tools called by the model, but query clearly required tools, execute planned tools now
          if (completedSteps.length === 0 && plannedTools.length > 0) {
            await runLocalPlannedTools();
          }
          break;
        }

        // Append assistant tool call request to conversation
        conversationMessages.push({
          role: 'assistant',
          content: iterationText.trim() || null,
          tool_calls: toolCallList.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });

        // Execute each model tool call
        for (const tc of toolCallList) {
          const friendlyMeta = TOOL_FRIENDLY_LABELS[tc.name] || {
            running: `Menjalankan analisis ${tc.name}...`,
            done: `Analisis ${tc.name} selesai`,
          };

          const stepRunning: ToolProgressStep = {
            id: tc.id,
            toolName: tc.name,
            label: friendlyMeta.running,
            status: 'running',
            timestamp: new Date().toISOString(),
          };
          callbacks?.onToolStep?.(stepRunning);

          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = tc.arguments ? JSON.parse(tc.arguments) : {};
          } catch {
            parsedArgs = {};
          }

          const result = await executeInferaTool(tc.name, parsedArgs, context);

          if (result.recommendation) {
            collectedRecommendations.push(result.recommendation);
            callbacks?.onRecommendation?.(result.recommendation);
          }

          const stepDone: ToolProgressStep = {
            id: tc.id,
            toolName: tc.name,
            label: friendlyMeta.done,
            status: result.success ? 'completed' : 'failed',
            detail: result.summary,
            timestamp: new Date().toISOString(),
          };
          callbacks?.onToolStep?.(stepDone);
          completedSteps.push(stepDone);

          conversationMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({
              success: result.success,
              summary: result.summary,
              data: result.data,
              recommendation_prepared: !!result.recommendation,
              error: result.error,
            }),
          });
        }
      }

      if (fullAccumulatedText.trim()) {
        const cleanReply = cleanRawAiResponse(fullAccumulatedText);
        const shortcuts = extractShortcuts(cleanReply);
        callbacks?.onDone?.(cleanReply, collectedRecommendations, shortcuts);
        return {
          reply: cleanReply,
          recommendations: collectedRecommendations,
          shortcuts,
          toolSteps: completedSteps,
        };
      }
    } catch (directErr) {
      console.warn(
        '[OpenRouterAgent] Direct function calling failed or unauthorized, falling back to local hybrid agent:',
        directErr
      );
    }
  }

  // 4. Deterministic Local & Backend Hybrid Agent Execution
  // Run all planned analytical and recommendation tools
  await runLocalPlannedTools();

  // 4.1 Safety Net: If tools ran but collectedRecommendations is empty, synthesize based on analysis results
  if (collectedRecommendations.length === 0 && executedToolSummaries.length > 0) {
    const participantData = executedToolSummaries.find((s) => s.name === 'analyze_participant')?.data as any;
    const riskData = executedToolSummaries.find((s) => s.name === 'calculate_risk_score')?.data as any;
    const targetName = participantData?.patient_name || (plannedTools[0]?.args?.participant_query as string) || '';

    if (targetName) {
      const score = riskData?.score || participantData?.risk_score || 85;
      const level: InvestigationRiskLevel = score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : 'MEDIUM';

      let route = '/dashboard/cases';
      const fraudData = executedToolSummaries.find((s) => s.name === 'detect_fraud_pattern')?.data as any;
      const cat = String(fraudData?.category || participantData?.category || '').toUpperCase();
      const qLower = userQuery.toLowerCase();

      if (cat.includes('IDENTITY') || qLower.includes('travel') || qLower.includes('pinjam') || qLower.includes('biologi') || qLower.includes('identitas')) {
        route = '/dashboard/identity-risk';
      } else if (cat.includes('UNNECESSARY') || qLower.includes('shopping') || qLower.includes('dsi') || qLower.includes('redundan')) {
        route = '/dashboard/unnecessary-services';
      } else if (cat.includes('MEDICINE') || cat.includes('ALKES') || qLower.includes('prb') || qLower.includes('obat') || qLower.includes('kacamata') || qLower.includes('cooling')) {
        route = '/dashboard/pharmacy-alkes';
      } else if (qLower.includes('regulasi') || qLower.includes('pasal') || qLower.includes('permenkes') || qLower.includes('hukum')) {
        route = '/dashboard/regulations';
      }

      const autoRec: ActionRecommendation = {
        id: `rec-auto-${Date.now()}`,
        title: `Tinjau Investigasi Kasus: ${targetName}`,
        description: `Buka modul investigasi forensik untuk verifikasi log SEP dan pembuktian anomali secara komparatif.`,
        riskScore: score,
        riskLevel: level,
        reason: participantData?.anomaly_title || 'Indikasi anomali klaim memerlukan verifikasi auditor.',
        signals: [
          {
            type: 'MANUAL_REVIEW_FLAG',
            label: 'Verifikasi Investigasi Auditor',
            severity: level,
            description: participantData?.anomaly_title || 'Temuan anomali data klaim.',
          },
        ],
        actionLabel: 'Buka Modus Investigasi',
        actionType: 'NAVIGATE',
        targetId: participantData?.no_kartu || participantData?.no_sep || `target-${Date.now()}`,
        targetName,
        targetRoute: route,
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
      };

      collectedRecommendations.push(autoRec);
      callbacks?.onRecommendation?.(autoRec);
    }
  }

  // 5. Stream Narrative Generation
  // Prepare factual evidence dossier for backend prompt grounding
  const evidenceDossier = executedToolSummaries
    .map(
      (et) =>
        `### Tool: ${et.name}\n- Ringkasan: ${et.summary}\n- Data Terverifikasi: ${JSON.stringify(
          et.data || {}
        )}`
    )
    .join('\n\n');

  const augmentedPrompt = executedToolSummaries.length > 0
    ? `${userQuery}\n\n=== BUKTI HASIL ANALISIS TOOL INFERA AKTIF (TERVERIFIKASI) ===\n${evidenceDossier}\n\nGunakan fakta di atas untuk menyajikan analisis mendalam terstruktur lengkap dengan rujukan regulasi resmi dan rekomendasi tindakan auditor.`
    : userQuery;

  let streamSuccess = false;

  try {
    const streamResult = await streamOpenRouterChat(
      augmentedPrompt,
      priorHistory,
      settings,
      'chat',
      {
        onMetadata: callbacks?.onMetadata,
        onReasoning: context?.enableReasoning ? callbacks?.onReasoning : undefined,
        onDelta: (delta, acc) => {
          const visible = getStreamingVisibleText(acc);
          fullAccumulatedText = visible;
          callbacks?.onDelta?.(delta, visible);
        },
      },
      signal,
      buildAgentSystemPrompt(context),
      attachments,
      Boolean(context?.enableReasoning)
    );

    if (
      streamResult &&
      streamResult.trim() &&
      !streamResult.includes('Halo! Ini adalah respon simulasi')
    ) {
      fullAccumulatedText = cleanRawAiResponse(streamResult);
      streamSuccess = true;
    }
  } catch (backendErr) {
    console.warn('[OpenRouterAgent] Backend stream unavailable, using local synthesis:', backendErr);
  }

  // If backend was offline, returned sandbox mock, or generated empty text:
  // Synthesize an authoritative, rich audit report from verified tool results
  if (!streamSuccess || !fullAccumulatedText.trim()) {
    fullAccumulatedText = '';
    const reportText = synthesizeStructuredReport(
      userQuery,
      executedToolSummaries,
      collectedRecommendations
    );

    // Stream the synthesized report word-by-word with natural delay
    const words = reportText.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) break;
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      fullAccumulatedText += word;
      callbacks?.onDelta?.(word, fullAccumulatedText);
      await new Promise((r) => setTimeout(r, 16));
    }
  }

  const cleanFinal = cleanRawAiResponse(fullAccumulatedText);
  const shortcuts = extractShortcuts(cleanFinal);
  callbacks?.onDone?.(cleanFinal, collectedRecommendations, shortcuts);

  return {
    reply: cleanFinal,
    recommendations: collectedRecommendations,
    shortcuts,
    toolSteps: completedSteps,
  };
}
