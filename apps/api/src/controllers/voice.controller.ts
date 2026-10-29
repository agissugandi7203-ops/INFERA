import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type { TtsInput, SttInput } from '../validators/voice.validator.js';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = '3bAVnCtF2Efx7MOj2bJ0';
const UPSTREAM_TIMEOUT_MS = 30_000;

const requestOpenAiTts = async (apiKey: string, voice: string, text: string) => {
  const openAiVoices = new Set(['alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer']);
  const chosenVoice = openAiVoices.has(voice.toLowerCase()) ? voice.toLowerCase() : 'coral';
  return fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: chosenVoice,
      input: text,
      response_format: 'mp3',
    }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
};

const requestOpenAiStt = async (apiKey: string, audioBlob: Blob, filename: string) => {
  const form = new FormData();
  form.append('model', 'whisper-1');
  form.append('language', 'id');
  form.append('file', audioBlob, filename);
  return fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
};

const requestElevenLabsTts = (apiKey: string, voiceId: string, text: string, voiceSettings: Record<string, unknown>) =>
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
    const { text, voiceId, voiceSettings } = req.body as TtsInput;
    const openAiKey = env.OPENAI_API_KEY?.trim();
    const elevenLabsKey = env.ELEVENLABS_API_KEY?.trim();

    // Priority 1: OpenAI TTS (tts-1) with voice 'coral' for FERA
    // Fast, natural, highly expressive Indonesian pronunciation, ~600ms latency
    if (openAiKey && openAiKey.length > 5) {
      try {
        const targetVoice = voiceId || 'coral';
        const openAiRes = await requestOpenAiTts(openAiKey, targetVoice, text);
        if (openAiRes.ok) {
          const audioBuffer = await openAiRes.arrayBuffer();
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', audioBuffer.byteLength.toString());
          res.setHeader('Cache-Control', 'private, no-store');
          res.status(200).send(Buffer.from(audioBuffer));
          return;
        }
        console.warn(`[VoiceController] OpenAI TTS returned ${openAiRes.status}, falling back to ElevenLabs`);
      } catch (openAiErr) {
        console.warn('[VoiceController] OpenAI TTS request failed, falling back to ElevenLabs:', openAiErr);
      }
    }

    // Priority 2: ElevenLabs Fallback
    if (!elevenLabsKey || elevenLabsKey.length < 5) {
      throw new AppError('Layanan suara belum dikonfigurasi di server.', 503, 'SERVICE_UNAVAILABLE');
    }

    const targetVoiceId = voiceId && voiceId.length > 10 ? voiceId : DEFAULT_VOICE_ID;
    const settings = {
      stability: 0.62,
      similarity_boost: 0.78,
      style: 0.05,
      use_speaker_boost: true,
      ...voiceSettings,
    };

    let elevenLabsRes = await requestElevenLabsTts(elevenLabsKey, targetVoiceId, text, settings);
    if (!elevenLabsRes.ok && targetVoiceId !== DEFAULT_VOICE_ID) {
      elevenLabsRes = await requestElevenLabsTts(elevenLabsKey, DEFAULT_VOICE_ID, text, settings);
    }

    if (!elevenLabsRes.ok) {
      const errText = await elevenLabsRes.text().catch(() => '');
      throw AppError.internal(`ElevenLabs TTS error (${elevenLabsRes.status}): ${errText.slice(0, 500)}`);
    }

    const audioBuffer = await elevenLabsRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    next(err);
  }
};

export const transcribeStt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { audioBase64, mimeType } = req.body as SttInput;
    const openAiKey = env.OPENAI_API_KEY?.trim();
    const elevenLabsKey = env.ELEVENLABS_API_KEY?.trim();

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

    const audioBlob = new Blob([audioBuffer], { type: baseMime });
    const filename = `recording.${ext}`;

    // Priority 1: OpenAI Whisper-1 STT
    if (openAiKey && openAiKey.length > 5) {
      try {
        const whisperRes = await requestOpenAiStt(openAiKey, audioBlob, filename);
        if (whisperRes.ok) {
          const data = (await whisperRes.json()) as { text?: string };
          res.status(200).json({
            text: data.text || '',
            language_code: 'id',
          });
          return;
        }
        console.warn(`[VoiceController] Whisper STT returned ${whisperRes.status}, falling back to ElevenLabs`);
      } catch (whisperErr) {
        console.warn('[VoiceController] Whisper STT failed, falling back to ElevenLabs:', whisperErr);
      }
    }

    // Priority 2: ElevenLabs Scribe STT
    if (!elevenLabsKey || elevenLabsKey.length < 5) {
      throw new AppError('Layanan transkripsi suara belum dikonfigurasi di server.', 503, 'SERVICE_UNAVAILABLE');
    }

    const form = new FormData();
    form.append('model_id', 'scribe_v1');
    form.append('language_code', 'id');
    form.append('file', audioBlob, filename);

    const sttRes = await fetch(`${ELEVENLABS_BASE}/speech-to-text`, {
      method: 'POST',
      headers: { 'xi-api-key': elevenLabsKey },
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
