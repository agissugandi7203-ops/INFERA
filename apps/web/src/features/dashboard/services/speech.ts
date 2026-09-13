import {
  VOICE_DEFAULT_ID,
  BASE_VOICE_SETTINGS,
  ElevenLabsVoiceSettings,
} from './tts-processor';

export function cleanAndDeduplicateTranscript(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const words = text.split(' ');
  const n = words.length;

  // Check repeating n-gram patterns from k = 1 up to floor(n/2)
  for (let k = 1; k <= Math.floor(n / 2); k++) {
    if (n % k === 0) {
      const pattern = words.slice(0, k).join(' ').toLowerCase();
      let allMatch = true;
      for (let j = k; j < n; j += k) {
        const block = words.slice(j, j + k).join(' ').toLowerCase();
        if (block !== pattern) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        return words.slice(0, k).join(' ');
      }
    }
  }

  // Word-level sequential duplication (e.g. "audit audit peserta")
  const dedupedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (i > 0 && word.toLowerCase() === words[i - 1].toLowerCase()) {
      continue;
    }
    dedupedWords.push(word);
  }

  return dedupedWords.join(' ');
}

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
   * Speak using Backend ElevenLabs TTS Proxy, with graceful fallback to Web Speech API.
   */
  public static async speak(
    text: string,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void,
    _deprecatedApiKey?: string,
    elevenLabsVoiceId: string = VOICE_DEFAULT_ID,
    voiceSettings?: ElevenLabsVoiceSettings
  ): Promise<void> {
    this.stopSpeaking();
    this.stopListening(); // Matikan mikrofon agar suara speaker tidak masuk kembali (anti-echo loop)
    const sessionId = ++this.speakSessionId;
    this.speakingState = true;

    // Clean text for speech (remove markdown formatting that sounds bad in TTS)
    const cleanText = text
      .replace(/[*_#`~\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      this.speakingState = false;
      if (onEnd) onEnd();
      return;
    }

    // 1. Try Backend ElevenLabs Proxy first
    try {
      const audioBlob = await this.fetchElevenLabsAudio(
        cleanText,
        elevenLabsVoiceId,
        voiceSettings,
        8000
      );

      // Jika user telah memicu sesi audio baru selama unduhan berlangsung, buang audio usang ini
      if (this.speakSessionId !== sessionId) return;

      await this.playAudioWithLipSync(audioBlob, onLipSync, onStart, onEnd);
      return;
    } catch (err) {
      console.warn('[Speech] Backend ElevenLabs TTS gagal, beralih instan ke Web Speech:', err);
      if (this.speakSessionId !== sessionId) return;
      this.speakWithWebSpeech(cleanText, onLipSync, onStart, onEnd);
    }
  }

  private static async fetchElevenLabsAudio(
    text: string,
    voiceId: string,
    voiceSettings?: ElevenLabsVoiceSettings,
    timeoutMs: number = 8000
  ): Promise<Blob> {
    const backendUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const settings = voiceSettings || BASE_VOICE_SETTINGS;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const res = await fetch(`${backendUrl}/voice/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Voice Proxy Error (${res.status}): ${errText}`);
      }

      return await res.blob();
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
      console.warn('[Speech] Audio playback blocked or failed:', playErr);
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
    _onInterim?: (liveText: string) => void
  ): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Browser Anda tidak mendukung Speech Recognition.');
      return () => {};
    }

    // Pastikan tidak ada suara TTS yang sedang berputar sebelum membuka mic
    this.stopSpeaking();
    this.stopListening();

    try {
      const recognition = new SpeechRecognition();
      this.activeRecognition = recognition;
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
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

      let hasDeliveredResult = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        if (hasDeliveredResult) return;

        let finalTranscript = '';
        if (event.results) {
          for (let i = event.resultIndex || 0; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item && item[0]?.transcript) {
              finalTranscript += item[0].transcript;
            }
          }
        }

        const trimmed = finalTranscript.trim();
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
          const cleaned = cleanAndDeduplicateTranscript(trimmed);
          onResult(cleaned || trimmed);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (SpeechService.activeRecognition === recognition) {
          SpeechService.activeRecognition = null;
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          if (onError) onError(event.error);
        }
        if (onStateChange) onStateChange(false);
        if (onSoundDetected) onSoundDetected(false);
      };

      recognition.onend = () => {
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
