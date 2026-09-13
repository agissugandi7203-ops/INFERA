import { CharacterEmotion } from '../avatar/AvatarController';
import {
  VOICE_DEFAULT_ID,
  VOICE_SECONDARY_ID,
  VOICE_CHAT_DEFAULT_ID,
  VOICE_CHAT_SECONDARY_ID,
  VoiceExpressionMetadata,
} from './tts-processor';
import type { RagSearchResult, ActionRecommendation, ToolProgressStep } from '@healthathon/shared';
import { webRagService } from '../../../services/rag.service';

export interface AiShortcut {
  label: string;
  path?: string;
  route?: string;
  action?: string;
  description?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  mimeType: string;
  dataUrl: string; // Base64 data URL (data:image/...;base64,... or data:application/pdf;base64,...)
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  isThinking?: boolean;
  emotion?: CharacterEmotion;
  shortcuts?: AiShortcut[];
  citations?: RagSearchResult[];
  recommendations?: ActionRecommendation[];
  toolSteps?: ToolProgressStep[];
  attachments?: ChatAttachment[];
  annotations?: any[];
  timestamp: string;
  isStreaming?: boolean;
  isReasoningEnabled?: boolean;
}

/**
 * Transforms plain text and attachments into OpenRouter multimodal content array
 * Following official OpenRouter Image & PDF specifications
 */
export function formatMessageContent(
  text: string,
  attachments?: ChatAttachment[]
): string | Array<Record<string, unknown>> {
  if (!attachments || attachments.length === 0) {
    return text;
  }
  const parts: Array<Record<string, unknown>> = [];
  if (text && text.trim()) {
    parts.push({
      type: 'text',
      text: text.trim(),
    });
  }
  for (const att of attachments) {
    if (att.type === 'image') {
      parts.push({
        type: 'image_url',
        image_url: {
          url: att.dataUrl,
        },
      });
    } else if (att.type === 'pdf') {
      parts.push({
        type: 'file',
        file: {
          filename: att.name,
          file_data: att.dataUrl,
        },
      });
    }
  }
  return parts.length > 0 ? parts : text;
}

import { runAgentInvestigationStream, isSimpleGreetingOrChat } from './openrouterAgent';
export { runAgentInvestigationStream, isSimpleGreetingOrChat };

export interface OpenRouterSettings {
  apiKey: string;
  model: string;
  useBackendProxy: boolean;
  elevenLabsApiKey?: string;
  avatarVoiceId?: string; // Khusus AI Kanan (Avatar Karakter Virtual: Fera / Luna)
  chatVoiceId?: string;   // Khusus Inti AI Chat (Narator Sistem Resmi: Auditor / Analis)
  elevenLabsVoiceId?: string; // Kompatibilitas mundur untuk avatarVoiceId
}

export interface VoicePreset {
  id: string;
  name: string;
  character: string;
  description: string;
  tier: 'free' | 'paid';
}

// 1. Suara untuk AI Kanan (Avatar Karakter Virtual 2D)
export const AVATAR_VOICE_PRESETS: VoicePreset[] = [
  {
    id: VOICE_DEFAULT_ID,
    name: 'INFERA (Fera)',
    character: 'INFERA Voice (Suara Resmi — Hangat & Jelas)',
    description: 'Karakter suara utama asisten cerdas INFERA BPJS Kesehatan.',
    tier: 'free',
  },
  {
    id: VOICE_SECONDARY_ID,
    name: 'Luna',
    character: 'Luna (Avatar Ceria & Manis)',
    description: 'Karakter suara alternatif asisten virtual. Ceria, ekspresif, dan lembut.',
    tier: 'free',
  },
];

// 2. Suara untuk Inti AI Chat (INFERA System Audio / Auditor Narator)
export const CHAT_SYSTEM_VOICE_PRESETS: VoicePreset[] = [
  {
    id: VOICE_CHAT_DEFAULT_ID,
    name: 'INFERA Audio',
    character: 'INFERA Voice (Inti AI Chat — Suara Resmi & Wibawa)',
    description: 'Suara resmi narator laporan audit investigasi integritas klaim BPJS Kesehatan.',
    tier: 'free',
  },
  {
    id: VOICE_CHAT_SECONDARY_ID,
    name: 'Narator Analis INFERA',
    character: 'INFERA Audio (Inti AI Chat — Suara Netral & Presisi)',
    description: 'Suara sistem analitik berintonasi lugas, terstruktur, dan objektif.',
    tier: 'free',
  },
];

// Backward-compat alias
export const ANIME_VOICE_PRESETS = AVATAR_VOICE_PRESETS;

