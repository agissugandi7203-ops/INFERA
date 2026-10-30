import {
  DEFAULT_OPENAI_REALTIME_MODEL,
  DEFAULT_REALTIME_VOICE,
  INFERA_TOOL_DEFINITIONS,
  getTemporalAnchorContext,
  type RealtimeSessionRequestDTO,
  type RealtimeSessionResponseDTO,
  type RealtimeVoiceName,
} from '@healthathon/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

const OPENAI_REALTIME_SESSION_URL = 'https://api.openai.com/v1/realtime/client_secrets';
const OPENAI_LIVE_SESSION_URL = 'https://api.openai.com/v1/live/sessions';
const UPSTREAM_TIMEOUT_MS = 15_000;

export const VALID_REALTIME_VOICES = new Set([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
]);

export function getFeraRealtimeInstructions(): string {
  const temporal = getTemporalAnchorContext();
  return `
${temporal.formattedInstruction}

Identitas & Peran:
Anda adalah FERA (Forensic & Evidence Reasoning Agent), asisten kecerdasan buatan dan analis forensik cerdas dari INFERA untuk BPJS Kesehatan pada ajang HealthAthon BPJS Kesehatan 2026 (Track: Efisiensi Risiko pada Peserta).

Karakter & Gaya Komunikasi (Natural, Dewasa, Cerdas, Jelas):
- Kepribadian: Analis wanita dewasa yang cerdas, ramah, santun, percaya diri, dan profesional. Terdengar berwibawa, tegas, hangat, dan sigap membantu.
- Vokal & Artikulasi:
  * Gunakan intonasi suara wanita dewasa yang mantap, berbobot, lantang, dan jelas (artikulasi prima).
  * HINDARI NADA CEMPRENG, MANJA, ATAU KEKANAK-KANAKAN. Dilarang menggunakan suara seperti anak kecil, desahan, atau intonasi kartun. Bicaralah secara profesional dan natural layaknya auditor resmi BPJS Kesehatan.
- Bahasa: Bahasa Indonesia yang fasih, baku namun luwes, dan mudah dipahami.
- Gaya Bicara Lisan:
  * Jawab secara ringkas dan padat (maksimal 2 kalimat per giliran bicara) agar percakapan dua arah berjalan cepat dan interaktif.
  * Jangan mengeja karakter markdown seperti tanda bintang tebal, pagar, atau tabel secara lisan.

Domain Pengetahuan 4 Modus Fraud Peserta:
1. Modus 1: Pemalsuan Data/Identitas (Diskordansi Biologis Mutlak, misal klaim persalinan seksio sesarea O82.0 pada pasien pria).
2. Modus 2: Peminjaman Kartu Peserta (Impossible Travel Velocity, kecepatan perpindahan fisik antar-faskes > 100 km/jam).
3. Modus 3: Pelayanan Tidak Perlu & Doctor Shopping (Indeks DSI >= 0.5, keluhan sama di banyak faskes dalam tempo < 7 hari).
4. Modus 4: Penyalahgunaan Obat PRB & Alkes (Rasio POR > 140% obat kronis PRB atau pelanggaran masa tunggu kacamata 2 tahun / alkes 5 tahun).

Etika Human-in-the-Loop & Governed Actions:
- Anda TIDAK boleh mengeksekusi penangguhan kartu atau sanksi secara mandiri tanpa persetujuan manusia.
- Selalu ajukan usulan melalui tool rekomendasi tindakan (seperti propose_participant_suspension, propose_warning_letter, propose_case_review) agar auditor manusia dapat meninjau dan menyetujuinya di dashboard.
`.trim();
}

export const FERA_REALTIME_INSTRUCTIONS = getFeraRealtimeInstructions();
export const LUNA_REALTIME_INSTRUCTIONS = FERA_REALTIME_INSTRUCTIONS;

