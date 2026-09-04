import { CharacterEmotion } from '../avatar/AvatarController';

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

export const DEFAULT_SETTINGS: OpenRouterSettings = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY as string || '',
  model: (import.meta.env.VITE_DEFAULT_MODEL as string) || 'openai/gpt-oss-120b:nitro',
  useBackendProxy: false,
  elevenLabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY as string || '',
  elevenLabsVoiceId: (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string) || 'A4AyGcPAjb1pHgflyZZp',
};

const STORAGE_SETTINGS_KEY = 'healthathon_openrouter_settings';
const STORAGE_HISTORY_KEY = 'healthathon_avatar_chat_history';

export function getStoredSettings(): OpenRouterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey || DEFAULT_SETTINGS.apiKey,
      model: parsed.model || DEFAULT_SETTINGS.model,
      useBackendProxy: parsed.useBackendProxy ?? DEFAULT_SETTINGS.useBackendProxy,
      elevenLabsApiKey: parsed.elevenLabsApiKey || DEFAULT_SETTINGS.elevenLabsApiKey,
      elevenLabsVoiceId: parsed.elevenLabsVoiceId || DEFAULT_SETTINGS.elevenLabsVoiceId,
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

const SYSTEM_PROMPT = `Kamu adalah asisten virtual BPJS Kesehatan interaktif dengan visual avatar anime 2D yang ramah, santun, cerdas, dan suportif.

INSTRUKSI KHUSUS VOICE GENERATION (ELEVENLABS):
Jawabanmu WAJIB dioptimalkan agar sangat merdu, hidup, dan alami saat dibacakan oleh model suara ElevenLabs (Voice ID: A4AyGcPAjb1pHgflyZZp).
1. Gunakan bahasa Indonesia percakapan yang hangat, mengalir seperti manusia berbicara langsung.
2. Gunakan tanda baca koma (,) dan titik (.) pada tempat yang tepat untuk memberikan jeda nafas dan intonasi yang pas.
3. DILARANG menggunakan tanda bintang (*), DILARANG menggunakan tanda pagar (#), DILARANG menggunakan bullet points (• atau -), dan DILARANG menggunakan format tabel. Tulis seluruh penjelasan dalam kalimat narasi percakapan yang utuh.
4. Format respon WAJIB berupa JSON tunggal:
{
  "reply": "Isi percakapan yang ramah dan mengalir alami tanpa markdown.",
  "emotion": "normal" | "happy" | "sad" | "angry" | "surprised" | "confused" | "thinking"
}

Panduan emosi:
- "happy": Menyapa hangat, mendengar kabar baik, bercanda santai, atau memberi semangat.
- "sad": Mendengar keluhan sakit, musibah, atau rasa sedih pengguna.
- "angry": Mengingatkan peringatan keras atas bahaya penipuan atau penyalahgunaan.
- "surprised": Mendengar kabar luar biasa atau hal mengejutkan.
- "confused": Pertanyaan membingungkan atau topik kurang jelas.
- "thinking": Menganalisis diagnosa, merumuskan rujukan medis, atau berhitung.
- "normal": Penjelasan informatif, tenang, dan bersahabat.`;

export async function sendOpenRouterChat(
  userText: string,
  history: ChatMessage[],
  settings: OpenRouterSettings
): Promise<{ reply: string; emotion: CharacterEmotion }> {
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
    return {
      reply:
        'Halo! Saya asisten avatar AI Anda. Silakan masukkan OpenRouter API Key Anda pada panel pengaturan agar saya dapat berpikir menggunakan model AI langsung!',
      emotion: 'happy',
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
    max_tokens: 600,
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
      return {
        reply: 'Maaf, server AI memerlukan waktu lebih lama dari biasanya untuk merespons. Silakan ulangi pertanyaan Anda.',
        emotion: 'confused',
      };
    }
    return {
      reply: 'Koneksi ke layanan AI terganggu. Silakan periksa jaringan internet Anda atau coba beberapa saat lagi.',
      emotion: 'confused',
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
      return {
        reply: 'Layanan AI sedang menerima terlalu banyak permintaan (Rate Limit). Mohon tunggu beberapa detik sebelum bertanya kembali.',
        emotion: 'confused',
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
  return validEmotions.includes(cleaned as CharacterEmotion) ? (cleaned as CharacterEmotion) : 'normal';
}

function parseAiContent(raw: string): { reply: string; emotion: CharacterEmotion } {
  let detectedEmotion: CharacterEmotion | null = null;

  // Tag match [happy], [sad], etc.
  const tagMatch = raw.match(/^\[(normal|happy|sad|angry|surprised|confused|thinking)\]\s*/i);
  let cleanedText = raw;
  if (tagMatch) {
    detectedEmotion = normalizeEmotion(tagMatch[1]);
    cleanedText = raw.slice(tagMatch[0].length);
  }

  try {
    const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.reply) {
        return {
          reply: cleanTtsText(parsed.reply),
          emotion: detectedEmotion || (parsed.emotion ? normalizeEmotion(parsed.emotion) : 'normal'),
        };
      }
    }
  } catch {
    // Fallback
  }

  // Keyword heuristic fallback
  if (!detectedEmotion) {
    const lower = cleanedText.toLowerCase();
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
    reply: cleanTtsText(cleanedText.replace(/```json/g, '').replace(/```/g, '').trim()),
    emotion: detectedEmotion,
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
