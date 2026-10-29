/**
 * Realtime WebRTC & Speech-to-Speech Contracts
 * Single source of truth for OpenAI Realtime API v2 integration
 */

export type RealtimeVoiceName =
  | 'coral'   // FERA Natural Anime Indonesian (Default Resmi OpenAI)
  | 'shimmer' // Luna Cute Anime (Alternatif)
  | 'alloy'   // Neutral, precise
  | 'echo'    // Male, formal
  | 'ballad'  // Warm, storytelling
  | 'sage'    // Authoritative, calm
  | 'verse'   // Expressive
  | 'marin'   // Modern, conversational
  | 'cedar'   // Modern, deep
  | 'voice_6ae35f4fc2388191a0b2f21060b4e417' // Legacy custom alias (auto-mapped to coral)
  | (string & {});

export interface RealtimeSessionRequestDTO {
  voice?: RealtimeVoiceName;
  model?: string;
  userRole?: 'auditor' | 'analyst' | 'admin';
}

export interface RealtimeSessionResponseDTO {
  sessionId: string;
  clientSecret: string;
  expiresAt: number;
  model: string;
  voice: RealtimeVoiceName;
}

export type RealtimeConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error';

export interface RealtimeTranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export interface RealtimeToolCallEvent {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface RealtimeToolCallResult {
  callId: string;
  output: string;
}