export class OpenAiRealtimeService {
  public static async createSession(
    request: RealtimeSessionRequestDTO = {}
  ): Promise<RealtimeSessionResponseDTO> {
    const apiKey = env.OPENAI_API_KEY?.trim();

    if (!apiKey || apiKey.length < 5) {
      throw new AppError(
        'Layanan OpenAI Realtime belum dikonfigurasi di server. Pastikan OPENAI_API_KEY telah diatur di Environment Variables Vercel.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    const model = request.model || DEFAULT_OPENAI_REALTIME_MODEL;

    const rawVoice = (request.voice || DEFAULT_REALTIME_VOICE).toLowerCase().trim();
    let voice: RealtimeVoiceName = 'coral';
    if (VALID_REALTIME_VOICES.has(rawVoice)) {
      voice = rawVoice as RealtimeVoiceName;
    } else if (rawVoice.includes('luna') || rawVoice.includes('cute')) {
      voice = 'shimmer';
    } else {
      voice = 'coral';
    }

    // Realtime API requires flat function tool definitions (name, description, parameters at top level)
    const realtimeTools = INFERA_TOOL_DEFINITIONS.map((t) => ({
      type: 'function' as const,
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    }));

    const payload = {
      session: {
        type: 'realtime',
        model: request.model || 'gpt-realtime',
        instructions: getFeraRealtimeInstructions(),
        audio: {
          input: {
            transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 350,
              create_response: true,
              interrupt_response: true,
            },
          },
          output: {
            voice,
          },
        },
        tools: realtimeTools,
        tool_choice: 'auto',
      },
    };

    try {
      const response = await fetch(OPENAI_REALTIME_SESSION_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error(`[OpenAiRealtime] Upstream error (${response.status}):`, errorBody);
        throw new AppError(
          `Gagal membuat sesi WebRTC OpenAI (${response.status}). Pastikan API Key valid dan memiliki akses Realtime API.`,
          response.status === 401 || response.status === 403 ? 403 : 502,
          'SERVICE_UNAVAILABLE'
        );
      }

      const data = (await response.json()) as {
        value?: string;
        expires_at?: number;
        session?: {
          id: string;
          model: string;
          audio?: {
            output?: {
              voice?: string;
            };
          };
        };
      };

      if (!data.value) {
        throw new AppError(
          'OpenAI tidak mengembalikan ephemeral client secret.',
          502,
          'SERVICE_UNAVAILABLE'
        );
      }

      return {
        sessionId: data.session?.id || 'sess_' + Date.now(),
        clientSecret: data.value,
        expiresAt: data.expires_at || Math.floor(Date.now() / 1000) + 60,
        model: data.session?.model || model,
        voice: (data.session?.audio?.output?.voice as RealtimeVoiceName) || voice,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[OpenAiRealtime] Request failed:', errorMsg);
      throw new AppError(
        `Koneksi ke gateway OpenAI Realtime gagal: ${errorMsg}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  }

  /**
   * Exchanges WebRTC SDP offer directly with OpenAI Live Sessions API (gpt-live-1),
   * natively powering the custom anime voice (voice_6ae35f4fc2388191a0b2f21060b4e417)
   */
  public static async exchangeLiveSdp(
    sdp: string,
    requestedVoice?: string
  ): Promise<{ sessionId: string; sdp: string; voice: string }> {
    const apiKey = env.OPENAI_API_KEY?.trim();

    if (!apiKey || apiKey.length < 5) {
      throw new AppError(
        'Layanan OpenAI Live Session belum dikonfigurasi di server. Pastikan OPENAI_API_KEY telah diatur.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    const cleanVoice = (requestedVoice || 'coral').trim().toLowerCase();
    const voiceParam = cleanVoice.startsWith('voice_')
      ? { id: cleanVoice }
      : VALID_REALTIME_VOICES.has(cleanVoice)
        ? cleanVoice
        : 'coral';

    const payload = {
      session: {
        model: 'gpt-live-1',
        instructions: getFeraRealtimeInstructions(),
        audio: {
          output: {
            voice: voiceParam,
          },
        },
      },
      transport: {
        type: 'webrtc',
        sdp,
      },
    };

    try {
      const response = await fetch(OPENAI_LIVE_SESSION_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error(`[OpenAiLiveSession] Upstream error (${response.status}):`, errorBody);
        throw new AppError(
          `Gagal membuat sesi Live WebRTC OpenAI (${response.status}): ${errorBody.slice(0, 300)}`,
          response.status === 400 ? 400 : response.status === 401 || response.status === 403 ? 403 : 502,
          response.status === 400 ? 'VALIDATION_ERROR' : 'SERVICE_UNAVAILABLE'
        );
      }

      const data = (await response.json()) as {
        session?: { id: string };
        transport?: { type: string; sdp: string };
      };

      if (!data.transport?.sdp) {
        throw new AppError('OpenAI tidak mengembalikan SDP answer transport.', 502, 'SERVICE_UNAVAILABLE');
      }

      return {
        sessionId: data.session?.id || 'live_' + Date.now(),
        sdp: data.transport.sdp,
        voice: typeof voiceParam === 'string' ? voiceParam : cleanVoice,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[OpenAiLiveSession] Request failed:', errorMsg);
      throw new AppError(`Koneksi WebRTC OpenAI Live gagal: ${errorMsg}`, 500, 'INTERNAL_SERVER_ERROR');
    }
  }
}
