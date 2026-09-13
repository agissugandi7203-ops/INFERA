import {
  VOICE_DEFAULT_ID,
  BASE_VOICE_SETTINGS,
  ElevenLabsVoiceSettings,
} from './tts-processor';

export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static lipSyncInterval: number | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentAudioUrl: string | null = null;
  private static activeRecognition: any = null;
  private static speakSessionId = 0;
  private static speakingState = false;

  public static isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static isRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  public static isSpeaking(): boolean {
    return this.speakingState;
  }

  public static stopSpeaking(): void {
    this.speakSessionId++;
    this.speakingState = false;

    if (this.lipSyncInterval) {
      clearInterval(this.lipSyncInterval);
      this.lipSyncInterval = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) {
      try {
        URL.revokeObjectURL(this.currentAudioUrl);
      } catch {
        // ignore
      }
      this.currentAudioUrl = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
  }

  public static stopListening(): void {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // ignore
      }
      this.activeRecognition = null;
    }
  }

  /**
   * Speak using ElevenLabs TTS (via backend proxy or direct key) with instant fallback to Web Speech API.
   */
  public static async speak(
    text: string,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void,
    elevenLabsApiKey?: string,
    elevenLabsVoiceId: string = VOICE_DEFAULT_ID,
    voiceSettings?: ElevenLabsVoiceSettings
  ): Promise<void> {
    this.stopSpeaking();
    this.stopListening();
    const sessionId = ++this.speakSessionId;
    this.speakingState = true;

    const cleanText = text
      .replace(/[*_#`~\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      this.speakingState = false;
      if (onEnd) onEnd();
      return;
    }

    try {
      const audioBlob = await this.fetchElevenLabsAudio(
        cleanText,
        elevenLabsVoiceId,
        voiceSettings,
        elevenLabsApiKey,
        6000
      );

      if (this.speakSessionId !== sessionId) return;
      await this.playAudioWithLipSync(audioBlob, onLipSync, onStart, onEnd);
      return;
    } catch (err) {
      console.warn('[Speech] ElevenLabs TTS unavailable, falling back to Web Speech:', err);
      if (this.speakSessionId !== sessionId) return;
      this.speakWithWebSpeech(cleanText, onLipSync, onStart, onEnd);
    }
  }

  private static async fetchElevenLabsAudio(
    text: string,
    voiceId: string,
    voiceSettings?: ElevenLabsVoiceSettings,
    apiKey?: string,
    timeoutMs: number = 6000
  ): Promise<Blob> {
    const settings = voiceSettings || BASE_VOICE_SETTINGS;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const backendUrl = import.meta.env.VITE_API_URL || '/api/v1';
      try {
        const res = await fetch(`${backendUrl}/voice/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceId,
            voiceSettings: {
              stability: settings.stability,
              similarity_boost: settings.similarity_boost,
              style: settings.style,
              use_speaker_boost: settings.use_speaker_boost,
              speed: settings.speed,
            },
          }),
          signal: controller?.signal,
        });

        if (res.ok) {
          return await res.blob();
        }
      } catch {
        // Backend proxy failed, attempt direct
      }

      if (apiKey && apiKey.trim().length > 5) {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey.trim(),
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: settings.stability,
              similarity_boost: settings.similarity_boost,
              style: settings.style,
              use_speaker_boost: settings.use_speaker_boost,
              speed: settings.speed,
            },
          }),
          signal: controller?.signal,
        });

        if (res.ok) {
          return await res.blob();
        }
      }

      throw new Error('All ElevenLabs TTS attempts failed');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private static async playAudioWithLipSync(
    blob: Blob,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    const url = URL.createObjectURL(blob);
    this.currentAudioUrl = url;
    const audio = new Audio(url);
    this.currentAudio = audio;

    let phase = 0;
    const startFlap = () => {
      this.lipSyncInterval = window.setInterval(() => {
        phase += 0.22;
        const wave = Math.sin(phase * 1.5) * 0.45 + Math.sin(phase * 0.7) * 0.35 + 0.2;
        const mouthOpen = Math.max(0.12, Math.min(0.85, wave));
        onLipSync(mouthOpen);
      }, 65);
    };

    audio.onplay = () => {
      this.speakingState = true;
      if (onStart) onStart();
      startFlap();
    };

    audio.onended = () => {
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    try {
      await audio.play();
    } catch (playErr) {
      console.warn('[Speech] Audio playback blocked or failed, settling state:', playErr);
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    }
  }

  private static speakWithWebSpeech(
    cleanText: string,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.08;
    utterance.pitch = 1.35;

    const voices = this.synth.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        (v.lang.startsWith('id') || v.lang.startsWith('ID') || v.lang.startsWith('ja')) &&
        (v.name.toLowerCase().includes('gadis') ||
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('haruka') ||
          v.name.toLowerCase().includes('nanami') ||
          v.name.toLowerCase().includes('natural'))
    ) || voices.find((v) => v.lang.startsWith('id') || v.lang.startsWith('ID'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    try {
      this.synth.cancel();
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // ignore
    }

    let watchdog: number | null = null;

    utterance.onstart = () => {
      this.speakingState = true;
      if (onStart) onStart();

      let phase = 0;
      this.lipSyncInterval = window.setInterval(() => {
        phase += 0.22;
        const base = Math.sin(phase * 1.5) * 0.45 + Math.sin(phase * 0.7) * 0.35 + 0.2;
        const mouthOpen = Math.max(0.12, Math.min(0.85, base));
        onLipSync(mouthOpen);
      }, 65);

      watchdog = window.setInterval(() => {
        if (!SpeechService.speakingState) {
          if (watchdog) clearInterval(watchdog);
          return;
        }
        if (SpeechService.synth && SpeechService.synth.paused) {
          SpeechService.synth.resume();
        }
      }, 2500);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        onLipSync(0.75);
      }
    };

    utterance.onend = () => {
      if (watchdog) clearInterval(watchdog);
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      if (watchdog) clearInterval(watchdog);
      console.warn('Speech synthesis error:', err);
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public static unlockAudio(): void {
    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch {
        // ignore
      }
    }
  }

  public static startListening(
    onResult: (transcript: string) => void,
    onStateChange?: (isListening: boolean) => void,
    onError?: (error: string) => void,
    onSoundDetected?: (isSoundActive: boolean) => void,
    onInterim?: (liveText: string) => void
  ): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Browser Anda tidak mendukung Speech Recognition.');
      return () => {};
    }

    this.stopSpeaking();
    this.stopListening();

    try {
      const recognition = new SpeechRecognition();
      this.activeRecognition = recognition;
      recognition.lang = 'id-ID';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        if (onStateChange) onStateChange(true);
        if (onSoundDetected) onSoundDetected(false);
      };

      recognition.onspeechstart = () => {
        if (onSoundDetected) onSoundDetected(true);
      };

      recognition.onspeechend = () => {
        if (onSoundDetected) onSoundDetected(false);
      };

      recognition.onsoundstart = () => {
        if (onSoundDetected) onSoundDetected(true);
      };

      recognition.onsoundend = () => {
        if (onSoundDetected) onSoundDetected(false);
      };

      let lastHeardText = '';
      let hasDeliveredResult = false;

      const deliver = (text: string) => {
        if (hasDeliveredResult) return;
        const trimmed = text.trim();
        if (trimmed) {
          hasDeliveredResult = true;
          try {
            recognition.stop();
          } catch {
            // ignore
          }
          if (SpeechService.activeRecognition === recognition) {
            SpeechService.activeRecognition = null;
          }
          onResult(trimmed);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        if (event.results) {
          for (let i = event.resultIndex || 0; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item && item[0]?.transcript) {
              if (item.isFinal) {
                finalText += item[0].transcript;
              } else {
                interimText += item[0].transcript;
              }
            }
          }
        }

        const currentLive = (finalText || interimText).trim();
        if (currentLive) {
          lastHeardText = currentLive;
          if (onSoundDetected) onSoundDetected(true);
          if (onInterim) onInterim(currentLive);
        }

        if (finalText.trim()) {
          deliver(finalText.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (SpeechService.activeRecognition === recognition) {
          SpeechService.activeRecognition = null;
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          let friendly = '';
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            friendly = 'Akses mikrofon diblokir oleh browser. Klik ikon gembok di sebelah URL dan ubah Mikrofon menjadi "Izinkan".';
          } else if (event.error === 'audio-capture') {
            friendly = 'Mikrofon tidak terdeteksi di Windows. Pastikan mikrofon aktif di pengaturan audio.';
          } else if (event.error === 'network') {
            friendly = 'Layanan Google Speech memerlukan koneksi internet aktif.';
          } else {
            friendly = `Kendala mikrofon: ${event.error}`;
          }
          if (onError) onError(friendly);
        }
        if (onStateChange) onStateChange(false);
        if (onSoundDetected) onSoundDetected(false);
      };

      recognition.onend = () => {
        if (!hasDeliveredResult && lastHeardText) {
          deliver(lastHeardText);
        }
        if (SpeechService.activeRecognition === recognition) {
          SpeechService.activeRecognition = null;
        }
        if (onStateChange) onStateChange(false);
        if (onSoundDetected) onSoundDetected(false);
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
        if (SpeechService.activeRecognition === recognition) {
          SpeechService.activeRecognition = null;
        }
        if (onStateChange) onStateChange(false);
        if (onSoundDetected) onSoundDetected(false);
      };
    } catch (err) {
      this.activeRecognition = null;
      console.error('Failed to start speech recognition:', err);
      if (onError) onError(err instanceof Error ? err.message : 'Gagal mengakses mikrofon.');
      if (onStateChange) onStateChange(false);
      return () => {};
    }
  }
}
