import {
  ActionRecommendation,
  ToolProgressStep,
  RagSearchResult,
} from '@healthathon/shared';
import {
  INFERA_TOOL_DEFINITIONS,
  TOOL_FRIENDLY_LABELS,
  executeInferaTool,
  ToolExecutionContext,
} from './tools/toolRegistry';
import {
  ChatMessage,
  OpenRouterSettings,
  AiShortcut,
  extractShortcuts,
  streamOpenRouterChat,
} from './openrouter';

export interface AgentStreamCallbacks {
  onMetadata?: (meta: {
    model: string;
    citations?: RagSearchResult[];
  }) => void;
  onToolStep?: (step: ToolProgressStep) => void;
  onRecommendation?: (rec: ActionRecommendation) => void;
  onDelta?: (delta: string, accumulated: string) => void;
  onDone?: (
    fullText: string,
    recommendations: ActionRecommendation[],
    shortcuts: AiShortcut[]
  ) => void;
  onError?: (err: Error) => void;
}

const AGENT_SYSTEM_PROMPT = `Anda adalah INFERA AI, Asisten Investigasi Fraud & Analisis Risiko Cerdas BPJS Kesehatan.

Karakter & Identitas:
- Anda adalah AI Investigator resmi untuk Program JKN (Jaminan Kesehatan Nasional).
- Karakter Anda: Objektif, analitis, profesional, santun, dan taat hukum.
- ANDA BUKAN SEKADAR CHATBOT PENJAWAB TEKS. Anda adalah asisten investigasi yang memiliki akses ke tools analitik.

Kebijakan Penggunaan Tools (Function Calling):
1. JIKA PENGGUNA BERTANYA TENTANG PESERTA, KASUS, DATA KLAIM, ATAU ANOMALI:
   - WAJIB panggil tool "analyze_participant" atau "get_claim_history" terlebih dahulu.
   - JANGAN MENGARANG nomor kartu, diagnosa, tarif, atau nama faskes. Gunakan hasil dari tool!
2. JIKA PERLU VERIFIKASI POLA KECURANGAN TERTENTU:
   - Panggil tool "detect_fraud_pattern" (Impossible Travel, Doctor Shopping DSI, Resale Obat PRB, atau Diskordansi Biologis).
   - Panggil tool "calculate_risk_score" untuk melihat breakdown skor risiko resmi.
3. JIKA PERLU KUTIPAN HUKUM & PASAL:
   - Panggil tool "search_regulations_rag" untuk mengambil pasal Permenkes No. 16/2019, Permenkes No. 3/2023, UU BPJS No. 24/2011, atau KUHP 263.
4. TINDAKAN ADMINISTRATIF / REKOMENDASI:
   - Anda TIDAK BOLEH mengeksekusi sanksi atau suspensi secara sepihak.
   - Gunakan tool "propose_participant_suspension" jika kasus terbukti kritis (skor >= 85) untuk diserahkan ke persetujuan auditor.
   - Gunakan tool "propose_warning_letter" jika merekomendasikan penerbitan surat klarifikasi/peringatan.
   - Gunakan tool "propose_case_review" untuk merekomendasikan audit manual pada halaman visualisasi spesifik.

Format Respon Akhir:
- Sajikan penjelasan terstruktur dengan format Markdown semantik (Judul, temuan bukti, analisis matematis jika ada, dasar hukum resmi JKN, dan kesimpulan rekomendasi).
- Gunakan bahasa yang objektif dan berimbang: katakan "indikasi", "potensi risiko", atau "anomali terdeteksi" dan jangan membuat vonis pidana otomatis tanpa putusan pengadilan.`;

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
 * Intelligent Intent & Entity Detector:
 * Identifies target participant, fraud typologies, and required tools from the query and active context
 */
