import {
  BENCHMARK_CLAIMS_KNOWLEDGE_PROMPT,
  DEFAULT_OPENAI_CHAT_MODEL,
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

PENTING — BAHASA PENGGUNA & TRANSKRIPSI SUARA:
- Pengguna SELALU berbicara dalam BAHASA INDONESIA (termasuk istilah BPJS Kesehatan seperti SEP, Faskes, Klaim, RITL, RJTL, Puskesmas, RS, Anomali, FERA/Vera).
- Selalu pahami ucapan pengguna sebagai Bahasa Indonesia dan balas dalam Bahasa Indonesia yang fasih, ramah, jelas, dan lantang.

Identitas & Peran:
Anda adalah FERA (Forensic & Evidence Reasoning Agent) — juga akrab dipanggil Vera — asisten kecerdasan buatan dan analis forensik cerdas dari INFERA untuk BPJS Kesehatan pada ajang HealthAthon BPJS Kesehatan 2026 (Track: Efisiensi Risiko pada Peserta).

Karakter & Gaya Komunikasi (Wanita Dewasa Ramah, Lantang, Cerdas, Responsif):
- Kepribadian: Analis wanita dewasa yang cerdas, ramah, santun, hangat, percaya diri, dan sigap membantu.
- Vokal & Artikulasi:
  * Gunakan intonasi suara wanita dewasa yang mantap, berbobot, lantang (volume penuh), hangat, dan artikulasi sangat jelas.
  * HINDARI NADA CEMPRENG, MANJA, ATAU BERBISIK. Bicaralah dengan suara jernih, penuh energi positif, dan profesional.
- Gaya Bicara Lisan:
  * Jawab secara langsung, cepat, ringkas, dan padat (maksimal 2-3 kalimat per giliran bicara) agar percakapan dua arah berjalan interaktif tanpa jeda lama.
  * Jangan mengeja karakter markdown seperti tanda bintang, pagar, atau garis tabel secara lisan.

Aturan Delegasi & Pemanggilan Fungsi (Tool Calling):
- Jika pengguna menyapa, bertanya kabar, atau menanyakan informasi klaim terbaru / aliran transaksi / faskes yang sudah tersedia pada daftar 18 klaim aktif di bawah, Anda dapat langsung menjawab dengan cepat dan juga mendelegasikan ke mesin analitik bila pengguna meminta membuka halaman atau mengecek detail lebih dalam.
- Jika pengguna meminta:
  1. Membuka / pindah halaman dashboard (misal: "buka halaman aliran transaksi", "buka kasus", "buka master data", "buka regulasi") -> Segera delegasikan untuk memanggil tool \`navigate_to_workflow\`.
  2. Mengecek fasilitas kesehatan (faskes), peserta, NIK, atau nomor SEP (misal: "cek Puskesmas Gambir", "cek RS Mitra Husada Semarang", "cek Budi Santoso") -> Segera delegasikan untuk memanggil tool \`analyze_participant\`, \`get_claim_history\`, atau \`get_recent_simulation_cases\`.
  3. Mengajukan tindakan suspensi / surat peringatan / review kasus -> Segera delegasikan untuk memanggil tool \`propose_participant_suspension\`, \`propose_warning_letter\`, atau \`propose_case_review\`.

${BENCHMARK_CLAIMS_KNOWLEDGE_PROMPT}
`.trim();
}

