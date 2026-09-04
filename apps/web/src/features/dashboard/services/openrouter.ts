import { CharacterEmotion } from '../avatar/AvatarController';
import {
  VOICE_DEFAULT_ID,
  VOICE_SECONDARY_ID,
  VoiceExpressionMetadata,
} from './tts-processor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: CharacterEmotion;
  timestamp: string;
}

export interface OpenRouterSettings {
  apiKey: string;
  model: string;
  useBackendProxy: boolean;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  character: string;
  description: string;
  tier: 'free' | 'paid';
}

export const ANIME_VOICE_PRESETS: VoicePreset[] = [
  {
    id: VOICE_DEFAULT_ID,
    name: 'Vera',
    character: 'Vera — Suara Default (Hangat & Santun)',
    description: 'Karakter suara utama asisten virtual BPJS Kesehatan. Hangat, bersahabat, dan jelas.',
    tier: 'free',
  },
  {
    id: VOICE_SECONDARY_ID,
    name: 'Luna',
    character: 'Luna — Suara Kedua (Ceria & Manis)',
    description: 'Karakter suara kedua asisten virtual BPJS Kesehatan. Ceria, ekspresif, dan dinamis.',
    tier: 'free',
  },
];

export const DEFAULT_SETTINGS: OpenRouterSettings = {
  apiKey: (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '',
  model: (import.meta.env.VITE_DEFAULT_MODEL as string) || 'openai/gpt-oss-120b:nitro',
  useBackendProxy: false,
  elevenLabsApiKey: (import.meta.env.VITE_ELEVENLABS_API_KEY as string) || '',
  elevenLabsVoiceId: (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string) || VOICE_DEFAULT_ID,
};

const STORAGE_SETTINGS_KEY = 'healthathon_openrouter_settings';
const STORAGE_HISTORY_KEY = 'healthathon_avatar_chat_history';

export function getStoredSettings(): OpenRouterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    
    // Only allow either VOICE_DEFAULT_ID or VOICE_SECONDARY_ID, defaulting to VOICE_DEFAULT_ID
    let voiceId = parsed.elevenLabsVoiceId;
    if (voiceId !== VOICE_DEFAULT_ID && voiceId !== VOICE_SECONDARY_ID) {
      voiceId = VOICE_DEFAULT_ID;
    }

    return {
      apiKey: parsed.apiKey || DEFAULT_SETTINGS.apiKey,
      model: parsed.model || DEFAULT_SETTINGS.model,
      useBackendProxy: parsed.useBackendProxy ?? DEFAULT_SETTINGS.useBackendProxy,
      elevenLabsApiKey: parsed.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey,
      elevenLabsVoiceId: voiceId,
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

const SYSTEM_PROMPT = `Kamu adalah asisten suara BPJS Kesehatan berkarakter anime 2D yang cerdas, ramah, dan santun.

Aturan Respon:
1. Format WAJIB HANYA 1 objek JSON valid (Dilarang menggunakan pembungkus markdown \`\`\`json).
2. Jawaban lisan ("text") harus padat, jelas, alami, dan ringkas (2-4 kalimat percakapan santun; dilarang bullet, pagar, bintang, atau tabel).
3. Respon wajib tuntas.

Format JSON:
{
  "text": "Jawaban percakapan santun, ramah, dan ringkas.",
  "emotion": "normal" | "happy" | "sad" | "angry" | "surprised" | "confused" | "thinking",
  "expressions": [{"type": "happy", "intensity": 0.6}],
  "emphasis": [{"text": "kata kunci", "intensity": 0.7}],
  "pauses": [{"after": "kata", "duration_ms": 250}],
  "prosody": {"energy": 0.8, "speed": 1.0}
}`;

export async function sendOpenRouterChat(
  userText: string,
  history: ChatMessage[],
  settings: OpenRouterSettings
): Promise<{ reply: string; emotion: CharacterEmotion; metadata?: VoiceExpressionMetadata }> {
  // If useBackendProxy is true or no direct key provided, try backend
  if (settings.useBackendProxy || (!settings.apiKey && import.meta.env.VITE_API_URL)) {
    try {
      const messages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userText },
      ];

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: settings.model || 'openai/gpt-oss-120b:nitro',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.message?.content) {
          return parseAiContent(json.data.message.content);
        }
      }
    } catch (err) {
      console.warn('Backend OpenRouter proxy unavailable, falling back to direct API:', err);
    }
  }

  // Direct OpenRouter Client
  const apiKey = settings.apiKey.trim();
  if (!apiKey) {
    const defaultMsg = 'Halo! Saya asisten avatar AI Anda. Silakan masukkan OpenRouter API Key Anda pada panel pengaturan agar saya dapat berpikir menggunakan model AI langsung!';
    return {
      reply: defaultMsg,
      emotion: 'happy',
      metadata: {
        text: defaultMsg,
        emotion: 'happy',
        expressions: [{ type: 'happy', intensity: 0.6 }],
        prosody: { energy: 0.8, pitch: 1.0, speed: 1.0 },
      },
    };
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userText },
  ];

  const targetModel = settings.model || 'openai/gpt-oss-120b:nitro';

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
        'X-Title': 'HealthAthon BPJS Avatar Assistant',
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

function parseAiContent(raw: string): {
  reply: string;
  emotion: CharacterEmotion;
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
        const metadata: VoiceExpressionMetadata = {
          text: cleanTtsText(replyContent),
          emotion: emo,
          expressions: Array.isArray(parsed.expressions) ? parsed.expressions : [{ type: emo, intensity: 0.6 }],
          emphasis: Array.isArray(parsed.emphasis) ? parsed.emphasis : [],
          pauses: Array.isArray(parsed.pauses) ? parsed.pauses : [],
          prosody: parsed.prosody && typeof parsed.prosody === 'object' ? parsed.prosody : { energy: 0.8, pitch: 1.0, speed: 1.0 },
        };
        return {
          reply: metadata.text,
          emotion: emo,
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
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .replace(/\\\\/g, '\\');

    const cleanReply = cleanTtsText(extractedText);
    const emo = detectedEmotion || 'normal';
    return {
      reply: cleanReply,
      emotion: emo,
      metadata: {
        text: cleanReply,
        emotion: emo,
        expressions: [{ type: emo, intensity: 0.5 }],
        prosody: { energy: 0.8, pitch: 1.0, speed: 1.0 },
      },
    };
  }

  // 3. Absolute fallback: strip any remaining JSON syntax, braces, quotes, keys
  let fallbackReply = cleanedText
    .replace(/^\{?\s*"(?:text|reply)"\s*:\s*"?/i, '')
    .replace(/",\s*"(?:emotion|expressions|pauses|prosody)"[\s\S]*$/i, '')
    .replace(/[{}"\\]/g, '')
    .trim();

  fallbackReply = cleanTtsText(fallbackReply);

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

  return {
    reply: fallbackReply,
    emotion: detectedEmotion,
    metadata: {
      text: fallbackReply,
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