export const DEFAULT_SETTINGS: OpenRouterSettings = {
  apiKey: '',
  model: (import.meta.env?.VITE_DEFAULT_MODEL as string) || 'openai/gpt-oss-120b:nitro',
  useBackendProxy: true,
  elevenLabsApiKey: '',
  avatarVoiceId: (import.meta.env?.VITE_ELEVENLABS_VOICE_ID as string) || VOICE_DEFAULT_ID,
  chatVoiceId: VOICE_CHAT_DEFAULT_ID,
  elevenLabsVoiceId: (import.meta.env?.VITE_ELEVENLABS_VOICE_ID as string) || VOICE_DEFAULT_ID,
};

const STORAGE_SETTINGS_KEY = 'healthathon_openrouter_settings';
const STORAGE_HISTORY_KEY = 'healthathon_avatar_chat_history';

export function getStoredSettings(): OpenRouterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    
    // Validate avatarVoiceId (AI Kanan)
    let avatarVoice = parsed.avatarVoiceId || parsed.elevenLabsVoiceId;
    if (avatarVoice !== VOICE_DEFAULT_ID && avatarVoice !== VOICE_SECONDARY_ID) {
      avatarVoice = VOICE_DEFAULT_ID;
    }

    // Validate chatVoiceId (Inti AI Chat)
    let chatVoice = parsed.chatVoiceId;
    if (chatVoice !== VOICE_CHAT_DEFAULT_ID && chatVoice !== VOICE_CHAT_SECONDARY_ID) {
      chatVoice = VOICE_CHAT_DEFAULT_ID;
    }

    return {
      apiKey: parsed.apiKey || DEFAULT_SETTINGS.apiKey,
      model: parsed.model || DEFAULT_SETTINGS.model,
      useBackendProxy: parsed.useBackendProxy ?? DEFAULT_SETTINGS.useBackendProxy,
      elevenLabsApiKey: parsed.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey,
      avatarVoiceId: avatarVoice,
      chatVoiceId: chatVoice,
      elevenLabsVoiceId: avatarVoice,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: OpenRouterSettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function getStoredChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredChatHistory(history: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save chat history to localStorage:', err);
  }
}

export const AVATAR_EMOTION_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'set_avatar_emotion',
      description:
        'Tampilkan ekspresi wajah visual pada avatar anime 2D untuk mencerminkan respon emosi atau empati kamu kepada pengguna.',
      parameters: {
        type: 'object',
        properties: {
          emotion: {
            type: 'string',
            enum: ['normal', 'happy', 'sad', 'angry', 'surprised', 'confused', 'thinking'],
            description: 'Nama emosi avatar: normal, happy, sad, angry, surprised, confused, thinking.',
          },
          reason: {
            type: 'string',
            description: 'Alasan singkat kenapa kamu memilih ekspresi ini.',
          },
        },
        required: ['emotion'],
      },
    },
  },
];

/**
 * Clean any accidental JSON wrappers returned by LLM models
 * to ensure that raw JSON is never rendered inside chat bubbles.
 */
export function cleanRawAiResponse(raw: string): string {
  if (!raw) return '';
  let trimmed = raw.trim();

  // Strip wrapping markdown code blocks if present (```json ... ``` or ``` ...)
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (codeBlockMatch) {
    trimmed = codeBlockMatch[1].trim();
  }

  // Check if it starts with JSON object
  if (trimmed.startsWith('{')) {
    try {
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.text && typeof parsed.text === 'string') {
          return parsed.text.trim();
        }
        if (parsed.reply && typeof parsed.reply === 'string') {
          return parsed.reply.trim();
        }
      }
    } catch {
      // Resilient regex extraction if JSON syntax was partial or malformed
      const textMatch = trimmed.match(/"(?:text|reply)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (textMatch) {
        return textMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .trim();
      }
    }
  }

  // Fallback cleanup if the model generated literal "text": "..." syntax
  if (trimmed.startsWith('{"text":') || trimmed.startsWith('{"reply":')) {
    return trimmed
      .replace(/^\{?\s*"(?:text|reply)"\s*:\s*"?/i, '')
      .replace(/",\s*"(?:emotion|expressions|pauses|prosody|shortcuts)"[\s\S]*$/i, '')
      .replace(/"\s*\}?$/i, '')
      .trim();
  }

  return raw;
}

/**
 * Returns clean visible text during progressive streaming
 */
export function getStreamingVisibleText(raw: string): string {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('```json')) {
    const cleaned = cleanRawAiResponse(raw);
    if (cleaned !== raw) {
      return cleaned;
    }
    const match = raw.match(/"(?:text|reply)"\s*:\s*"((?:[^"\\]|\\.)*)$/);
    if (match) {
      return match[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t');
    }
  }
  return raw;
}

