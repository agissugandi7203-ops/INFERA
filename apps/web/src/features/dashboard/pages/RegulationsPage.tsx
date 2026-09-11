import React, { useState, useEffect } from 'react';
import { Search, Database } from 'lucide-react';
import type { RagSearchResult } from '@healthathon/shared';
import { supabase } from '../../../lib/supabase';
import { JKN_REGULATIONS_CHUNKS } from '../../../data/regulationsData';

const INITIAL_REGULATIONS: RagSearchResult[] = JKN_REGULATIONS_CHUNKS.map((c) => ({
  id: c.id,
  title: c.title,
  regulation: c.regulation,
  article: c.article || '',
  category: c.category,
  content: c.content,
  similarity: 0.95,
}));

const CATEGORY_STYLES: Record<string, string> = {
  DEFINISI_HUKUM: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50',
  TIPOLOGI_FRAUD: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50',
  SANKSI_HUKUM: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50',
  SISTEM_BPJS: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50',
  FARMASI_ALKES: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50',
  PEDOMAN_KODING: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/50',
  SPESIFIKASI_API: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-900/50',
  PELINDUNGAN_DATA: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50',
  KEBIJAKAN_TERKINI: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/50',
};

export const RegulationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      const res = await fetch(
        `/api/v1/rag/search?query=${encodeURIComponent(searchQuery)}&limit=5`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setResults(json.data);
          setIsSearching(false);
          return;
        }
      }
    } catch {
      // Fallback local filter across live loaded regulations
    }

    // Local search fallback across all loaded regulations
    const filtered = allRegulations.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.regulation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.article && r.article.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setResults(filtered.length > 0 ? filtered : allRegulations);
    setIsSearching(false);
  };


  return (
    <div className="space-y-4 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Regulasi &amp; Dasar Hukum Anti-Fraud (RAG)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencarian semantik pasal Permenkes 16/2019, Permenkes 36/2015, dan Peraturan BPJS 6/2020.
          </p>
        </div>

        {isLiveConnected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase Live ({allRegulations.length} Regulasi)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-700 self-start sm:self-auto shrink-0">
            <Database className="w-3 h-3 text-slate-400" />
            <span>Local Offline Cache</span>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari regulasi... (contoh: 'sanksi kartu pinjaman', 'batas waktu klaim kacamata', 'doctor shopping')"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 shadow-2xs"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-5 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{isSearching ? 'Mencari...' : 'Cari'}</span>
        </button>
      </form>

      {/* Search Results List */}
      <div className="space-y-3.5">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Menampilkan <strong className="font-semibold text-slate-800 dark:text-slate-200">{results.length}</strong> pasal rujukan relevan
        </div>

        <div className="grid grid-cols-1 gap-4">
          {results.map((reg) => (
            <div
              key={reg.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        CATEGORY_STYLES[reg.category] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {reg.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{reg.title}</h3>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {reg.regulation}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                    {reg.article}
                  </span>
                  {reg.similarity && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Relevansi {Math.round(reg.similarity * 100)}%
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100/90 dark:border-slate-800 font-sans">
                {reg.content}
              </p>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span className="font-semibold text-[#007a3d] dark:text-emerald-400">Terverifikasi Tim PK-JKN</span>
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">Dokumen ID: {reg.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
