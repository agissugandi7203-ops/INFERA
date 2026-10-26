import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type { TtsInput, SttInput } from '../validators/voice.validator.js';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = '3bAVnCtF2Efx7MOj2bJ0';
const UPSTREAM_TIMEOUT_MS = 30_000;

const getApiKey = (): string => {
  const apiKey = env.ELEVENLABS_API_KEY.trim();
  if (apiKey.length < 5) {
    throw new AppError('Layanan suara belum dikonfigurasi di server.', 503, 'SERVICE_UNAVAILABLE');
  }
  return apiKey;
};

const requestTts = (apiKey: string, voiceId: string, text: string, voiceSettings: Record<string, unknown>) =>
  fetch(`${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: voiceSettings,
    }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

export const generateTts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Body already validated & normalised by ttsSchema (voiceId format, settings ranges, text ≤ 1000 chars)
    const { text, voiceId, voiceSettings } = req.body as TtsInput;
    const apiKey = getApiKey();
    const targetVoiceId = voiceId || DEFAULT_VOICE_ID;

    const settings = {
      stability: 0.62,
      similarity_boost: 0.78,
      style: 0.05,
      use_speaker_boost: true,
      ...voiceSettings,
    };

    let elevenLabsRes = await requestTts(apiKey, targetVoiceId, text, settings);

    if (!elevenLabsRes.ok && targetVoiceId !== DEFAULT_VOICE_ID) {
      console.warn(`[VoiceController] Voice ${targetVoiceId} failed (${elevenLabsRes.status}), falling back to default voice`);
      elevenLabsRes = await requestTts(apiKey, DEFAULT_VOICE_ID, text, settings);
    }

    if (!elevenLabsRes.ok) {
      const errText = await elevenLabsRes.text().catch(() => '');
      // Upstream detail is logged server-side only (masked for clients by the error handler in production)
      throw AppError.internal(`ElevenLabs TTS error (${elevenLabsRes.status}): ${errText.slice(0, 500)}`);
    }

    const audioBuffer = await elevenLabsRes.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    // Spoken AI replies may contain personal data → never store in shared/browser caches
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    next(err);
  }
};

export const transcribeStt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { audioBase64, mimeType } = req.body as SttInput;
    const apiKey = getApiKey();

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    if (audioBuffer.length === 0) {
      throw AppError.badRequest('Data audio kosong atau tidak valid.');
    }

    const baseMime = mimeType.split(';')[0]!.trim().toLowerCase();
    const ext = baseMime.includes('wav')
      ? 'wav'
      : baseMime.includes('mp4') || baseMime.includes('m4a') || baseMime.includes('aac')
        ? 'mp4'
        : baseMime.includes('ogg')
          ? 'ogg'
          : baseMime.includes('mpeg')
            ? 'mp3'
            : 'webm';

    // Native FormData builds the multipart body safely (no hand-written headers → no CRLF injection)
    const form = new FormData();
    form.append('model_id', 'scribe_v1');
    form.append('language_code', 'id');
    form.append('file', new Blob([audioBuffer], { type: baseMime }), `recording.${ext}`);

    const sttRes = await fetch(`${ELEVENLABS_BASE}/speech-to-text`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: form,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!sttRes.ok) {
      const errText = await sttRes.text().catch(() => '');
      throw AppError.internal(`ElevenLabs STT error (${sttRes.status}): ${errText.slice(0, 500)}`);
    }

    const data = (await sttRes.json()) as { text?: string; language_code?: string };
    res.status(200).json({
      text: data.text || '',
      language_code: data.language_code || 'id',
    });
  } catch (err) {
    next(err);
  }
};
