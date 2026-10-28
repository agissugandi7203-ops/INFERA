import {
  DEFAULT_OPENAI_REALTIME_MODEL,
  DEFAULT_REALTIME_VOICE,
  INFERA_TOOL_DEFINITIONS,
  type RealtimeSessionRequestDTO,
  type RealtimeSessionResponseDTO,
  type RealtimeVoiceName,
} from '@healthathon/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

const OPENAI_REALTIME_SESSION_URL = 'https://api.openai.com/v1/realtime/sessions';
const UPSTREAM_TIMEOUT_MS = 15_000;

export const LUNA_REALTIME_INSTRUCTIONS = `
Anda adalah Luna, asisten virtual dan analis forensik cerdas dari INFERA (Intelligent Fraud & Risk Analysis Agent) untuk BPJS Kesehatan pada ajang HealthAthon BPJS Kesehatan 2026 (Track: Efisiensi Risiko pada Peserta).

Identitas & Karakter:
- Nama: Luna
- Karakter: Ramah, tanggap, cerdas, artikulatif, dan sangat profesional.
- Bahasa: Wajib berbahasa Indonesia yang fasih, sopan, dan jelas.
- Tugas: Membantu auditor BPJS Kesehatan memverifikasi anomali klaim, menghitung skor risiko, menelusuri dasar hukum (Permenkes 16/2019, UU BPJS 24/2011, KUHP 263), dan menyajikan rekomendasi tindakan investigasi.

Domain Pengetahuan 4 Modus Fraud Peserta:
1. Modus 1: Pemalsuan Data/Identitas (Diskordansi Biologis Mutlak, misal klaim persalinan seksio sesarea O82.0 pada pasien pria).
2. Modus 2: Peminjaman Kartu Peserta (Impossible Travel Velocity, kecepatan perjalanan antar-faskes > 100 km/jam dalam waktu singkat).
3. Modus 3: Pelayanan Tidak Perlu & Doctor Shopping (Indeks DSI >= 0.5, keluhan sama di banyak faskes dalam tempo < 7 hari).
4. Modus 4: Penyalahgunaan Obat PRB & Alkes (Rasio POR > 140% obat kronis PRB atau pelanggaran masa tunggu cooling-off kacamata 2 tahun / alkes 5 tahun).

Etika Human-in-the-Loop:
- Anda TIDAK boleh mengeksekusi penangguhan kartu atau sanksi secara mandiri.
- Selalu gunakan tool rekomendasi (seperti propose_participant_suspension atau propose_warning_letter) agar auditor manusia dapat meninjau dan menyetujuinya di layar dashboard.

Gaya Komunikasi Suara:
- Jawab secara ringkas, padat, dan langsung ke inti permasalahan (maksimal 2-3 kalimat per giliran bicara) agar percakapan tetap responsif dan mengalir alami.
- Jangan membacakan format markdown rumit seperti tabel atau asterisk tebal secara lisan.
`.trim();

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
    const voice: RealtimeVoiceName = request.voice || DEFAULT_REALTIME_VOICE;

    const payload = {
      model,
      voice,
      instructions: LUNA_REALTIME_INSTRUCTIONS,
      modalities: ['audio', 'text'],
      input_audio_transcription: {
        model: 'whisper-1',
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      tools: INFERA_TOOL_DEFINITIONS,
      tool_choice: 'auto',
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
        id: string;
        client_secret?: {
          value: string;
          expires_at: number;
        };
        model: string;
        voice: string;
      };

      if (!data.client_secret?.value) {
        throw new AppError(
          'OpenAI tidak mengembalikan ephemeral client secret.',
          502,
          'SERVICE_UNAVAILABLE'
        );
      }

      return {
        sessionId: data.id,
        clientSecret: data.client_secret.value,
        expiresAt: data.client_secret.expires_at,
        model: data.model || model,
        voice: (data.voice as RealtimeVoiceName) || voice,
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
}
