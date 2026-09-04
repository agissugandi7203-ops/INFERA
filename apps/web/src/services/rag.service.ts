import type { RegulationChunk, RagSearchResult, RagSearchRequest } from '@healthathon/shared';
import { JKN_REGULATIONS_CHUNKS } from '../data/regulationsData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export class WebRagService {
  public getAllRegulations(): RegulationChunk[] {
    return JKN_REGULATIONS_CHUNKS;
  }

  public async search(request: RagSearchRequest): Promise<RagSearchResult[]> {
    const { query, matchCount = 3, filterCategory } = request;
    if (!query || query.trim() === '') return [];

    // 1. Try Backend RAG Endpoint
    try {
      const url = new URL(`${API_BASE_URL}/rag/search`);
      url.searchParams.set('query', query);
      if (matchCount) url.searchParams.set('limit', String(matchCount));
      if (filterCategory) url.searchParams.set('category', filterCategory);

      const res = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (err) {
      // Backend unavailable or network failure; fall back to local search
    }

    // 2. Client-side In-Memory Fallback
    return this.clientFallbackSearch(query, matchCount, filterCategory);
  }

  private clientFallbackSearch(
    query: string,
    limit: number,
    filterCategory?: string
  ): RagSearchResult[] {
    const qTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const scored: RagSearchResult[] = [];

    for (const chunk of JKN_REGULATIONS_CHUNKS) {
      if (filterCategory && chunk.category !== filterCategory) {
        continue;
      }

      let score = 0;
      const haystack = `${chunk.title} ${chunk.content} ${(chunk.keywords || []).join(' ')}`.toLowerCase();

      for (const token of qTokens) {
        if (haystack.includes(token)) {
          score += 1;
        }
      }

      if (score > 0) {
        scored.push({
          id: chunk.id,
          title: chunk.title,
          regulation: chunk.regulation,
          article: chunk.article,
          category: chunk.category,
          content: chunk.content,
          similarity: Math.min(0.95, score / Math.max(qTokens.length, 1)),
        });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }
}

export const webRagService = new WebRagService();
