import {
  VOICE_DEFAULT_ID,
  BASE_VOICE_SETTINGS,
  ElevenLabsVoiceSettings,
} from './tts-processor';

export function cleanAndDeduplicateTranscript(raw: string): string {
  let text = raw.replace(/\s+/g, ' ').trim();
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

  // Word-level sequential duplication (e.g. "saya ingin audit audit peserta Budi")
  const dedupedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (i > 0 && word.toLowerCase() === words[i - 1].toLowerCase()) {
      continue;
    }
    dedupedWords.push(word);
  }

  // Check if deduped words themselves form repeating n-grams
  const m = dedupedWords.length;
  for (let k = 1; k <= Math.floor(m / 2); k++) {
    if (m % k === 0) {
      const pattern = dedupedWords.slice(0, k).join(' ').toLowerCase();
      let allMatch = true;
      for (let j = k; j < m; j += k) {
        const block = dedupedWords.slice(j, j + k).join(' ').toLowerCase();
        if (block !== pattern) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        return dedupedWords.slice(0, k).join(' ');
      }
    }
  }

  // Also check character-level exact halves
  const cleanedStr = dedupedWords.join(' ');
  const halfLen = Math.floor(cleanedStr.length / 2);
  for (let len = halfLen; len >= 3; len--) {
    const firstHalf = cleanedStr.slice(0, len).trim();
    const secondHalf = cleanedStr.slice(len).trim();
    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      return firstHalf;
    }
  }

  return cleanedStr;
}