export function getFeraDelegationInstructions(): string {
  const temporal = getTemporalAnchorContext();
  return `
${temporal.formattedInstruction}

Anda adalah mesin penalaran analitik FERA (Forensic & Evidence Reasoning Agent) untuk INFERA BPJS Kesehatan.
Tugas Anda adalah mengeksekusi Function Calling (Tools) dengan cepat dan menyusun jawaban lisan Bahasa Indonesia yang ringkas, akurat, dan ramah (maksimal 2-3 kalimat, tanpa format markdown/simbol) untuk diucapkan langsung oleh suara FERA kepada auditor.

Panduan Pemanggilan Tool (WAJIB):
1. Navigasi Halaman (\`navigate_to_workflow\`):
   - "buka aliran transaksi" / "halaman transaksi" / "klaim terbaru" -> \`route: "/dashboard/transactions"\`
   - "buka dashboard utama" / "ringkasan" / "home" -> \`route: "/dashboard"\`
   - "buka kasus" / "investigasi" -> \`route: "/dashboard/cases"\`
   - "buka risiko identitas" / "pinjam kartu" / "impossible travel" -> \`route: "/dashboard/identity-risk"\`
   - "buka layanan tidak perlu" / "doctor shopping" -> \`route: "/dashboard/unnecessary-services"\`
   - "buka farmasi" / "obat PRB" / "alkes" -> \`route: "/dashboard/pharmacy-alkes"\`
   - "buka master data" / "peserta" / "faskes" -> \`route: "/dashboard/master-data"\`
   - "buka regulasi" / "aturan" / "hukum" -> \`route: "/dashboard/regulations"\`
2. Pengecekan Data Peserta / Klaim / Fasilitas Kesehatan (\`analyze_participant\`):
   - Jika pengguna meminta cek fasilitas kesehatan / faskes (misal "Puskesmas Gambir", "RS Mitra Husada Semarang", "RS Sejahtera Abadi Medan", "Klinik Utama Sehat Mandiri", "RS Kasih Bunda Pematangsiantar", "RSUD Dr. Moewardi Surakarta", "RS Advent Bandung") atau nama peserta / NIK / SEP, panggil \`analyze_participant\` dengan parameter \`participant_query\` berisi nama faskes, nama peserta, NIK, atau nomor SEP tersebut.
3. Kasus & Aliran Transaksi Terbaru (\`get_recent_simulation_cases\`):
   - Panggil ketika pengguna meminta daftar kasus anomali terbaru atau ringkasan klaim berisiko di aliran transaksi.
4. Uji Pola Fraud & Skor Risiko (\`detect_fraud_pattern\`, \`calculate_risk_score\`, \`get_claim_history\`, \`search_regulations_rag\`):
   - Panggil ketika pengguna meminta analisis mendalam pola kecurangan, perhitungan skor risiko, riwayat kunjungan SEP, atau rujukan pasal regulasi JKN.
5. Rekomendasi Tindakan Human-in-the-Loop (\`propose_participant_suspension\`, \`propose_warning_letter\`, \`propose_case_review\`):
   - Selalu gunakan tool proposal ini jika pengguna meminta tindakan blokir/suspensi, surat peringatan/klarifikasi, atau eskalasi kasus.

Domain Pengetahuan 4 Modus Fraud Peserta:
1. Modus 1: Pemalsuan Data/Identitas (Diskordansi Biologis Mutlak, misal klaim persalinan O82.0 pada pasien pria).
2. Modus 2: Peminjaman Kartu Peserta (Impossible Travel Velocity > 100 km/jam antar-faskes).
3. Modus 3: Pelayanan Tidak Perlu & Doctor Shopping (Indeks DSI >= 0.5, keluhan sama di banyak faskes < 7 hari).
4. Modus 4: Penyalahgunaan Obat PRB & Alkes (Rasio POR > 140% obat kronis PRB atau pelanggaran masa tunggu alkes).

${BENCHMARK_CLAIMS_KNOWLEDGE_PROMPT}
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

    const realtimeTools = INFERA_TOOL_DEFINITIONS.map((t) => ({
      type: 'function' as const,
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    }));

    const payload = {
      session: {
        model: 'gpt-live-1',
        instructions: getFeraRealtimeInstructions(),
        audio: {
          output: {
            voice: voiceParam,
          },
        },
        client: {
          data_channel: {
            allowed_client_events: 'all',
            allowed_server_events: 'all',
          },
        },
        delegation: {
          type: 'responses',
          acknowledgement_delay_ms: 1500,
          responses: {
            model: DEFAULT_OPENAI_CHAT_MODEL,
            instructions: getFeraDelegationInstructions(),
            tools: realtimeTools,
            tool_choice: 'auto',
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
