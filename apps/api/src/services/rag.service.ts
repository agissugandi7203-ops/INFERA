import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseService } from './supabase.service.js';
import { openRouterService } from './openrouter.service.js';
import type {
  RegulationChunk,
  RagSearchResult,
  RagSearchRequest,
  RegulationCategory,
} from '@healthathon/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to cached embeddings
const CACHE_PATH = path.resolve(__dirname, '../../../../data/regulations/regulations_embeddings_cache.json');
const CHUNKS_PATH = path.resolve(__dirname, '../../../../data/regulations/regulations_chunks.json');

function cosineSimilarity(v1: number[], v2: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < v1.length; i++) {
    const a = v1[i] ?? 0;
    const b = v2[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

class RagService {
  private localChunks: RegulationChunk[] = [];
  private isLoaded = false;

  constructor() {
    this.loadLocalKnowledgeBase();
  }

  private loadLocalKnowledgeBase() {
    try {
      if (fs.existsSync(CACHE_PATH)) {
        const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
        this.localChunks = JSON.parse(raw);
        this.isLoaded = true;
      } else if (fs.existsSync(CHUNKS_PATH)) {
        const raw = fs.readFileSync(CHUNKS_PATH, 'utf-8');
        this.localChunks = JSON.parse(raw);
        this.isLoaded = true;
      }
    } catch (err) {
      console.warn('[RagService] Could not load local regulation files:', err);
    }
  }

  public getAllRegulations(): RegulationChunk[] {
    return this.localChunks;
  }

  public async search(request: RagSearchRequest): Promise<RagSearchResult[]> {
    const {
      query,
      matchThreshold = 0.35,
      matchCount = 3,
      filterCategory,
    } = request;

    if (!query || query.trim() === '') {
      return [];
    }

    const supabase = supabaseService.getClient();

    // 1. Try Supabase pgvector RPC first if configured
    if (supabase && supabaseService.hasCredentials()) {
      try {
        const queryEmbedding = await openRouterService.getEmbedding(query);
        const { data, error } = await supabase.rpc('match_jkn_regulations', {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
          filter_category: filterCategory || null,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            title: row.title,
            regulation: row.regulation,
            article: row.article,
            category: row.category as RegulationCategory,
            content: row.content,
            similarity: Number(row.similarity),
          }));
        }
      } catch (err) {
        // Fall back gracefully to local vector search
      }
    }

    // 2. High-speed In-Memory Cosine Similarity Fallback
    try {
      const queryEmbedding = await openRouterService.getEmbedding(query);
      const scored: RagSearchResult[] = [];

      for (const chunk of this.localChunks) {
        if (filterCategory && chunk.category !== filterCategory) {
          continue;
        }

        if (chunk.embedding && chunk.embedding.length > 0) {
          const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
          if (sim >= matchThreshold) {
            scored.push({
              id: chunk.id,
              title: chunk.title,
              regulation: chunk.regulation,
              article: chunk.article,
              category: chunk.category,
              content: chunk.content,
              similarity: Math.round(sim * 10000) / 10000,
            });
          }
        }
      }

      scored.sort((a, b) => b.similarity - a.similarity);
      return scored.slice(0, matchCount);
    } catch (err) {
      // 3. Fallback to keyword matching if embedding service fails
      return this.fallbackKeywordSearch(query, matchCount, filterCategory);
    }
  }

  private fallbackKeywordSearch(
    query: string,
    matchCount: number,
    filterCategory?: RegulationCategory
  ): RagSearchResult[] {
    const qWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const scored: RagSearchResult[] = [];

    for (const chunk of this.localChunks) {
      if (filterCategory && chunk.category !== filterCategory) {
        continue;
      }

      let matches = 0;
      const haystack = `${chunk.title} ${chunk.content} ${(chunk.keywords || []).join(' ')}`.toLowerCase();
      for (const word of qWords) {
        if (haystack.includes(word)) {
          matches++;
        }
      }

      if (matches > 0) {
        scored.push({
          id: chunk.id,
          title: chunk.title,
          regulation: chunk.regulation,
          article: chunk.article,
          category: chunk.category,
          content: chunk.content,
          similarity: Math.min(0.9, matches / Math.max(qWords.length, 1)),
        });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, matchCount);
  }

  public formatCitationsForPrompt(results: RagSearchResult[]): string {
    if (results.length === 0) return '';

    return (
      '\n[REFERENSI HUKUM & REGULASI RESMI JKN TERKAIT]:\n' +
      results
        .map(
          (r, idx) =>
            `${idx + 1}. ${r.regulation} ${r.article ? `(${r.article})` : ''} — ${r.title}\n   ${r.content}`
        )
        .join('\n\n')
    );
  }
}

export const ragService = new RagService();
