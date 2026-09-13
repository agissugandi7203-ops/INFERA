import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const generateTts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, voiceId = '3bAVnCtF2Efx7MOj2bJ0', voiceSettings } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw AppError.badRequest('Field "text" wajib diisi dan berupa string.');
    }

    const apiKey = env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey.trim().length < 5) {
      throw AppError.internal('Kredensial ElevenLabs API Key belum dikonfigurasi di server backend.');
    }

    const targetVoiceId = voiceId && typeof voiceId === 'string' && voiceId.trim()
      ? voiceId.trim()
      : '3bAVnCtF2Efx7MOj2bJ0';

    const defaultVoiceSettings = {
      stability: 0.62,
      similarity_boost: 0.78,
      style: 0.05,
      use_speaker_boost: true,
      ...voiceSettings,
    };

    let elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: defaultVoiceSettings,
      }),
    });

    if (!elevenLabsRes.ok && targetVoiceId !== '3bAVnCtF2Efx7MOj2bJ0') {
      console.warn(`[VoiceController] Voice ${targetVoiceId} failed (${elevenLabsRes.status}), attempting fallback to default voice (3bAVnCtF2Efx7MOj2bJ0)`);
      elevenLabsRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/3bAVnCtF2Efx7MOj2bJ0', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.slice(0, 1000),
          model_id: 'eleven_multilingual_v2',
          voice_settings: defaultVoiceSettings,
        }),
      });
    }

    if (!elevenLabsRes.ok) {
      const errText = await elevenLabsRes.text().catch(() => 'Unknown ElevenLabs error');
      console.error(`[VoiceController] ElevenLabs API error (${elevenLabsRes.status}):`, errText);
      throw AppError.internal(`ElevenLabs TTS error (${elevenLabsRes.status}): ${errText}`);
    }

    const audioBuffer = await elevenLabsRes.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    next(err);
  }
};

export const transcribeStt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      throw AppError.badRequest('Field "audioBase64" wajib diisi.');
    }

    const apiKey = env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey.trim().length < 5) {
      throw AppError.internal('Kredensial ElevenLabs API Key belum dikonfigurasi di server backend.');
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const boundary = '----Boundary' + Date.now().toString(16);

    const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const filename = `recording.${ext}`;

    const part1 = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="language_code"\r\n\r\nid\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const part2 = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullBody = Buffer.concat([part1, audioBuffer, part2]);

    const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': fullBody.length.toString(),
      },
      body: fullBody,
    });

    if (!sttRes.ok) {
      const errText = await sttRes.text().catch(() => '');
      console.warn(`[VoiceController] ElevenLabs STT error (${sttRes.status}):`, errText);
      throw AppError.internal(`ElevenLabs STT error (${sttRes.status}): ${errText}`);
    }

    const data = await sttRes.json() as { text?: string; language_code?: string };
    res.status(200).json({
      text: data.text || '',
      language_code: data.language_code || 'id',
    });
  } catch (err) {
    next(err);
  }
};

