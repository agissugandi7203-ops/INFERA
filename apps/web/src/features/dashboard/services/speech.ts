export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static lipSyncInterval: number | null = null;
  private static currentAudio: HTMLAudioElement | null = null;

  public static isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static isRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  public static stopSpeaking(): void {
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
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Speak using ElevenLabs TTS if apiKey provided, otherwise fallback to Web Speech API.
   */
  public static async speak(
    text: string,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void,
    elevenLabsApiKey?: string,
    elevenLabsVoiceId = 'cgSgspJ2msm6clMCkdW9'
  ): Promise<void> {
    this.stopSpeaking();

    // Clean text for speech (remove markdown formatting that sounds bad in TTS)
    const cleanText = text
      .replace(/[*_#`~\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // ElevenLabs is the primary voice engine.
    // Only fallback to Web Speech if API key is completely absent.
    if (elevenLabsApiKey && elevenLabsApiKey.trim().length > 5) {
      try {
        const audioBlob = await this.fetchElevenLabsAudio(cleanText, elevenLabsApiKey.trim(), elevenLabsVoiceId);
        await this.playAudioWithLipSync(audioBlob, onLipSync, onStart, onEnd);
        return;
      } catch (err) {
        console.error('[Speech] ElevenLabs TTS gagal, menggunakan fallback anime web speech:', err);
        // Still fallback so the user isn't left in silence
        this.speakWithWebSpeech(cleanText, onLipSync, onStart, onEnd);
        return;
      }
    }

    // No ElevenLabs key configured — use browser Web Speech as last resort
    this.speakWithWebSpeech(cleanText, onLipSync, onStart, onEnd);
  }

  private static async fetchElevenLabsAudio(
    text: string,
    apiKey: string,
    voiceId: string
  ): Promise<Blob> {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ElevenLabs Error (${res.status}): ${errText}`);
    }

    return await res.blob();
  }

  private static async playAudioWithLipSync(
    blob: Blob,
    onLipSync: (mouthOpen: number) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    const url = URL.createObjectURL(blob);
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
      if (onStart) onStart();
      startFlap();
    };

    audio.onended = () => {
      this.stopSpeaking();
      onLipSync(0);
      URL.revokeObjectURL(url);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      this.stopSpeaking();
      onLipSync(0);
      URL.revokeObjectURL(url);
      if (onEnd) onEnd();
    };

    try {
      await audio.play();
    } catch (playErr) {
      console.warn('[Speech] Audio playback blocked or failed, settling state:', playErr);
      this.stopSpeaking();
      onLipSync(0);
      URL.revokeObjectURL(url);
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

    utterance.onstart = () => {
      if (onStart) onStart();

      let phase = 0;
      this.lipSyncInterval = window.setInterval(() => {
        phase += 0.22;
        const base = Math.sin(phase * 1.5) * 0.45 + Math.sin(phase * 0.7) * 0.35 + 0.2;
        const mouthOpen = Math.max(0.12, Math.min(0.85, base));
        onLipSync(mouthOpen);
      }, 65);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        onLipSync(0.75);
      }
    };

    utterance.onend = () => {
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn('Speech synthesis error:', err);
      this.stopSpeaking();
      onLipSync(0);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public static startListening(
    onResult: (transcript: string) => void,
    onStateChange?: (isListening: boolean) => void,
    onError?: (error: string) => void,
    onSoundDetected?: (isSoundActive: boolean) => void
  ): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Browser Anda tidak mendukung Speech Recognition.');
      return () => {};
    }

    try {
      const recognition = new SpeechRecognition();
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          onResult(transcript.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (onError) onError(event.error);
        if (onStateChange) onStateChange(false);
        if (onSoundDetected) onSoundDetected(false);
      };

      recognition.onend = () => {
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
        if (onStateChange) onStateChange(false);
      };
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      if (onError) onError(err instanceof Error ? err.message : 'Gagal mengakses mikrofon.');
      if (onStateChange) onStateChange(false);
      return () => {};
    }
  }
}
