import {
  API_V2_PREFIX,
  DEFAULT_REALTIME_VOICE,
  type RealtimeConnectionState,
  type RealtimeTranscriptItem,
  type RealtimeVoiceName,
  type ActionRecommendation,
} from '@healthathon/shared';
import type { CharacterEmotion } from '../avatar/AvatarController';
import { executeInferaTool, type ToolExecutionContext } from './tools/toolRegistry';
import { getAuthHeaders } from '../../../lib/supabase';

export interface RealtimeVoiceListeners {
  onStateChange?: (state: RealtimeConnectionState) => void;
  onMouthOpen?: (mouthOpen: number) => void;
  onEmotionChange?: (emotion: CharacterEmotion) => void;
  onTranscript?: (item: RealtimeTranscriptItem) => void;
  onLiveSpeechText?: (liveText: string) => void;
  onActionRecommendation?: (recommendation: ActionRecommendation) => void;
  onNavigate?: (route: string) => void;
  onError?: (error: string) => void;
}

export class RealtimeVoiceService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mouthInterval: number | null = null;
  private userTranscriptTimer: number | null = null;
  private assistantTranscriptTimer: number | null = null;

  private state: RealtimeConnectionState = 'disconnected';
  private listeners: RealtimeVoiceListeners = {};
  private executionContext?: ToolExecutionContext;
  private currentUserTranscript = '';
  private currentAssistantTranscript = '';
  private handledCallIds = new Set<string>();
  private lastMouthOpen = 0;
  private silentTicks = 0;

  constructor(listeners: RealtimeVoiceListeners = {}) {
    this.listeners = listeners;
  }

  public setListeners(listeners: RealtimeVoiceListeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public setExecutionContext(ctx?: ToolExecutionContext): void {
    this.executionContext = ctx;
  }

  public getState(): RealtimeConnectionState {
    return this.state;
  }

  public isConnected(): boolean {
    return (
      this.state === 'connecting' ||
      this.state === 'connected' ||
      this.state === 'listening' ||
      this.state === 'speaking'
    );
  }

  private setState(newState: RealtimeConnectionState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.listeners.onStateChange?.(newState);
  }

  /**
   * Cleanup any orphaned WebRTC <audio> elements or previous HMR service instances
   */
  private cleanupOrphanedAudio(): void {
    try {
      const win = window as unknown as { __inferaRealtimeService?: RealtimeVoiceService };
      if (win.__inferaRealtimeService && win.__inferaRealtimeService !== this) {
        try {
          win.__inferaRealtimeService.disconnect();
        } catch {
          // ignore
        }
      }
      win.__inferaRealtimeService = this;

      document.querySelectorAll('audio').forEach((el) => {
        if (el !== this.audioElement) {
          try {
            el.pause();
            el.srcObject = null;
            el.remove();
          } catch {
            // ignore
          }
        }
      });
    } catch {
      // ignore
    }
  }

  /**
   * Connect to OpenAI Live Sessions (gpt-live-1) via WebRTC
   */
  public async connect(voice: RealtimeVoiceName = DEFAULT_REALTIME_VOICE): Promise<void> {
    if (this.isConnected()) {
      return;
    }

    // Ensure any previous HMR instance or orphaned audio elements are killed first
    this.cleanupOrphanedAudio();

    this.setState('connecting');
    this.listeners.onEmotionChange?.('listening');
    this.listeners.onLiveSpeechText?.('Menghubungkan suara FERA...');

    try {
      // Pre-initialize and unlock AudioContext using native OS sample rate (no forced 48kHz resampling!)
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume().catch(() => {});
      }

      // Step 1: Acquire User Microphone with native sample rate & autoGainControl
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.localStream = stream;

      // Step 2: Initialize RTCPeerConnection
      const pc = new RTCPeerConnection();
      this.peerConnection = pc;

      // Stream remote audio to speaker & Lip-Sync analyser
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteStream) {
          this.setupAudioPipeline(remoteStream);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          this.disconnect();
        }
      };

      // Add local microphone audio track to WebRTC connection
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, stream);
      }

      // Step 3: Setup SCTP DataChannel ('live-events') for JSON transcripts & tool call events
      const dc = pc.createDataChannel('live-events');
      this.dataChannel = dc;
      this.setupDataChannel(dc);

      // Step 4: Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Step 5: Send SDP offer to Backend v2 (which connects to OpenAI Live Sessions with gpt-live-1)
      const rawApiUrl = (import.meta.env.VITE_API_URL || '')
        .replace(/\/api\/v[12]\/?$/, '')
        .replace(/\/+$/, '');
      const authHeaders = await getAuthHeaders();

      const res = await fetch(`${rawApiUrl}${API_V2_PREFIX}/voice/realtime-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          voice: voice || DEFAULT_REALTIME_VOICE,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      const resJson = await res.json();
      const answerSdp = resJson.data?.sdp;

      if (!answerSdp) {
        throw new Error('Backend tidak mengembalikan SDP answer.');
      }

      // Step 6: Set Remote Description with SDP Answer from OpenAI
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      // Keep state in 'listening' so the visual indicator stays active while duplex mic is open
      this.setState('listening');
      this.listeners.onEmotionChange?.('listening');
      this.listeners.onLiveSpeechText?.('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[RealtimeVoiceService] Connection error:', errorMsg);
      this.disconnect();
      this.setState('error');
      this.listeners.onError?.(errorMsg);
      this.listeners.onEmotionChange?.('confused');
    }
  }

  /**
   * Disconnect and release all WebRTC and Web Audio resources cleanly
   */
  public disconnect(): void {
    this.flushUserTranscript();
    this.flushAssistantTranscript();

    if (this.userTranscriptTimer) {
      clearTimeout(this.userTranscriptTimer);
      this.userTranscriptTimer = null;
    }

    if (this.assistantTranscriptTimer) {
      clearTimeout(this.assistantTranscriptTimer);
      this.assistantTranscriptTimer = null;
    }

    if (this.mouthInterval) {
      clearInterval(this.mouthInterval);
      this.mouthInterval = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      this.audioElement = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch {
        // ignore
      }
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {
        // ignore
      }
      this.peerConnection = null;
    }

    this.currentUserTranscript = '';
    this.currentAssistantTranscript = '';
    this.handledCallIds.clear();
    this.lastMouthOpen = 0;
    this.silentTicks = 0;
    this.listeners.onLiveSpeechText?.('');
    this.listeners.onMouthOpen?.(0);
    this.listeners.onEmotionChange?.('normal');
    this.setState('disconnected');
  }

  /**
   * Sends an intentional text message via the DataChannel (GPT-Live format)
   */
  public sendTextMessage(text: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[RealtimeVoice] DataChannel is not open, cannot send text message');
      return;
    }

    const event = {
      type: 'response.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    };

    this.dataChannel.send(JSON.stringify(event));
    this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
  }

  private setupAudioPipeline(remoteStream: MediaStream): void {
    try {
      // 1. Primary native WebRTC audio playback via unmuted HTMLAudioElement in DOM
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.srcObject = null;
        if (this.audioElement.parentNode) {
          this.audioElement.parentNode.removeChild(this.audioElement);
        }
      }

      const audioEl = document.createElement('audio');
      audioEl.setAttribute('data-infera-webrtc', 'true');
      audioEl.srcObject = remoteStream;
      audioEl.autoplay = true;
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioEl.setAttribute('playsinline', 'true');
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      this.audioElement = audioEl;
      this.cleanupOrphanedAudio();
      audioEl.play().catch((e) => {
        console.warn('[RealtimeVoice] AudioElement play warning:', e);
      });

      // 2. Web Audio API AnalyserNode (native OS sample rate, connected ONLY to analyser)
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx =
        this.audioContext && this.audioContext.state !== 'closed'
          ? this.audioContext
          : new AudioCtx();
      this.audioContext = audioCtx;

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const source = audioCtx.createMediaStreamSource(remoteStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.35;
      source.connect(analyser);

      // Single-path +10 dB (3.2x) Volume Booster & Limiter:
      // Set audioEl.volume = 0 while audioCtx is running so Chromium decodes the WebRTC stream
      // WITHOUT outputting a second copy from audioEl (zero double-voice / zero echo!).
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 3.2;

      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;

      source.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(audioCtx.destination);

      const syncSingleOutputPath = () => {
        if (audioCtx.state === 'running') {
          audioEl.volume = 0;
        } else {
          audioEl.volume = 1.0;
        }
      };
      audioCtx.onstatechange = syncSingleOutputPath;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(syncSingleOutputPath).catch(() => {});
      }
      syncSingleOutputPath();

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      if (this.mouthInterval) {
        clearInterval(this.mouthInterval);
      }

      // 3. Drive 60 FPS mouth flap & speaking state directly from Web Audio RMS energy
      // (Per GPT-Live migration playbook: gpt-live-1 does not emit explicit audio-done events)
      this.mouthInterval = window.setInterval(() => {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        if (avg > 9) {
          this.silentTicks = 0;
          if (this.state !== 'speaking') {
            this.setState('speaking');
            this.listeners.onEmotionChange?.('speaking');
          }
          const mouthOpen = Math.min(1.0, Math.max(0.08, (avg - 8) / 62));
          this.lastMouthOpen = mouthOpen;
          this.listeners.onMouthOpen?.(mouthOpen);
        } else {
          if (this.lastMouthOpen > 0) {
            this.lastMouthOpen = 0;
            this.listeners.onMouthOpen?.(0);
          }
          this.silentTicks += 1;
          // After ~650ms of silence following assistant speech, return to active 'listening' state
          if (this.state === 'speaking' && this.silentTicks > 22) {
            this.setState('listening');
            this.listeners.onEmotionChange?.('listening');
          }
        }
      }, 30);
    } catch (err) {
      console.warn('[RealtimeVoice] Web Audio pipeline warning:', err);
    }
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      console.log('[RealtimeVoice] DataChannel (live-events) opened');
      this.setState('listening');
      this.listeners.onEmotionChange?.('listening');
    };

    dc.onclose = () => {
      console.log('[RealtimeVoice] DataChannel closed');
    };

    dc.onerror = (err) => {
      console.error('[RealtimeVoice] DataChannel error:', err);
    };

    dc.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleDataChannelMessage(msg);
      } catch (err) {
        console.warn('[RealtimeVoice] Error parsing DataChannel event:', err);
      }
    };
  }

  private flushUserTranscript(): void {
    if (this.userTranscriptTimer) {
      clearTimeout(this.userTranscriptTimer);
      this.userTranscriptTimer = null;
    }
    const text = this.currentUserTranscript.trim();
    if (!text) return;
    this.currentUserTranscript = '';
    this.listeners.onLiveSpeechText?.('');
    this.listeners.onTranscript?.({
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      isFinal: true,
    });
  }

  private flushAssistantTranscript(): void {
    if (this.assistantTranscriptTimer) {
      clearTimeout(this.assistantTranscriptTimer);
      this.assistantTranscriptTimer = null;
    }
    const text = this.currentAssistantTranscript.trim();
    if (!text) return;
    this.currentAssistantTranscript = '';
    this.listeners.onLiveSpeechText?.('');
    this.listeners.onTranscript?.({
      id: 'assistant-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'assistant',
      text,
      timestamp: new Date().toISOString(),
      isFinal: true,
    });
  }

  private async handleDataChannelMessage(msg: Record<string, unknown>): Promise<void> {
    const type = String(msg.type || '');

    // 1. User Audio Transcription Streaming Deltas (gpt-live-1 emits session.input_transcript.delta)
    if (type === 'session.input_transcript.delta') {
      // If assistant transcript was buffered from previous turn, flush it first
      if (this.currentAssistantTranscript.trim()) {
        this.flushAssistantTranscript();
      }

      const delta = String(msg.delta || '');
      this.currentUserTranscript += delta;
      if (this.currentUserTranscript.trim()) {
        this.listeners.onLiveSpeechText?.(this.currentUserTranscript.trim());
      }

      if (this.userTranscriptTimer) {
        clearTimeout(this.userTranscriptTimer);
      }
      this.userTranscriptTimer = window.setTimeout(() => {
        this.flushUserTranscript();
      }, 950);
      return;
    }

    // Legacy / Fallback input transcript done
    if (
      type === 'conversation.item.input_audio_transcription.completed' ||
      type === 'session.input_transcript.done'
    ) {
      const seg = String(msg.transcript || '').trim();
      if (seg && !this.currentUserTranscript.includes(seg)) {
        this.currentUserTranscript = (this.currentUserTranscript + ' ' + seg).trim();
      }
      this.flushUserTranscript();
      return;
    }

    // 2. Delegation Created -> User finished speaking, backend reasoning started
    if (type === 'session.delegation.created') {
      this.flushUserTranscript();
      this.listeners.onEmotionChange?.('thinking');
      return;
    }

    // 3. Assistant Audio Transcript Streaming Deltas (gpt-live-1 emits session.output_transcript.delta)
    if (type === 'session.output_transcript.delta' || type === 'response.audio_transcript.delta') {
      // Ensure user transcript appears before assistant reply
      if (this.currentUserTranscript.trim()) {
        this.flushUserTranscript();
      }

      this.setState('speaking');
      this.listeners.onEmotionChange?.('speaking');

      const delta = String(msg.delta || '');
      this.currentAssistantTranscript += delta;
      if (this.currentAssistantTranscript.trim()) {
        this.listeners.onLiveSpeechText?.(this.currentAssistantTranscript.trim());
      }

      if (this.assistantTranscriptTimer) {
        clearTimeout(this.assistantTranscriptTimer);
      }
      this.assistantTranscriptTimer = window.setTimeout(() => {
        this.flushAssistantTranscript();
      }, 1100);
      return;
    }

    // Legacy / Fallback output transcript done
    if (type === 'response.audio_transcript.done' || type === 'session.output_transcript.done') {
      const seg = String(msg.transcript || '').trim();
      if (seg && !this.currentAssistantTranscript) {
        this.currentAssistantTranscript = seg;
      }
      this.flushAssistantTranscript();
      return;
    }

    // 4. GPT-Live Delegated Responses Event Envelope (Tool Calls & Reasoning)
    if (type === 'response.event' && msg.event && typeof msg.event === 'object') {
      if (this.currentUserTranscript.trim()) {
        this.flushUserTranscript();
      }

      const innerEvent = msg.event as Record<string, unknown>;
      const innerType = String(innerEvent.type || '');

      if (
        innerType === 'response.output_item.done' &&
        innerEvent.item &&
        typeof innerEvent.item === 'object'
      ) {
        const item = innerEvent.item as Record<string, unknown>;
        if (item.type === 'function_call') {
          await this.handleToolCall(item);
        }
      }
      return;
    }

    // 5. Legacy Function Calling Dispatcher
    if (type === 'response.function_call_arguments.done') {
      await this.handleToolCall(msg);
      return;
    }

    // 6. Generic Error from OpenAI Gateway
    if (type === 'error' || type === 'session.error') {
      const errObj = (msg.error as Record<string, unknown>) || {};
      const errorMsg = String(errObj.message || msg.message || 'Kesalahan gateway OpenAI Live');
      console.warn('[RealtimeVoice] Gateway error event:', errorMsg);
      this.listeners.onError?.(errorMsg);
    }
  }

  private async handleToolCall(event: Record<string, unknown>): Promise<void> {
    const callId = String(event.call_id || '');
    const name = String(event.name || '');
    const argsStr = String(event.arguments || '{}');

    if (!callId || !name) return;
    if (this.handledCallIds.has(callId)) return;
    this.handledCallIds.add(callId);

    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(argsStr);
    } catch {
      parsedArgs = {};
    }

    console.log(`[RealtimeVoice] Invoking tool "${name}" (${callId}) via DataChannel:`, parsedArgs);
    this.listeners.onEmotionChange?.('thinking');
    this.listeners.onLiveSpeechText?.(`Menjalankan ${name.replace(/_/g, ' ')}...`);

    try {
      const result = await executeInferaTool(name, parsedArgs, this.executionContext);

      // 1. Handle page navigation tool immediately
      if (name === 'navigate_to_workflow' && result.success) {
        const targetRoute =
          (result.data as { targetRoute?: string })?.targetRoute ||
          String(parsedArgs.route || '/dashboard');
        this.listeners.onNavigate?.(targetRoute);
      }

      // 2. If an action recommendation was produced (e.g. suspension / warning letter), notify UI
      if (result.recommendation) {
        this.listeners.onActionRecommendation?.(result.recommendation);
      }

      // 3. If critical fraud detected, express surprise/alert on FERA's face
      if (
        result.summary.toLowerCase().includes('critical') ||
        result.summary.toLowerCase().includes('anomali')
      ) {
        this.listeners.onEmotionChange?.('surprised');
      }

      // 4. Send tool execution output back to OpenAI Live Sessions (response.item.create + response.create)
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        const toolOutputEvent = {
          type: 'response.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify({
              success: result.success,
              summary: result.summary,
              data: result.data,
              error: result.error,
            }),
          },
        };

        this.dataChannel.send(JSON.stringify(toolOutputEvent));
        this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
      }
    } catch (err: unknown) {
      console.error(`[RealtimeVoice] Tool execution failed for "${name}":`, err);
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(
          JSON.stringify({
            type: 'response.item.create',
            item: {
              type: 'function_call_output',
              call_id: callId,
              output: JSON.stringify({
                success: false,
                summary: 'Gagal mengeksekusi fungsi analitik internal.',
                error: String(err),
              }),
            },
          })
        );
        this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
      }
    }
  }
}