function planInvestigationTools(
  query: string,
  context?: ToolExecutionContext
): PlannedTool[] {
  const clean = query.toLowerCase().trim();
  const tools: PlannedTool[] = [];

  // 1. Identify Target Participant / Case
  let targetQuery = '';
  let participantName = '';
  let noKartu = '';
  let caseCode = '';

  if (clean.includes('budi') || clean.includes('0001847291038') || clean.includes('case-001') || clean.includes('travel')) {
    targetQuery = 'Budi Santoso';
    participantName = 'Budi Santoso';
    noKartu = '0001847291038';
    caseCode = 'CASE-001';
  } else if (clean.includes('hendra') || clean.includes('0001928471920') || clean.includes('case-002') || clean.includes('shopping') || clean.includes('dsi')) {
    targetQuery = 'Hendra Wijaya';
    participantName = 'Hendra Wijaya';
    noKartu = '0001928471920';
    caseCode = 'CASE-002';
  } else if (clean.includes('nurul') || clean.includes('0001738291029') || clean.includes('case-003') || clean.includes('prb') || clean.includes('insulin')) {
    targetQuery = 'Nurul Hidayati';
    participantName = 'Nurul Hidayati';
    noKartu = '0001738291029';
    caseCode = 'CASE-003';
  } else if (clean.includes('agus') || clean.includes('0001639201948') || clean.includes('case-004') || clean.includes('biologi') || clean.includes('sesar') || clean.includes('caesar')) {
    targetQuery = 'Agus Pratama';
    participantName = 'Agus Pratama';
    noKartu = '0001639201948';
    caseCode = 'CASE-004';
  } else if (context?.selectedClaim) {
    targetQuery = context.selectedClaim.namaPeserta || context.selectedClaim.noKartu;
    participantName = context.selectedClaim.namaPeserta;
    noKartu = context.selectedClaim.noKartu;
    caseCode = context.selectedClaim.noSep;
  }

  // 2. Plan participant analysis & claims history
  if (targetQuery || clean.includes('peserta') || clean.includes('klaim') || clean.includes('audit')) {
    tools.push({
      name: 'analyze_participant',
      args: {
        participant_query: targetQuery || 'Budi Santoso',
        include_encounters: true,
      },
    });

    tools.push({
      name: 'get_claim_history',
      args: {
        participant_id: targetQuery || 'Budi Santoso',
      },
    });
  }

  // 3. Plan Fraud Pattern Detection
  if (
    clean.includes('travel') ||
    clean.includes('kecepatan') ||
    clean.includes('spasial') ||
    clean.includes('mobilitas') ||
    caseCode === 'CASE-001'
  ) {
    tools.push({
      name: 'detect_fraud_pattern',
      args: {
        pattern_type: 'impossible_travel',
        target_id: targetQuery || 'Budi Santoso',
      },
    });
  } else if (
    clean.includes('shopping') ||
    clean.includes('dsi') ||
    clean.includes('kunjungan ganda') ||
    caseCode === 'CASE-002'
  ) {
    tools.push({
      name: 'detect_fraud_pattern',
      args: {
        pattern_type: 'doctor_shopping',
        target_id: targetQuery || 'Hendra Wijaya',
      },
    });
  } else if (
    clean.includes('prb') ||
    clean.includes('obat') ||
    clean.includes('insulin') ||
    clean.includes('resale') ||
    caseCode === 'CASE-003'
  ) {
    tools.push({
      name: 'detect_fraud_pattern',
      args: {
        pattern_type: 'prb_resale',
        target_id: targetQuery || 'Nurul Hidayati',
      },
    });
  } else if (
    clean.includes('biologi') ||
    clean.includes('gender') ||
    clean.includes('sesar') ||
    clean.includes('caesar') ||
    clean.includes('diskordansi') ||
    caseCode === 'CASE-004'
  ) {
    tools.push({
      name: 'detect_fraud_pattern',
      args: {
        pattern_type: 'biological_discordance',
        target_id: targetQuery || 'Agus Pratama',
      },
    });
  } else if (targetQuery || clean.includes('indikator') || clean.includes('pola')) {
    tools.push({
      name: 'detect_fraud_pattern',
      args: {
        pattern_type: 'all',
        target_id: targetQuery || 'Budi Santoso',
      },
    });
  }

  // 4. Plan Risk Score Calculation
  if (
    targetQuery ||
    clean.includes('skor') ||
    clean.includes('risiko') ||
    clean.includes('risk') ||
    clean.includes('hitung')
  ) {
    tools.push({
      name: 'calculate_risk_score',
      args: {
        target_id: targetQuery || 'Budi Santoso',
      },
    });
  }

  // 5. Plan Regulation Search (RAG)
  if (
    clean.includes('regulasi') ||
    clean.includes('permenkes') ||
    clean.includes('pasal') ||
    clean.includes('hukum') ||
    clean.includes('sanksi') ||
    clean.includes('uu') ||
    targetQuery
  ) {
    const regQuery = clean.includes('permenkes')
      ? 'Permenkes No. 16 Tahun 2019 pencegahan kecurangan fraud JKN sanksi administrasi'
      : clean.includes('travel') || caseCode === 'CASE-001'
      ? 'Peminjaman kartu BPJS pemalsuan identitas klaim fiktif Permenkes 16 2019'
      : clean.includes('shopping') || caseCode === 'CASE-002'
      ? 'Doctor shopping duplikasi klaim pelayanan berlebih tanpa indikasi medis'
      : clean.includes('prb') || caseCode === 'CASE-003'
      ? 'Penyalahgunaan peresepan obat Program Rujuk Balik PRB arbitrase penjualan kembali'
      : clean.includes('biologi') || caseCode === 'CASE-004'
      ? 'Diskordansi biologi pemalsuan identitas KUHP 263 dan sanksi BPJS'
      : query;

    tools.push({
      name: 'search_regulations_rag',
      args: {
        query: regQuery,
        category: 'ALL',
      },
    });
  }

  // 6. Plan Action Recommendations (Two-Phase Model)
  if (
    targetQuery &&
    (clean.includes('rekomendasi') ||
      clean.includes('tindakan') ||
      clean.includes('sanksi') ||
      clean.includes('suspensi') ||
      clean.includes('peringatan') ||
      clean.includes('audit') ||
      caseCode)
  ) {
    if (caseCode === 'CASE-001' || clean.includes('suspensi') || clean.includes('travel')) {
      tools.push({
        name: 'propose_participant_suspension',
        args: {
          participant_id: noKartu || '0001847291038',
          participant_name: participantName || 'Budi Santoso',
          reason:
            'Terindikasi Impossible Travel: perpindahan fisik faskes berjarak 110 km dalam 45 menit (kecepatan 180 km/jam). Dugaan kuat peminjaman kartu identitas kepesertaan.',
          severity: 'CRITICAL',
          legal_basis: 'Permenkes No. 16 Tahun 2019 Pasal 6 & UU No. 24/2011 Pasal 19',
        },
      });

      tools.push({
        name: 'propose_case_review',
        args: {
          case_id: 'CASE-001',
          patient_name: participantName || 'Budi Santoso',
          reason: 'Audit forensik peta rute geospasial dan rekonsiliasi log SEP faskes.',
          priority: 'CRITICAL',
          target_workflow_route: '/dashboard/identity-risk',
        },
      });
    } else if (caseCode === 'CASE-002' || clean.includes('shopping') || clean.includes('dsi')) {
      tools.push({
        name: 'propose_warning_letter',
        args: {
          recipient_type: 'PESERTA',
          recipient_id: noKartu || '0001928471920',
          recipient_name: participantName || 'Hendra Wijaya',
          letter_type: 'PERINGATAN',
          violation_details:
            'Kunjungan berulang di 3 faskes berbeda dalam 5 hari (Indeks DSI = 1.00) dengan keluhan Vertigo sama demi peresepan obat berlebih.',
          legal_basis: 'Permenkes No. 16 Tahun 2019 Pasal 7',
        },
      });

      tools.push({
        name: 'propose_case_review',
        args: {
          case_id: 'CASE-002',
          patient_name: participantName || 'Hendra Wijaya',
          reason: 'Tinjau indeks DSI dan grafik frekuensi kunjungan faskes redundan.',
          priority: 'HIGH',
          target_workflow_route: '/dashboard/unnecessary-services',
        },
      });
    } else if (caseCode === 'CASE-003' || clean.includes('prb') || clean.includes('obat')) {
      tools.push({
        name: 'propose_warning_letter',
        args: {
          recipient_type: 'PESERTA',
          recipient_id: noKartu || '0001738291029',
          recipient_name: participantName || 'Nurul Hidayati',
          letter_type: 'TAGIHAN',
          violation_details:
            'Penebusan obat kronis (Insulin & Amlodipine) 90 hari kuota dalam tempo 22 hari (surplus 190%) terindikasi arbitrase komersial.',
          legal_basis: 'Permenkes No. 16 Tahun 2019 Pasal 8',
        },
      });

      tools.push({
        name: 'propose_case_review',
        args: {
          case_id: 'CASE-003',
          patient_name: participantName || 'Nurul Hidayati',
          reason: 'Audit log apotek jejaring dan kuota penebusan obat PRB.',
          priority: 'CRITICAL',
          target_workflow_route: '/dashboard/pharmacy-alkes',
        },
      });
    } else if (caseCode === 'CASE-004' || clean.includes('biologi') || clean.includes('sesar')) {
      tools.push({
        name: 'propose_participant_suspension',
        args: {
          participant_id: noKartu || '0001639201948',
          participant_name: participantName || 'Agus Pratama',
          reason:
            'Diskordansi Biologis Mutlak: Peserta Laki-Laki terbit SEP Rawat Inap persalinan Seksio Sesarea (O82.0) di RSUD Kota.',
          severity: 'CRITICAL',
          legal_basis: 'Permenkes No. 16 Tahun 2019 Pasal 6 & KUHP Pasal 263',
        },
      });

      tools.push({
        name: 'propose_case_review',
        args: {
          case_id: 'CASE-004',
          patient_name: participantName || 'Agus Pratama',
          reason: 'Verifikasi identitas kepesertaan dan konfirmasi klaim faskes persalinan.',
          priority: 'CRITICAL',
          target_workflow_route: '/dashboard/identity-risk',
        },
      });
    }
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
  _query: string,
  executedSteps: Array<{ name: string; summary: string; data?: any }>,
  recommendations: ActionRecommendation[]
): string {
  const participantStep = executedSteps.find((s) => s.name === 'analyze_participant');
  const fraudStep = executedSteps.find((s) => s.name === 'detect_fraud_pattern');
  const riskStep = executedSteps.find((s) => s.name === 'calculate_risk_score');
  const ragStep = executedSteps.find((s) => s.name === 'search_regulations_rag');

  const pData = participantStep?.data;
  const fData = fraudStep?.data;
  const rData = riskStep?.data;
  const citations = ragStep?.data?.citations || [];

  let out = `# Laporan Investigasi Integritas Klaim JKN\n\n`;
  out += `> [!IMPORTANT]\n`;
  out += `> Hasil verifikasi otomatis ini disusun oleh sistem analitik investigasi **INFERA** berdasarkan validasi silang rekam medis, log SEP, formula analitik kejahatan klaim, dan rujukan regulasi resmi BPJS Kesehatan.\n\n`;

  if (pData) {
    out += `## 1. Identifikasi Subjek & Profil Kepesertaan\n\n`;
    out += `| Parameter Verifikasi | Data / Nilai Terkonfirmasi |\n`;
    out += `| :--- | :--- |\n`;
    out += `| **Nama Peserta** | **${pData.patient_name || '-'}** |\n`;
    out += `| **No. Kartu BPJS** | \`${pData.no_kartu || '-'}\` |\n`;
    out += `| **Nomor SEP / Berkas** | \`${pData.no_sep || pData.case_code || '-'}\` |\n`;
    out += `| **Kategori Tipologi** | ${pData.category_label || pData.anomaly_title || 'Indikasi Anomali Transaksi'} |\n`;
    out += `| **Skor Risiko Fraud** | **${rData?.score || pData.risk_score || 90} / 100** (\`${rData?.risk_level || pData.risk_level || 'CRITICAL'}\`) |\n`;
    if (pData.potential_loss_idr) {
      out += `| **Potensi Kerugian DJS** | Rp ${Number(pData.potential_loss_idr).toLocaleString('id-ID')} |\n`;
    }
    out += `\n`;
  }

  if (fData && fData.signals && fData.signals.length > 0) {
    out += `## 2. Temuan Bukti Sinyal Anomali (Formula Fraud Teruji)\n\n`;
    out += `Evaluasi analitik terhadap indikator kecurangan menemukan sinyal kritis sebagai berikut:\n\n`;
    for (const sig of fData.signals) {
      out += `* **${sig.label}** (\`${sig.severity}\`)\n`;
      out += `  * **Uraian**: ${sig.description}\n`;
      if (sig.evidence) {
        out += `  * **Bukti Matematis**: \`${sig.evidence}\`\n`;
      }
      out += `\n`;
    }
  }

  if (citations.length > 0) {
    out += `## 3. Landasan Hukum & Rujukan Regulasi (RAG Grounding)\n\n`;
    out += `Pencegahan dan penindakan atas temuan ini didasarkan pada ketentuan perundang-undangan JKN yang sah:\n\n`;
    citations.slice(0, 3).forEach((c: any, i: number) => {
      out += `**[${i + 1}] ${c.regulation} ${c.article ? `(${c.article})` : ''}**: *${c.title}*\n`;
      out += `> "${c.content}"\n\n`;
    });
  }

  out += `## 4. Rekomendasi Tindakan Auditor\n\n`;
  if (recommendations.length > 0) {
    out += `Sistem telah menyiapkan **${recommendations.length} kartu rekomendasi tindakan formal** yang dapat ditinjau dan dikonfirmasi langsung oleh auditor melalui panel di bawah ini:\n\n`;
    for (const rec of recommendations) {
      out += `1. **${rec.title}** (${rec.riskLevel})\n`;
      out += `   - *Uraian*: ${rec.description}\n`;
      out += `   - *Dasar Hukum*: \`${rec.legalBasis || 'Permenkes No. 16 Tahun 2019'}\`\n`;
      out += `   - *Status Tindakan*: ${rec.requiresConfirmation ? 'Memerlukan Konfirmasi & Berita Acara Auditor' : 'Pintasan Siap Dieksekusi'}\n\n`;
    }
  } else {
    out += `1. Lakukan audit manual dan klarifikasi langsung dengan fasilitas kesehatan terkait.\n`;
    out += `2. Terbitkan berita acara pemeriksaan (BAP) jika ditemukan ketidaksesuaian klinis atau indikasi kartu pinjam.\n\n`;
  }

  out += `*Audit selesai diverifikasi oleh INFERA Multi-Tool Engine.*`;
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
  signal?: AbortSignal
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

  if (hasDirectKey) {
    // Attempt Direct OpenRouter API Function Calling Loop
    try {
      const conversationMessages: Array<{
        role: string;
        content?: string | null;
        tool_call_id?: string;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      }> = [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
        ...history.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: userQuery },
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
            stream: true,
            provider: { allow_fallbacks: true },
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
        const shortcuts = extractShortcuts(fullAccumulatedText);
        callbacks?.onDone?.(fullAccumulatedText, collectedRecommendations, shortcuts);
        return {
          reply: fullAccumulatedText,
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
      history,
      settings,
      'chat',
      {
        onMetadata: callbacks?.onMetadata,
        onDelta: (delta, acc) => {
          fullAccumulatedText = acc;
          callbacks?.onDelta?.(delta, acc);
        },
      },
      signal
    );

    if (
      streamResult &&
      streamResult.trim() &&
      !streamResult.includes('Halo! Ini adalah respon simulasi')
    ) {
      fullAccumulatedText = streamResult;
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

  const shortcuts = extractShortcuts(fullAccumulatedText);
  callbacks?.onDone?.(fullAccumulatedText, collectedRecommendations, shortcuts);

  return {
    reply: fullAccumulatedText,
    recommendations: collectedRecommendations,
    shortcuts,
    toolSteps: completedSteps,
  };
}