export const VOICE_STREAM_SYSTEM_PROMPT = `Identitas: Anda adalah FERA / Luna, asisten digital suara BPJS Kesehatan untuk INFERA. Karakter Anda ramah, cerdas, cekatan, dan berwibawa.
Prinsip Respon Suara:
1. Respon Percakapan Santai / Sapaan: Jika pengguna hanya menyapa ("halo", "hai", "selamat pagi", "apa kabar"), balaslah secara ramah, santun, dan singkat (1-2 kalimat). JANGAN membaca regulasi atau melaporkan audit jika pengguna tidak memintanya.
2. Berbasis Data & Fakta Nyata: Jika pengguna menanyakan kasus atau regulasi, jelaskan temuan anomali, status risiko, angka klaim, atau pasal regulasi JKN secara akurat dari data yang tersedia. Jangan hanya basa-basi atau pemanis semata.
3. Bahasa Lisan Padat (2-3 Kalimat): Sampaikan intisari secara alami, lugas, dan nyaman didengar via TTS. Respon harus dinamis sesuai konteks pertanyaan, BUKAN template klise.
4. Tanpa Format Tertulis: Jangan gunakan bullet points, tabel, simbol markdown (#, *), atau kode.`;

export const CHAT_STREAM_SYSTEM_PROMPT = `Identitas: Anda adalah INFERA AI, asisten digital investigasi fraud & integritas klaim BPJS Kesehatan. Karakter Anda analitis, objektif, tajam, dan solutif.
Prinsip Respon Analitis:
1. Respon Percakapan Santai / Sapaan: Jika pengguna hanya menyapa ("halo", "hai", "selamat pagi", dsb) atau bertanya santai, balaslah dengan ramah, hangat, dan ringkas (1-2 kalimat) menjelaskan kesiapan Anda membantu pengawasan dan investigasi klaim BPJS Kesehatan TANPA memaksakan laporan audit kasus atau mengutip pasal hukum yang tidak relevan.
2. Dinamis & Non-Template: Bila pengguna mengajukan telaah kasus atau regulasi, sesuaikan struktur dan gaya penjelasan dengan substansi pertanyaan auditor secara organik tanpa format boilerplate.
3. Landasan Data & Regulasi: Rujuk data klaim dan regulasi resmi JKN (Permenkes 16/2019, Permenkes 3/2023, UU 24/2011, KUHP 263) secara presisi dari konteks yang tersedia.
4. Format Markdown Semantik: Langsung sajikan teks Markdown naratif investigasi yang elegan dan terstruktur (Judul #, analisis bukti, rujukan hukum, rekomendasi). JANGAN PERNAH membungkus respons dalam format JSON atau format objek {"text": ...}.`;

const SYSTEM_PROMPT = `Identitas: Anda adalah INFERA AI, asisten digital investigasi fraud & integritas klaim BPJS Kesehatan. Karakter Anda analitis, objektif, tajam, dan solutif.
Prinsip Respon Analitis:
1. Dinamis & Non-Template: Berikan penalaran faktual mendalam sesuai kasus atau regulasi JKN yang ditanyakan tanpa template kaku.
2. Landasan Data & Regulasi: Berlandaskan bukti nyata data klaim dan regulasi resmi JKN (Permenkes 16/2019, UU 24/2011, Permenkes 3/2023).
3. Navigasi Cerdas: Sertakan array "shortcuts" yang relevan untuk membantu auditor langsung mengakses modul terkait.

Format Output WAJIB JSON:
{
  "text": "Jawaban lengkap analitis dalam format Markdown.",
  "emotion": "normal" | "happy" | "sad" | "angry" | "surprised" | "confused" | "thinking",
  "shortcuts": [
    { "label": "Label Modul", "path": "/dashboard/...", "description": "Keterangan singkat" }
  ]
}`;

export interface StreamChatCallbacks {
  onMetadata?: (meta: {
    model: string;
    provider?: string;
    citations: RagSearchResult[];
    mode: 'chat' | 'voice';
    requestId?: string;
  }) => void;
  onDelta?: (deltaText: string, fullAccumulatedText: string) => void;
  onReasoning?: (deltaText: string, fullReasoningText: string) => void;
  onAnnotations?: (annotations: any[]) => void;
  onDone?: (fullText: string, shortcuts: AiShortcut[], fullReasoning?: string) => void;
  onError?: (error: Error) => void;
}

/**
 * End-to-End SSE Streaming Client
 * Connects to Backend SSE /api/v1/ai/chat/stream, with fallback to OpenRouter direct streaming
 */
