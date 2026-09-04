/**
 * INFERA — Supabase pgvector RAG Knowledge Base Types
 */

export type RegulationCategory =
  | 'DEFINISI_HUKUM'
  | 'SISTEM_PENCEGAHAN'
  | 'TIM_INVESTIGASI'
  | 'SANKSI_HUKUM'
  | 'TIPOLOGI_FRAUD'
  | 'PEDOMAN_KODING'
  | 'SPESIFIKASI_API'
  | 'SISTEM_BPJS'
  | 'KEBIJAKAN_TERKINI'
  | 'STUDI_KASUS_AUDIT';

export interface RegulationChunk {
  id: string;
  title: string;
  regulation: string;
  chapter?: string;
  article?: string;
  category: RegulationCategory;
  keywords: string[];
  content: string;
  embedding?: number[];
  createdAt?: string;
}

export interface RagSearchRequest {
  query: string;
  matchThreshold?: number; // Default 0.60
  matchCount?: number; // Default 3
  filterCategory?: RegulationCategory;
}

export interface RagSearchResult {
  id: string;
  title: string;
  regulation: string;
  article?: string;
  category: RegulationCategory;
  content: string;
  similarity: number;
}
