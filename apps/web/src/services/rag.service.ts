import type { RegulationChunk, RagSearchResult, RagSearchRequest } from '@healthathon/shared';
import { JKN_REGULATIONS_CHUNKS } from '../data/regulationsData';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api/v1';

export class WebRagService {
  public getAllRegulations(): RegulationChunk[] {
    return JKN_REGULATIONS_CHUNKS;
  }

  public async search(request: RagSearchRequest): Promise<RagSearchResult[]> {
    const { query, matchCount = 3, filterCategory } = request;
    const cleanQuery = query ? query.trim() : '';
    if (!cleanQuery) return [];

    // 1. Try Backend RAG Endpoint (Supabase pgvector / semantic search)
    try {
      const url = new URL(`${API_BASE_URL}/rag/search`, window.location.origin);
      url.searchParams.set('query', cleanQuery);
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
    } catch {
      // Backend unavailable or network failure; fall back to local database search
    }

    // 2. Local Database Weighted Search over actual JKN regulations
    return this.clientFallbackSearch(cleanQuery, matchCount, filterCategory);
  }

  private clientFallbackSearch(
    query: string,
    limit: number,
    filterCategory?: string
  ): RagSearchResult[] {
    const cleanQuery = query.toLowerCase().trim();
    let qTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 1);
    if (qTokens.length === 0 && cleanQuery.length > 0) {
      qTokens = [cleanQuery];
    }
    const scored: RagSearchResult[] = [];

    for (const chunk of JKN_REGULATIONS_CHUNKS) {
      if (filterCategory && chunk.category !== filterCategory) {
        continue;
      }

      let score = 0;
      const titleLower = chunk.title.toLowerCase();
      const contentLower = chunk.content.toLowerCase();
      const regLower = chunk.regulation.toLowerCase();
      const artLower = (chunk.article || '').toLowerCase();
      const kwLower = (chunk.keywords || []).map((k) => k.toLowerCase());

      // Exact phrase match receives highest weight
      if (titleLower.includes(cleanQuery)) score += 12;
      if (regLower.includes(cleanQuery)) score += 10;
      if (artLower.includes(cleanQuery)) score += 9;
      if (kwLower.some((k) => k.includes(cleanQuery))) score += 8;
      if (contentLower.includes(cleanQuery)) score += 5;

      for (const token of qTokens) {
        if (titleLower.includes(token)) score += 4;
        if (artLower.includes(token)) score += 4;
        if (kwLower.some((k) => k.includes(token))) score += 3;
        if (regLower.includes(token)) score += 2;
        if (contentLower.includes(token)) score += 1;
      }

      if (score > 0) {
        const similarity = Math.min(0.98, 0.4 + (score / (qTokens.length * 10 + 5)) * 0.58);
        scored.push({
          id: chunk.id,
          title: chunk.title,
          regulation: chunk.regulation,
          article: chunk.article,
          category: chunk.category,
          content: chunk.content,
          similarity: Math.round(similarity * 100) / 100,
        });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }
}

export const webRagService = new WebRagService();