export async function streamOpenRouterChat(
  userText: string,
  history: ChatMessage[],
  settings: OpenRouterSettings,
  mode: 'chat' | 'voice' = 'chat',
  callbacks?: StreamChatCallbacks,
  signal?: AbortSignal,
  systemPromptOverride?: string,
  attachments?: ChatAttachment[],
  enableReasoning = false
): Promise<string> {
  const backendUrl = import.meta.env.VITE_API_URL || '/api/v1';
  let accumulated = '';
  let accumulatedReasoning = '';
  let citations: RagSearchResult[] = [];

  const priorHistory = history
    .filter((m) => m.content && m.content.trim() && (m.role === 'user' || m.role === 'assistant'))
    .filter((m) => m.content !== userText)
    .slice(-6);

  const hasPdfAttachment =
    Boolean(attachments?.some((a) => a.type === 'pdf')) ||
    priorHistory.some((m) => m.attachments?.some((a) => a.type === 'pdf'));

  // 1. Try Backend SSE Stream first
  try {
    const res = await fetch(`${backendUrl}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          ...priorHistory.map((m) => ({
            role: m.role,
            content: formatMessageContent(m.content, m.attachments),
            ...(m.annotations ? { annotations: m.annotations } : {}),
          })),
          {
            role: 'user',
            content: formatMessageContent(userText, attachments),
          },
        ],
        mode,
        enableReasoning,
        model: settings.model || (mode === 'voice' ? 'google/gemini-2.0-flash-001' : 'openai/gpt-oss-120b:nitro'),
        ...(hasPdfAttachment ? { plugins: [{ id: 'file-parser', pdf: { engine: 'cloudflare-ai' } }] } : {}),
      }),
      signal,
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

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

        let currentEvent = 'message';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'metadata') {
                if (data.citations) citations = data.citations;
                callbacks?.onMetadata?.(data);
              } else if (currentEvent === 'reasoning') {
                if (data.content) {
                  accumulatedReasoning += data.content;
                  callbacks?.onReasoning?.(data.content, accumulatedReasoning);
                }
              } else if (currentEvent === 'delta') {
                if (data.content) {
                  accumulated += data.content;
                  const visible = getStreamingVisibleText(accumulated);
                  callbacks?.onDelta?.(data.content, visible);
                }
              } else if (currentEvent === 'done') {
                const cleanFinal = cleanRawAiResponse(accumulated);
                const shortcuts = extractShortcuts(cleanFinal);
                callbacks?.onDone?.(cleanFinal, shortcuts, accumulatedReasoning || undefined);
                return cleanFinal;
              } else if (currentEvent === 'error') {
                throw new Error(data.message || 'Stream error from server');
              }
            } catch (err) {
              if (currentEvent === 'error') throw err;
            }
          }
        }
      }

      if (accumulated.trim()) {
        const cleanFinal = cleanRawAiResponse(accumulated);
        const shortcuts = extractShortcuts(cleanFinal);
        callbacks?.onDone?.(cleanFinal, shortcuts, accumulatedReasoning || undefined);
        return cleanFinal;
      }
    }
  } catch (err) {
    if (signal?.aborted) return cleanRawAiResponse(accumulated);
    console.warn('[Stream Client] Backend stream unavailable, attempting direct OpenRouter fallback:', err);
  }

  // 2. Fallback to Direct OpenRouter Client SSE (only if user provided custom override key)
  const apiKey = (settings.apiKey || '').trim();
  if (!apiKey) {
    const errorMsg =
      'Layanan AI backend sedang memproses antrean investigasi atau mengalami gangguan koneksi sementara. Silakan coba kembali sesaat lagi.';
    callbacks?.onError?.(new Error(errorMsg));
    return errorMsg;
  }

  try {
    try {
      citations = await webRagService.search({ query: userText, matchCount: 3 });
    } catch {
      citations = [];
    }

    callbacks?.onMetadata?.({
      model: settings.model || 'openai/gpt-oss-120b:nitro',
      mode,
      citations,
    });

    const ragContextBlock =
      citations.length > 0
        ? `\n=== BUKTI REGULASI RESMI (RAG GROUNDING) ===\n` +
          citations
            .map((c, i) => `[${i + 1}] ${c.regulation} (${c.article || ''}): ${c.title}\n"${c.content}"`)
            .join('\n\n')
        : '';

    const systemPrompt =
      systemPromptOverride ||
      (mode === 'voice'
        ? VOICE_STREAM_SYSTEM_PROMPT + ragContextBlock
        : CHAT_STREAM_SYSTEM_PROMPT + ragContextBlock);

    const targetModel = settings.model || (mode === 'voice' ? 'google/gemini-2.0-flash-001' : 'openai/gpt-oss-120b:nitro');
    const fallbackModels =
      mode === 'voice'
        ? ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct']
        : ['openai/gpt-oss-120b:nitro', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct'];

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'INFERA BPJS AI Assistant',
      },
      body: JSON.stringify({
        models: [targetModel, ...fallbackModels.filter((m) => m !== targetModel)],
        messages: [
          { role: 'system', content: systemPrompt },
          ...priorHistory.map((m) => ({
            role: m.role,
            content: formatMessageContent(m.content, m.attachments),
            ...(m.annotations ? { annotations: m.annotations } : {}),
          })),
          {
            role: 'user',
            content: formatMessageContent(userText, attachments),
          },
        ],
        temperature: mode === 'voice' ? 0.7 : 0.4,
        max_tokens: mode === 'voice' ? 220 : 2500,
        stream: true,
        provider: { allow_fallbacks: true },
        // Reasoning integrated ONLY when explicitly enabled by user
        ...(enableReasoning && mode === 'chat'
          ? { reasoning: { effort: 'medium' } }
          : {}),
        ...(hasPdfAttachment ? { plugins: [{ id: 'file-parser', pdf: { engine: 'cloudflare-ai' } }] } : {}),
      }),
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Direct OpenRouter streaming failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

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

            const deltaReasoning =
              choice?.delta?.reasoning ||
              choice?.delta?.reasoning_content ||
              choice?.delta?.reasoning_details?.[0]?.text;
            if (deltaReasoning) {
              accumulatedReasoning += deltaReasoning;
              callbacks?.onReasoning?.(deltaReasoning, accumulatedReasoning);
            }

            const delta = choice?.delta?.content;
            if (delta) {
              accumulated += delta;
              const visible = getStreamingVisibleText(accumulated);
              callbacks?.onDelta?.(delta, visible);
            }
          } catch {
            // Ignore partial lines
          }
        }
      }
    }

    const cleanFinal = cleanRawAiResponse(accumulated);
    const shortcuts = extractShortcuts(cleanFinal);
    callbacks?.onDone?.(cleanFinal, shortcuts, accumulatedReasoning || undefined);
    return cleanFinal;
  } catch (directErr) {
    const errorObj = directErr instanceof Error ? directErr : new Error('Gagal memproses streaming AI.');
    callbacks?.onError?.(errorObj);
    throw errorObj;
  }
}

export async function sendOpenRouterChat(
  userText: string,
  history: ChatMessage[],
  settings: OpenRouterSettings,
  mode: 'chat' | 'voice' = 'voice'
): Promise<{
  reply: string;
  emotion: CharacterEmotion;
  shortcuts?: AiShortcut[];
  citations?: RagSearchResult[];
  metadata?: VoiceExpressionMetadata;
}> {
  // 1. Injeksi Otak RAG: Cari regulasi JKN relevan secara semantik dari basis pengetahuan resmi
  // Khusus sapaan/percakapan santai ("halo"), jangan lakukan RAG agar tidak memaksa rujukan hukum berlebih
  const isGreeting = isSimpleGreetingOrChat(userText);
  let ragResults: RagSearchResult[] = [];

  if (!isGreeting) {
    try {
      ragResults = await webRagService.search({ query: userText, matchCount: 3 });
    } catch (ragErr) {
      console.warn('[RAG Brain] Gagal mengambil regulasi:', ragErr);
    }
  }

  const ragContextBlock =
    ragResults.length > 0 && !isGreeting
      ? `\n=== BASIS RUJUKAN HUKUM RESMI & REGULASI JKN (RAG OTAK AI TERSUNTIK) ===\n` +
        ragResults
          .map(
            (r, i) =>
              `[DOKUMEN ${i + 1}]: ${r.regulation} ${r.article ? `(${r.article})` : ''} — ${r.title}\nKATEGORI: ${r.category}\nRINGKASAN REGULASI RESMI:\n"${r.content}"`
          )
          .join('\n\n') +
        `\n\nINSTRUKSI PENALARAN HUKUM (LEGAL REASONING):\n1. Anda WAJIB mendasarkan analisis Anda pada pasal dan ketentuan regulasi resmi di atas.\n2. Kutip secara eksplisit nomor pasal, nama peraturan (misal Permenkes 16/2019, UU BPJS, dsb), batas waktu pengembalian (14 hari kerja), atau parameter kepatuhan.\n3. Berikan rekomendasi audit investigasi sistem INFERA serta sanksi administratif yang sesuai.`
      : '';

  const dynamicSystemPrompt = `${SYSTEM_PROMPT}${ragContextBlock}`;

  // If useBackendProxy is true or no direct key provided, try backend
  if (settings.useBackendProxy || (!settings.apiKey && import.meta.env.VITE_API_URL)) {
    try {
      const messages = [
        { role: 'system' as const, content: dynamicSystemPrompt },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userText },
      ];

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          mode,
          model: mode === 'voice' ? 'meta-llama/llama-3.3-70b-instruct' : (settings.model || 'openai/gpt-oss-120b:nitro'),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.message?.content) {
          const parsed = parseAiContent(json.data.message.content);
          return { ...parsed, citations: ragResults };
        }
      }
    } catch (err) {
      console.warn('Backend OpenRouter proxy unavailable, falling back to direct API:', err);
    }
  }

  // Direct OpenRouter Client (fallback only if custom key provided)
  const apiKey = (settings.apiKey || '').trim();
  if (!apiKey) {
    const defaultMsg =
      'Halo! Saya asisten avatar AI BPJS Kesehatan. Sistem backend AI saat ini sedang memproses data. Silakan coba ajukan pertanyaan Anda kembali.';
    return {
      reply: defaultMsg,
      emotion: 'happy',
      citations: ragResults,
      metadata: {
        text: defaultMsg,
        emotion: 'happy',
        expressions: [{ type: 'happy', intensity: 0.6 }],
        prosody: { energy: 0.8, pitch: 1.0, speed: 1.0 },
      },
    };
  }

  const messages = [
    { role: 'system', content: dynamicSystemPrompt },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userText },
  ];

  const targetModel = mode === 'voice' ? 'meta-llama/llama-3.3-70b-instruct' : (settings.model || 'openai/gpt-oss-120b:nitro');

  const payload: Record<string, unknown> = {
    model: targetModel,
    messages,
    temperature: 0.7,
    max_tokens: 1500,
  };

  // Only attach tools if model supports tool calls, or let OpenRouter handle it
  if (!targetModel.includes('nitro')) {
    payload.tools = AVATAR_EMOTION_TOOLS;
    payload.tool_choice = 'auto';
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 28000);

  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'INFERA BPJS AI Assistant',
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });
  } catch (netErr) {
    clearTimeout(timeoutId);
    if (netErr instanceof Error && netErr.name === 'AbortError') {
      const errReply = 'Maaf, server AI memerlukan waktu lebih lama dari biasanya untuk merespons. Silakan ulangi pertanyaan Anda.';
      return {
        reply: errReply,
        emotion: 'confused',
        metadata: {
          text: errReply,
          emotion: 'confused',
          expressions: [{ type: 'confused', intensity: 0.5 }],
        },
      };
    }
    const netReply = 'Koneksi ke layanan AI terganggu. Silakan periksa jaringan internet Anda atau coba beberapa saat lagi.';
    return {
      reply: netReply,
      emotion: 'confused',
      metadata: {
        text: netReply,
        emotion: 'confused',
        expressions: [{ type: 'confused', intensity: 0.5 }],
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errBody = await response.text();
    let errorDetail = errBody;
    try {
      const parsedErr = JSON.parse(errBody);
      if (parsedErr.error?.message) {
        errorDetail = parsedErr.error.message;
      }
    } catch {
      // ignore
    }
    if (response.status === 429) {
      const rateLimitReply = 'Layanan AI sedang menerima terlalu banyak permintaan (Rate Limit). Mohon tunggu beberapa detik sebelum bertanya kembali.';
      return {
        reply: rateLimitReply,
        emotion: 'confused',
        metadata: {
          text: rateLimitReply,
          emotion: 'confused',
          expressions: [{ type: 'confused', intensity: 0.5 }],
        },
      };
    }
    throw new Error(`OpenRouter Error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const choice = data.choices?.[0];
  if (!choice) {
    console.error('OpenRouter empty choice response payload:', data);
    throw new Error('Respon kosong dari OpenRouter. Silakan periksa status model atau API key Anda.');
  }

  const message = choice.message;
  let detectedEmotion: CharacterEmotion | null = null;

  // 1. Check for official Function / Tool Calling from LLM
  if (message.tool_calls && Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.function?.name === 'set_avatar_emotion') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          if (args.emotion) {
            detectedEmotion = normalizeEmotion(args.emotion);
            break;
          }
        } catch {
          // ignore json parse error
        }
      }
    }
  }

  // 2. Extract reply content
  let textReply = message.content || '';

  // If content is empty but reasoning is present
  if (!textReply.trim() && message.reasoning) {
    textReply = message.reasoning;
  }

  if (!textReply.trim() && detectedEmotion) {
    textReply = 'Saya mendengarkan dan siap membantu Anda!';
  }

  // 3. Parse JSON or inline tags
  const parsed = parseAiContent(textReply);

  return {
    reply: parsed.reply,
    emotion: detectedEmotion || parsed.emotion,
    shortcuts: parsed.shortcuts,
    citations: ragResults,
    metadata: parsed.metadata,
  };
}

