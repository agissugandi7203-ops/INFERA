import {
  API_V2_PREFIX,
  CUTE_ANIME_VOICE_ID,
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
  onError?: (error: string) => void;
}

export class RealtimeVoiceService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mouthInterval: number | null = null;

  private state: RealtimeConnectionState = 'disconnected';
  private listeners: RealtimeVoiceListeners = {};
  private executionContext?: ToolExecutionContext;
  private currentUserTranscript = '';
  private bufferedUserText = '';
  private currentAssistantTranscript = '';
  private lastMouthOpen = 0;

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
    return this.state === 'connected' || this.state === 'listening' || this.state === 'speaking';
  }

  private setState(newState: RealtimeConnectionState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.listeners.onStateChange?.(newState);
  }

  /**
   * Connect to OpenAI Realtime Voice via WebRTC
   * Uses direct SDP exchange with GPT-Live & custom anime voice (voice_6ae35d565f908191a5b73228455d503f)
   */
  public async connect(voice: RealtimeVoiceName = DEFAULT_REALTIME_VOICE): Promise<void> {
    if (this.isConnected() || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');
    this.listeners.onEmotionChange?.('listening');

    try {
      // Step 1: Acquire User Microphone with studio-quality constraints (disable telephone AGC)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 1,
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

      // Add local microphone audio track to WebRTC connection
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, stream);
      }

      // Step 3: Setup SCTP DataChannel (live-events & oai-events) for JSON transcripts & events
      const dc = pc.createDataChannel('live-events');
      this.dataChannel = dc;
      this.setupDataChannel(dc);

      // Step 4: Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Step 5: Send SDP offer to Backend v2 (which connects to OpenAI Live Sessions with custom voice)
      const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v[12]\/?$/, '').replace(/\/+$/, '');
      const authHeaders = await getAuthHeaders();

      const res = await fetch(`${rawApiUrl}${API_V2_PREFIX}/voice/realtime-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          voice: voice || CUTE_ANIME_VOICE_ID,
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

      this.setState('connected');
      this.listeners.onEmotionChange?.('normal');
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
    if (this.mouthInterval) {
      clearInterval(this.mouthInterval);
      this.mouthInterval = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
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

    this.currentAssistantTranscript = '';
    this.lastMouthOpen = 0;
    this.listeners.onMouthOpen?.(0);
    this.listeners.onEmotionChange?.('normal');
    this.setState('disconnected');
  }

  /**
   * Sends an intentional text message via the DataChannel
   */
  public sendTextMessage(text: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[RealtimeVoice] DataChannel is not open, cannot send text message');
      return;
    }

    const event = {
      type: 'conversation.item.create',
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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 48000, latencyHint: 'interactive' });
      this.audioContext = audioCtx;

      // Resume context if browser suspended it
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(remoteStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      // Connect source to audioCtx.destination directly for full 48kHz wideband audio output!
      // This bypasses the narrow-band telephony/communications filter in Chrome and Windows.
      source.connect(audioCtx.destination);

      // Keep muted HTMLAudioElement to satisfy browser WebRTC autoplay permission policy
      const audioEl = new Audio();
      audioEl.srcObject = remoteStream;
      audioEl.muted = true;
      audioEl.autoplay = true;
      audioEl.play().catch(() => {});
      this.audioElement = audioEl;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Sample RMS amplitude every 30ms for 60 FPS mouth flap sync
      this.mouthInterval = window.setInterval(() => {
        if (this.state !== 'speaking') {
          if (this.lastMouthOpen > 0) {
            this.lastMouthOpen = 0;
            this.listeners.onMouthOpen?.(0);
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // Map audio level (0-255) to mouth flap value (0.0 to 1.0)
        const mouthOpen = Math.min(1.0, Math.max(0, (avg - 8) / 75));
        this.lastMouthOpen = mouthOpen;
        this.listeners.onMouthOpen?.(mouthOpen);
      }, 30);
    } catch (err) {
      console.warn('[RealtimeVoice] Web Audio pipeline warning:', err);
    }
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      console.log('[RealtimeVoice] DataChannel opened');
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

  private async handleDataChannelMessage(msg: Record<string, unknown>): Promise<void> {
    const type = String(msg.type || '');

    // 1. User starts speaking -> Instant Barge-in!
    if (type === 'input_audio_buffer.speech_started' || type === 'session.input_speech.started') {
      this.setState('listening');
      this.currentUserTranscript = '';
      this.listeners.onMouthOpen?.(0);
      this.listeners.onEmotionChange?.('listening');
      this.listeners.onLiveSpeechText?.('');
      return;
    }

    // 2. User stopped speaking
    if (type === 'input_audio_buffer.speech_stopped' || type === 'session.input_speech.stopped') {
      this.setState('connected');
      this.listeners.onEmotionChange?.('thinking');
      return;
    }

    // 3. User Audio Transcription Streaming Deltas (Update live speech preview pill, NEVER spam chat bubbles)
    if (type === 'session.input_transcript.delta') {
      const delta = String(msg.delta || '');
      this.currentUserTranscript += delta;
      if (this.currentUserTranscript.trim()) {
        this.listeners.onLiveSpeechText?.(this.currentUserTranscript.trim());
      }
      return;
    }

    // 3b. Finalized User Speech Transcription (Buffer to prevent fragmented bubbles)
    if (type === 'conversation.item.input_audio_transcription.completed' || type === 'session.input_transcript.done') {
      const seg = (String(msg.transcript || '') || this.currentUserTranscript).trim();
      this.currentUserTranscript = '';
      this.listeners.onLiveSpeechText?.('');
      if (seg) {
        if (this.bufferedUserText) {
          this.bufferedUserText += ' ' + seg;
        } else {
          this.bufferedUserText = seg;
        }
      }
      return;
    }

    // Flush buffered user transcript as a single message right when assistant response begins
    if (this.bufferedUserText && (type.startsWith('response.') || type.startsWith('session.output_'))) {
      const consolidatedUserText = this.bufferedUserText.trim();
      this.bufferedUserText = '';
      if (consolidatedUserText) {
        this.listeners.onTranscript?.({
          id: 'user-' + Date.now(),
          role: 'user',
          text: consolidatedUserText,
          timestamp: new Date().toISOString(),
          isFinal: true,
        });
      }
    }

    // 4. Assistant Audio Transcript Streaming & Completion
    if (type === 'response.audio_transcript.delta' || type === 'session.output_transcript.delta') {
      this.setState('speaking');
      this.listeners.onEmotionChange?.('speaking');
      this.currentAssistantTranscript += String(msg.delta || '');
      return;
    }

    if (type === 'response.audio_transcript.done' || type === 'session.output_transcript.done') {
      const fullTranscript = (this.currentAssistantTranscript || String(msg.transcript || '')).trim();
      this.currentAssistantTranscript = '';
      if (fullTranscript) {
        this.listeners.onTranscript?.({
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          text: fullTranscript,
          timestamp: new Date().toISOString(),
          isFinal: true,
        });
      }
      this.setState('connected');
      this.listeners.onMouthOpen?.(0);
      this.listeners.onEmotionChange?.('normal');
      return;
    }

    // 5. Function Calling Dispatcher
    if (type === 'response.function_call_arguments.done') {
      await this.handleToolCall(msg);
      return;
    }

    // 6. Generic Error from OpenAI Gateway
    if (type === 'error') {
      const errObj = (msg.error as Record<string, unknown>) || {};
      const errorMsg = String(errObj.message || 'Kesalahan gateway OpenAI');
      console.warn('[RealtimeVoice] Gateway error event:', errorMsg);
      this.listeners.onError?.(errorMsg);
    }
  }

  private async handleToolCall(event: Record<string, unknown>): Promise<void> {
    const callId = String(event.call_id || '');
    const name = String(event.name || '');
    const argsStr = String(event.arguments || '{}');

    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(argsStr);
    } catch {
      parsedArgs = {};
    }

    console.log(`[RealtimeVoice] Invoking tool "${name}" via DataChannel:`, parsedArgs);
    this.listeners.onEmotionChange?.('thinking');

    try {
      const result = await executeInferaTool(name, parsedArgs, this.executionContext);

      // If an action recommendation was produced (e.g. suspension / warning letter), notify UI
      if (result.recommendation) {
        this.listeners.onActionRecommendation?.(result.recommendation);
      }

      // If critical fraud detected, express surprise/alert on Luna's face
      if (result.summary.toLowerCase().includes('critical') || result.summary.toLowerCase().includes('anomali')) {
        this.listeners.onEmotionChange?.('surprised');
      }

      // Send tool execution output back to OpenAI
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        const toolOutputEvent = {
          type: 'conversation.item.create',
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

        // Request OpenAI to formulate verbal response from tool output
        this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
      }
    } catch (err: unknown) {
      console.error(`[RealtimeVoice] Tool execution failed for "${name}":`, err);
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(
          JSON.stringify({
            type: 'conversation.item.create',
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
