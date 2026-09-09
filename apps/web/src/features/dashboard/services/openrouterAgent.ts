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

/**
 * Executes a full multi-turn agent tool loop with streaming support
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
  let fullAccumulatedText = '';

  // Prepare initial conversation messages
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

  // Safety cap to prevent infinite tool loops
  const MAX_ITERATIONS = 5;
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    if (signal?.aborted) break;
    iteration += 1;

    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
    } catch (fetchErr) {
      if (signal?.aborted) break;
      const err = fetchErr instanceof Error ? fetchErr : new Error('Network error reaching OpenRouter');
      callbacks?.onError?.(err);
      throw err;
    }

    if (!response.ok || !response.body) {
      const errText = await response.text();
      const err = new Error(`OpenRouter error (${response.status}): ${errText}`);
      callbacks?.onError?.(err);
      throw err;
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

            // 1. Text streaming delta
            if (delta.content) {
              iterationText += delta.content;
              fullAccumulatedText += delta.content;
              callbacks?.onDelta?.(delta.content, fullAccumulatedText);
            }

            // 2. Tool calls delta
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
            // Ignore incomplete JSON stream lines
          }
        }
      }
    }

    const toolCallList = Object.values(toolCallAccumulators).filter((tc) => tc.name);

    // If NO tools were called, this is the final narrative answer
    if (toolCallList.length === 0) {
      break;
    }

    // Append Assistant Message with Tool Calls to conversation
    conversationMessages.push({
      role: 'assistant',
      content: iterationText.trim() || null,
      tool_calls: toolCallList.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: tc.arguments,
        },
      })),
    });

    // Execute each tool call sequentially
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
      } catch (parseErr) {
        console.warn(`[Agent] Failed to parse tool arguments for ${tc.name}:`, tc.arguments);
        conversationMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({
            error: 'INVALID_JSON_ARGUMENTS',
            message: `Format argumen JSON tidak valid untuk fungsi ${tc.name}`,
          }),
        });

        const stepFailed: ToolProgressStep = {
          id: tc.id,
          toolName: tc.name,
          label: `Gagal memproses argumen ${tc.name}`,
          status: 'failed',
          timestamp: new Date().toISOString(),
        };
        callbacks?.onToolStep?.(stepFailed);
        completedSteps.push(stepFailed);
        continue;
      }

      // Execute tool via Centralized Registry
      try {
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

        // Add tool response message for LLM next turn
        conversationMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result.data || { summary: result.summary, error: result.error }),
        });
      } catch (execErr) {
        const errMessage = execErr instanceof Error ? execErr.message : 'Unknown tool error';
        conversationMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({ error: 'TOOL_EXECUTION_ERROR', message: errMessage }),
        });

        const stepFailed: ToolProgressStep = {
          id: tc.id,
          toolName: tc.name,
          label: `Kendala eksekusi ${tc.name}`,
          status: 'failed',
          detail: errMessage,
          timestamp: new Date().toISOString(),
        };
        callbacks?.onToolStep?.(stepFailed);
        completedSteps.push(stepFailed);
      }
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
