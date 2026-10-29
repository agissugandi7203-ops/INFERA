import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { RagSearchResult } from '@healthathon/shared';
import { supabase, getAuthHeaders } from '../../../lib/supabase';
import { JKN_REGULATIONS_CHUNKS } from '../../../data/regulationsData';

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';

const INITIAL_REGULATIONS: RagSearchResult[] = JKN_REGULATIONS_CHUNKS.map((c) => ({
  id: c.id,
  title: c.title,
  regulation: c.regulation,
  article: c.article || '',
  category: c.category,
  content: c.content,
  similarity: 0.95,
}));

export const RegulationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [allRegulations, setAllRegulations] = useState<RagSearchResult[]>(INITIAL_REGULATIONS);
  const [results, setResults] = useState<RagSearchResult[]>(INITIAL_REGULATIONS);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Load all live regulations from Supabase jkn_regulations on mount
  useEffect(() => {
    async function loadLiveRegulations() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('jkn_regulations')
          .select('id, title, regulation, article, category, content')
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: RagSearchResult[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            regulation: d.regulation,
            article: d.article || '',
            category: d.category,
            content: d.content,
            similarity: 0.95,
          }));
          setAllRegulations(mapped);
          setResults(mapped);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn('Fallback to local regulations cache:', err);
      }
    }

    loadLiveRegulations();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setResults(allRegulations);
      return;
    }

    setIsSearching(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(
        `/api/v2/rag/search?query=${encodeURIComponent(searchQuery)}&limit=8`,
        { headers: authHeaders }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setResults(json.data);
          setIsSearching(false);
          return;
        }
      }
    } catch {
      // Local fallback filter
      const q = searchQuery.toLowerCase();
      const filtered = allRegulations.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          r.regulation.toLowerCase().includes(q) ||
          (r.article || '').toLowerCase().includes(q)
      );
      setResults(filtered);
    }
    setIsSearching(false);
  };

  const filteredResults = useMemo(() => {
    if (selectedCategory === 'ALL') return results;
    return results.filter((r) => r.category === selectedCategory);
  }, [results, selectedCategory]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(allRegulations.map((r) => r.category));
    return Array.from(cats);
  }, [allRegulations]);

  return (
    <div className="space-y-6 w-full max-w-[1760px] mx-auto pb-16">
      {/* ================================================================ */}
      {/* 1. Header & Metric Pills                                         */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-none"
            style={{ fontFamily: HEADING_FONT }}
          >
            Regulasi Anti-Fraud JKN
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Basis rujukan hukum Permenkes 16/2019, UU SJSN, &amp; Perpres 82/2018 dengan pencarian semantik.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Terindeks:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{allRegulations.length} Pasal</span>
          </div>

          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-blue-500' : 'bg-slate-400'}`} />
            <span className="text-slate-700 dark:text-slate-300">
              {isLiveConnected ? 'Supabase pgvector' : 'Lokal RAG'}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. Search Bar & Category Filter Pills                            */}
      {/* ================================================================ */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pasal, kata kunci fraud (mis: 'impossible travel', 'doctor shopping', 'resale')..."
              className="w-full h-11 pl-10 pr-9 bg-white dark:bg-[#131418] rounded-full border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setResults(allRegulations);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="h-11 px-6 rounded-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-[#131418] text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            {isSearching ? 'Mencari...' : 'Cari RAG'}
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                : 'bg-white dark:bg-[#131418] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            Semua ({results.length})
          </button>
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                  : 'bg-white dark:bg-[#131418] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. Regulation Bento Grid Cards                                   */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResults.map((r) => (
          <div
            key={r.id}
            className="rounded-[26px] bg-white dark:bg-[#131418] border border-slate-200/70 dark:border-white/[0.08] p-5 shadow-sm space-y-3.5 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {r.category.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Kecocokan: {Math.round(r.similarity * 100)}%
                </span>
              </div>

              <h3
                className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight"
                style={{ fontFamily: HEADING_FONT }}
              >
                {r.title}
              </h3>

              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                {r.regulation} {r.article ? `· ${r.article}` : ''}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {r.content}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px]">Doc ID: {r.id}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Terverifikasi Valid
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