function normalizeEmotion(raw: string): CharacterEmotion {
  const validEmotions: CharacterEmotion[] = [
    'normal',
    'happy',
    'sad',
    'angry',
    'surprised',
    'confused',
    'thinking',
    'listening',
    'speaking',
  ];
  const cleaned = raw.toLowerCase().trim();
  if (validEmotions.includes(cleaned as CharacterEmotion)) {
    return cleaned as CharacterEmotion;
  }
  if (cleaned.includes('surpris')) return 'surprised';
  if (cleaned.includes('happy') || cleaned.includes('playful') || cleaned.includes('cheerful') || cleaned.includes('excit')) return 'happy';
  if (cleaned.includes('sad') || cleaned.includes('grief')) return 'sad';
  if (cleaned.includes('angr')) return 'angry';
  if (cleaned.includes('confus')) return 'confused';
  if (cleaned.includes('think')) return 'thinking';
  return 'normal';
}

export function extractShortcuts(text: string, existingShortcuts?: AiShortcut[]): AiShortcut[] {
  if (Array.isArray(existingShortcuts) && existingShortcuts.length > 0) {
    return existingShortcuts.map((sc) => {
      const rawRoute = sc.route || sc.path || '';
      const normalized = rawRoute.startsWith('/dashboard')
        ? rawRoute
        : `/dashboard${rawRoute.startsWith('/') ? '' : '/'}${rawRoute}`;
      return {
        ...sc,
        route: normalized,
        path: normalized,
      };
    });
  }

  const shortcuts: AiShortcut[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('impossible travel') || lower.includes('geospasial') || lower.includes('kartu pinjam') || lower.includes('mobilitas')) {
    shortcuts.push({
      label: 'Buka Modus Impossible Travel',
      path: '/dashboard/identity-risk',
      route: '/dashboard/identity-risk',
      description: 'Audit geospasial & biologi',
    });
  }
  if (lower.includes('doctor shopping') || lower.includes('dsi') || lower.includes('fktp berulang') || lower.includes('pelayanan berlebih')) {
    shortcuts.push({
      label: 'Periksa Doctor Shopping (DSI)',
      path: '/dashboard/unnecessary-services',
      route: '/dashboard/unnecessary-services',
      description: 'Deteksi kunjungan ganda',
    });
  }
  if (lower.includes('alkes') || lower.includes('kacamata') || lower.includes('prb') || lower.includes('resep') || lower.includes('obat kronis')) {
    shortcuts.push({
      label: 'Tinjau Resep & Alkes',
      path: '/dashboard/pharmacy-alkes',
      route: '/dashboard/pharmacy-alkes',
      description: 'Audit batas waktu klaim',
    });
  }
  if (lower.includes('permenkes') || lower.includes('regulasi') || lower.includes('uu 27') || lower.includes('pasal') || lower.includes('hukum') || lower.includes('sanksi')) {
    shortcuts.push({
      label: 'Dasar Hukum & Regulasi JKN',
      path: '/dashboard/regulations',
      route: '/dashboard/regulations',
      description: 'Permenkes 16/2019 & UU PDP',
    });
  }
  if (lower.includes('kasus') || lower.includes('benchmark') || lower.includes('pembuktian') || lower.includes('studi kasus')) {
    shortcuts.push({
      label: '4 Kasus Benchmark Terbukti',
      path: '/dashboard/cases',
      route: '/dashboard/cases',
      description: 'Detail audit forensik',
    });
  }
  if (lower.includes('transaksi') || lower.includes('aliran') || lower.includes('live stream') || lower.includes('sep')) {
    shortcuts.push({
      label: 'Pantau Aliran Transaksi',
      path: '/dashboard/transactions',
      route: '/dashboard/transactions',
      description: 'Monitoring live real-time',
    });
  }

  return shortcuts.slice(0, 3);
}