export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static lipSyncInterval: number | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentAudioUrl: string | null = null;
  private static sharedAudio: HTMLAudioElement | null = null;
  private static audioUnlocked = false;
  private static activeRecognition: any = null;
  private static speakSessionId = 0;
  private static recognitionSessionId = 0;
  private static lastSpeakEndTime = 0;
  private static lastSpokenText = '';
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
    const wasSpeaking =
      this.speakingState ||
      this.currentAudio !== null ||
      (this.synth !== null && this.synth.speaking);
    this.speakingState = false;
    if (wasSpeaking) {
      this.lastSpeakEndTime = Date.now();
    }

    if (this.lipSyncInterval) {
      clearInterval(this.lipSyncInterval);
      this.lipSyncInterval = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.onplay = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.removeAttribute('src');
        this.currentAudio.load();
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
    this.recognitionSessionId++;

    if (this.activeRecognition) {
      try {
        this.activeRecognition.onstart = null;
        this.activeRecognition.onresult = null;
        this.activeRecognition.onerror = null;
        this.activeRecognition.onend = null;
        this.activeRecognition.onspeechstart = null;
        this.activeRecognition.onspeechend = null;
        this.activeRecognition.onsoundstart = null;
        this.activeRecognition.onsoundend = null;
        if (typeof this.activeRecognition.abort === 'function') {
          this.activeRecognition.abort();
        } else {
          this.activeRecognition.stop();
        }
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
      this.lastSpeakEndTime = Date.now();
      if (onEnd) onEnd();
      return;
    }

    this.lastSpokenText = cleanText.toLowerCase();

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

      await this.playAudioWithLipSync(audioBlob, sessionId, cleanText, onLipSync, onStart, onEnd);
      return;
    } catch (err) {
      console.warn('[Speech] Backend ElevenLabs TTS gagal/timeout, beralih instan ke Web Speech (low-latency):', err);
      if (this.speakSessionId !== sessionId) return;
      this.speakWithWebSpeech(cleanText, sessionId, onLipSync, onStart, onEnd);
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
    sessionId: number,
    cleanText: string,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.speakSessionId !== sessionId) return;

    const url = URL.createObjectURL(blob);
    this.currentAudioUrl = url;

    // Use primed sharedAudio if available, otherwise new Audio
    const audio = this.sharedAudio || new Audio();
    this.sharedAudio = audio;
    audio.src = url;
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
      if (SpeechService.speakSessionId !== sessionId) {
        SpeechService.stopSpeaking();
        return;
      }
      this.speakingState = true;
      if (onStart) onStart();
      startFlap();
    };

    audio.onended = () => {
      SpeechService.lastSpeakEndTime = Date.now();
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      console.warn('[Speech] Audio playback error on Audio element, falling back to Web Speech');
      SpeechService.lastSpeakEndTime = Date.now();
      this.stopSpeaking();
      onLipSync(0);
      if (SpeechService.speakSessionId === sessionId) {
        this.speakWithWebSpeech(cleanText, sessionId, onLipSync, onStart, onEnd);
      } else if (onEnd) {
        onEnd();
      }
    };

    try {
      await audio.play();
    } catch (playErr) {
      console.warn('[Speech] Audio playback blocked/failed, falling back to Web Speech:', playErr);
      if (this.speakSessionId !== sessionId) return;
      this.stopSpeaking();
      this.speakWithWebSpeech(cleanText, sessionId, onLipSync, onStart, onEnd);
    }
  }

  private static speakWithWebSpeech(
    cleanText: string,
    sessionId: number,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.synth || this.speakSessionId !== sessionId) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.08; // slightly faster, energetic
    utterance.pitch = 1.35; // high, cute anime girl pitch!

    const voices = this.synth.getVoices();
    // Prioritize natural female voices for an anime assistant persona
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
      if (SpeechService.speakSessionId !== sessionId) {
        SpeechService.stopSpeaking();
        return;
      }
      this.speakingState = true;
      if (onStart) onStart();

      let phase = 0;
      this.lipSyncInterval = window.setInterval(() => {
        phase += 0.22;
        const base = Math.sin(phase * 1.5) * 0.45 + Math.sin(phase * 0.7) * 0.35 + 0.2;
        const mouthOpen = Math.max(0.12, Math.min(0.85, base));
        onLipSync(mouthOpen);
      }, 65);

      // Chrome long-speech unpause watchdog
      watchdog = window.setInterval(() => {
        if (!SpeechService.speakingState || SpeechService.speakSessionId !== sessionId) {
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
      SpeechService.lastSpeakEndTime = Date.now();
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      if (watchdog) clearInterval(watchdog);
      SpeechService.lastSpeakEndTime = Date.now();
      console.warn('Speech synthesis error:', err);
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    // Minor delay to let the browser audio pipeline settle post-cancel
    window.setTimeout(() => {
      if (SpeechService.speakSessionId === sessionId && SpeechService.synth) {
        try {
          SpeechService.synth.speak(utterance);
        } catch (synthErr) {
          console.warn('[Speech] Web Speech speak error:', synthErr);
          SpeechService.lastSpeakEndTime = Date.now();
          SpeechService.stopSpeaking();
          onLipSync(0);
          if (onEnd) onEnd();
        }
      }
    }, 50);
  }

  public static unlockAudio(): void {
    if (typeof window === 'undefined') return;
    if (!this.sharedAudio) {
      this.sharedAudio = new Audio();
    }
    if (!this.audioUnlocked) {
      // Prime the shared audio with silent wav data inside user gesture
      this.sharedAudio.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.sharedAudio
        .play()
        .then(() => {
          this.audioUnlocked = true;
        })
        .catch(() => {
          // Still primed
        });
    }
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
    console.log('[Speech] ▶ startListening() called');
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('[Speech] ✗ SpeechRecognition API not available in this browser');
      if (onError) {
        onError('Browser Anda belum mendukung Speech Recognition. Gunakan browser Google Chrome atau Microsoft Edge terbaru.');
      }
      return () => {};
    }

    console.log('[Speech] ✓ SpeechRecognition API available:', SpeechRecognition.name || 'webkitSpeechRecognition');

    // Stop existing audio and priming
    this.stopSpeaking();
    this.stopListening();
    this.unlockAudio();

    const currentSession = ++this.recognitionSessionId;
    console.log('[Speech] Session ID:', currentSession);

    let isExplicitlyStopped = false;
    let accumulatedFinalText = '';
    let currentInterimText = '';
    let silenceTimer: any = null;
    let inactivityTimer: any = null;
    let hasDelivered = false;

    const finishAndDeliver = () => {
      if (hasDelivered) return;
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      const full = (accumulatedFinalText + ' ' + currentInterimText).trim();
      const cleaned = cleanAndDeduplicateTranscript(full);

      console.log('[Speech] 🎯 finishAndDeliver — raw:', full, '→ cleaned:', cleaned);

      if (cleaned) {
        hasDelivered = true;
        // Echo check: only discard if EXACT match to last spoken sentence within 600ms
        const elapsed = Date.now() - SpeechService.lastSpeakEndTime;
        if (
          elapsed < 600 &&
          SpeechService.lastSpokenText &&
          cleaned.toLowerCase() === SpeechService.lastSpokenText.toLowerCase()
        ) {
          console.log('[Speech] 🔇 Ignored acoustic echo of AI voice:', cleaned);
          return;
        }

        console.log('[Speech] ✅ DELIVERING transcript to app:', cleaned);
        onResult(cleaned);
      }
    };

    const cleanup = () => {
      isExplicitlyStopped = true;
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      SpeechService.stopListening();
      if (onStateChange) onStateChange(false);
      if (onSoundDetected) onSoundDetected(false);
    };

    // Auto-timeout if user clicks mic but stays completely silent for 7s
    inactivityTimer = setTimeout(() => {
      if (!hasDelivered && !accumulatedFinalText && !currentInterimText) {
        console.log('[Speech] ⏱ Inactivity timeout (7s no speech) — closing mic');
        cleanup();
      }
    }, 7000);

    try {
      const recognition = new SpeechRecognition();
      SpeechService.activeRecognition = recognition;
      recognition.lang = 'id-ID';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // continuous = false ensures browser automatically detects utterance completion and fires onend
      recognition.continuous = false;

      recognition.onstart = () => {
        console.log('[Speech] ✓ Recognition STARTED — listening for speech...');
        if (SpeechService.recognitionSessionId !== currentSession) return;
        if (onStateChange) onStateChange(true);
      };

      recognition.onsoundstart = () => {
        if (SpeechService.recognitionSessionId !== currentSession) return;
        if (onSoundDetected) onSoundDetected(true);
      };

      recognition.onsoundend = () => {
        if (SpeechService.recognitionSessionId !== currentSession) return;
        if (onSoundDetected) onSoundDetected(false);
      };

      recognition.onspeechstart = () => {
        if (SpeechService.recognitionSessionId !== currentSession) return;
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
          inactivityTimer = null;
        }
        if (onSoundDetected) onSoundDetected(true);
      };

      recognition.onspeechend = () => {
        console.log('[Speech] 🛑 Browser detected speech end — triggering fast deliver');
        if (SpeechService.recognitionSessionId !== currentSession) return;
        if (onSoundDetected) onSoundDetected(false);
        // Fast cutoff: deliver within 350ms of user stopping talking
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (!isExplicitlyStopped && SpeechService.recognitionSessionId === currentSession) {
            finishAndDeliver();
            cleanup();
          }
        }, 350);
      };

      recognition.onresult = (event: any) => {
        if (isExplicitlyStopped || SpeechService.recognitionSessionId !== currentSession) return;

        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
          inactivityTimer = null;
        }

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            console.log('[Speech] 📝 Final result chunk:', text);
            accumulatedFinalText = (accumulatedFinalText + ' ' + text).trim();
          } else {
            interim += ' ' + text;
          }
        }
        currentInterimText = interim.trim();

        const currentCombined = (accumulatedFinalText + ' ' + currentInterimText).trim();
        if (currentCombined) {
          if (onSoundDetected) onSoundDetected(true);
          if (onInterim) onInterim(currentCombined);
          console.log('[Speech] 💬 Live text:', currentCombined);

          // Debounce silence: deliver 1.0s after user pauses
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (!isExplicitlyStopped && SpeechService.recognitionSessionId === currentSession) {
              console.log('[Speech] ⏱ Silence debounce fired — delivering result');
              finishAndDeliver();
              cleanup();
            }
          }, 1000);
        }
      };

      recognition.onerror = (event: any) => {
        if (SpeechService.recognitionSessionId !== currentSession) return;
        const errType = event.error;
        console.warn('[Speech] ⚠ Recognition error:', errType, event.message || '');

        // Non-fatal notifications
        if (errType === 'no-speech' || errType === 'aborted') {
          return;
        }

        let friendly = '';
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          friendly =
            'Akses mikrofon diblokir oleh browser. Silakan klik ikon gembok di sebelah URL browser dan ubah Mikrofon menjadi "Izinkan" (Allow).';
        } else if (errType === 'audio-capture') {
          friendly = 'Perangkat mikrofon tidak terdeteksi. Pastikan mikrofon terpasang dan aktif.';
        } else if (errType === 'network') {
          friendly = 'Layanan pengenalan suara browser memerlukan koneksi internet aktif.';
        } else if (errType === 'language-not-supported') {
          friendly = 'Bahasa id-ID belum didukung oleh browser Anda.';
        } else {
          friendly = `Kesalahan pengenalan suara: ${errType}`;
        }

        if (friendly && onError) {
          onError(friendly);
        }
      };

      recognition.onend = () => {
        console.log('[Speech] Recognition onend. isExplicitlyStopped:', isExplicitlyStopped, 'hasDelivered:', hasDelivered);
        if (SpeechService.recognitionSessionId !== currentSession) return;

        // If user has spoken something, deliver it now!
        if (accumulatedFinalText.trim() || currentInterimText.trim()) {
          finishAndDeliver();
        }

        cleanup();
      };

      console.log('[Speech] Calling recognition.start()...');
      recognition.start();
      console.log('[Speech] ✓ recognition.start() called successfully');
    } catch (err) {
      console.error('[Speech] ✗ Recognition start FAILED:', err);
      cleanup();
    }

    return () => {
      console.log('[Speech] ■ Manual stop requested');
      finishAndDeliver();
      cleanup();
    };
  }
}