function parseAiContent(raw: string): {
  reply: string;
  emotion: CharacterEmotion;
  shortcuts?: AiShortcut[];
  metadata?: VoiceExpressionMetadata;
} {
  let detectedEmotion: CharacterEmotion | null = null;
  let cleanedText = raw.trim();

  // Strip wrapping markdown code blocks if present
  cleanedText = cleanedText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Tag match [happy], [sad], etc.
  const tagMatch = cleanedText.match(/^\[(normal|happy|sad|angry|surprised|confused|thinking)\]\s*/i);
  if (tagMatch) {
    detectedEmotion = normalizeEmotion(tagMatch[1]);
    cleanedText = cleanedText.slice(tagMatch[0].length).trim();
  }

  // 1. Try standard JSON.parse if complete JSON object is found
  try {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const replyContent = parsed.text || parsed.reply;
      if (replyContent && typeof replyContent === 'string') {
        const emo = detectedEmotion || (parsed.emotion ? normalizeEmotion(parsed.emotion) : 'normal');
        const shortcuts = extractShortcuts(replyContent, parsed.shortcuts);
        const metadata: VoiceExpressionMetadata = {
          text: cleanTtsText(replyContent),
          emotion: emo,
          expressions: Array.isArray(parsed.expressions) ? parsed.expressions : [{ type: emo, intensity: 0.6 }],
          emphasis: Array.isArray(parsed.emphasis) ? parsed.emphasis : [],
          pauses: Array.isArray(parsed.pauses) ? parsed.pauses : [],
          prosody: parsed.prosody && typeof parsed.prosody === 'object' ? parsed.prosody : { energy: 0.8, pitch: 1.0, speed: 1.0 },
        };
        return {
          reply: replyContent, // Pertahankan format Markdown lengkap untuk tampilan ChatGPT
          emotion: emo,
          shortcuts,
          metadata,
        };
      }
    }
  } catch {
    // JSON syntax error or truncated JSON — proceed to resilient regex extraction below
  }

  // 2. Resilient regex extraction for complete OR truncated "text" / "reply"
  let extractedText: string | null = null;
  const completeTextMatch = cleanedText.match(/"(?:text|reply)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (completeTextMatch) {
    extractedText = completeTextMatch[1];
  } else {
    // Truncated string: "text": "starts here but gets cut off without closing quote
    const truncatedTextMatch = cleanedText.match(/"(?:text|reply)"\s*:\s*"((?:[^"\\]|\\.)*)$/);
    if (truncatedTextMatch) {
      extractedText = truncatedTextMatch[1];
    }
  }

  // Extract emotion from JSON if present
  if (!detectedEmotion) {
    const emoMatch = cleanedText.match(/"emotion"\s*:\s*"([^"]+)"/i);
    if (emoMatch) {
      detectedEmotion = normalizeEmotion(emoMatch[1]);
    }
  }

  if (extractedText) {
    // Decode escaped characters
    extractedText = extractedText
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');

    const emo = detectedEmotion || 'normal';
    const shortcuts = extractShortcuts(extractedText);
    return {
      reply: extractedText,
      emotion: emo,
      shortcuts,
      metadata: {
        text: cleanTtsText(extractedText),
        emotion: emo,
        expressions: [{ type: emo, intensity: 0.5 }],
        prosody: { energy: 0.8, pitch: 1.0, speed: 1.0 },
      },
    };
  }

  // 3. Absolute fallback: strip any remaining JSON syntax, braces, quotes, keys
  let fallbackReply = cleanedText
    .replace(/^\{?\s*"(?:text|reply)"\s*:\s*"?/i, '')
    .replace(/",\s*"(?:emotion|expressions|pauses|prosody|shortcuts)"[\s\S]*$/i, '')
    .trim();

  if (!detectedEmotion) {
    const lower = fallbackReply.toLowerCase();
    if (lower.includes('senang') || lower.includes('halo') || lower.includes('selamat') || lower.includes('terima kasih')) {
      detectedEmotion = 'happy';
    } else if (lower.includes('maaf') || lower.includes('sayang sekali') || lower.includes('gejala') || lower.includes('sakit')) {
      detectedEmotion = 'sad';
    } else if (lower.includes('wah') || lower.includes('hebat') || lower.includes('luar biasa') || lower.includes('astaga')) {
      detectedEmotion = 'surprised';
    } else if (lower.includes('bingung') || lower.includes('kurang jelas') || lower.includes('maksudnya')) {
      detectedEmotion = 'confused';
    } else {
      detectedEmotion = 'normal';
    }
  }

  const shortcuts = extractShortcuts(fallbackReply);

  return {
    reply: fallbackReply,
    emotion: detectedEmotion,
    shortcuts,
    metadata: {
      text: cleanTtsText(fallbackReply),
      emotion: detectedEmotion,
      expressions: [{ type: detectedEmotion, intensity: 0.5 }],
      prosody: { energy: 0.8, pitch: 1.0, speed: 1.0 },
    },
  };
}

/**
 * Clean any accidental asterisks, hashes, or bullet points from AI response
 * to ensure smooth, natural reading on ElevenLabs and Web Speech.
 */
function cleanTtsText(text: string): string {
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // remove bold/italic asterisks
    .replace(/^#+\s+/gm, '') // remove markdown headings
    .replace(/^[-*•]\s+/gm, '') // remove list bullets
    .replace(/\s+/g, ' ')
    .trim();
}
