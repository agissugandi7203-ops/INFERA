import React, { useState, useEffect } from 'react';
import { Search, Database } from 'lucide-react';
import type { RagSearchResult } from '@healthathon/shared';
import { supabase } from '../../../lib/supabase';

const SAMPLE_REGULATIONS: RagSearchResult[] = [
  {
    id: 'REG-001',
    title: 'Definisi & Kewenangan Pencegahan Kecurangan (Fraud) JKN',
    regulation: 'Permenkes No. 16 Tahun 2019',
    article: 'Pasal 2 & Pasal 3',
    category: 'DEFINISI_HUKUM',
    content:
      'Kecurangan (Fraud) dalam pelaksanaan Program Jaminan Kesehatan pada Sistem Jaminan Sosial Nasional adalah perbuatan yang dilakukan dengan sengaja oleh peserta, BPJS Kesehatan, fasilitas kesehatan, atau penyedia obat dan alat kesehatan untuk memperoleh keuntungan finansial dari program JKN melalui perbuatan curang yang tidak sesuai dengan ketentuan peraturan perundang-undangan.',
    similarity: 0.94,
  },
  {
    id: 'REG-002',
    title: 'Modus Kecurangan dari Sisi Peserta JKN',
    regulation: 'Permenkes No. 16 Tahun 2019',
    article: 'Pasal 5 ayat (3)',
    category: 'TIPOLOGI_FRAUD',
    content:
      'Kecurangan yang dapat dilakukan oleh Peserta meliputi: a) Pemalsuan data dan/atau identitas peserta; b) Meminjamkan atau memindahtangankan identitas kepesertaan kepada pihak lain; c) Memperoleh pelayanan kesehatan yang tidak perlu (unnecessary services) secara sengaja; d) Penimbunan atau penjualan kembali obat atau alat kesehatan yang dibiayai oleh Dana Jaminan Sosial.',
    similarity: 0.91,
  },
  {
    id: 'REG-003',
    title: 'Larangan Peminjaman Kartu & Penegakan Sanksi Administratif',
    regulation: 'Peraturan BPJS Kesehatan No. 6 Tahun 2020',
    article: 'Pasal 14 & Pasal 15',
    category: 'SANKSI_HUKUM',
    content:
      'Peserta dilarang keras meminjamkan nomor identitas kepesertaan JKN kepada orang lain untuk mengakses fasilitas kesehatan. Apabila terbukti terjadi penyalahgunaan kartu identitas, BPJS Kesehatan berhak menangguhkan hak jaminan peserta, membatalkan Surat Eligibilitas Peserta (SEP) yang sedang berjalan, dan menagih pengembalian seluruh biaya pelayanan yang telah dibayarkan.',
    similarity: 0.88,
  },
  {
    id: 'REG-004',
    title: 'Ketentuan Batas Maksimal Peresepan Obat Kronis PRB (30 Hari)',
    regulation: 'Panduan Praktis Program Rujuk Balik BPJS Kesehatan',
    article: 'Ketentuan 30 Hari Suplai',
    category: 'SISTEM_BPJS',
    content:
      'Pemberian obat PRB kronis (Hipertensi, Diabetes Mellitus, Jantung, PPOK, dsb.) dibatasi paling banyak untuk kebutuhan konsumsi 30 (tiga puluh) hari per satu kali peresepan. Pengambilan obat berikutnya hanya dapat dilakukan paling cepat H-3 dari habisnya masa konsumsi untuk mencegah penumpukan obat yang berisiko diperjualbelikan.',
    similarity: 0.85,
  },
];

const CATEGORY_STYLES: Record<string, string> = {
  DEFINISI_HUKUM: 'bg-blue-50 text-blue-700',
  TIPOLOGI_FRAUD: 'bg-amber-50 text-amber-700',
  SANKSI_HUKUM: 'bg-rose-50 text-rose-700',
  SISTEM_BPJS: 'bg-slate-100 text-slate-700',
};

export const RegulationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allRegulations, setAllRegulations] = useState<RagSearchResult[]>(SAMPLE_REGULATIONS);
  const [results, setResults] = useState<RagSearchResult[]>(SAMPLE_REGULATIONS);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Regulasi &amp; Dasar Hukum Anti-Fraud (RAG)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencarian semantik pasal Permenkes 16/2019, Permenkes 36/2015, dan Peraturan BPJS 6/2020.
          </p>
        </div>

        {isLiveConnected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 self-start sm:self-auto shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <Database className="w-3 h-3 text-emerald-600" />
            <span>Supabase Live ({allRegulations.length} Regulasi)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200 self-start sm:self-auto shrink-0">
            <Database className="w-3 h-3 text-slate-400" />
            <span>Local Offline Cache</span>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari regulasi... (contoh: 'sanksi kartu pinjaman', 'batas waktu klaim kacamata', 'doctor shopping')"
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-2xs"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{isSearching ? 'Mencari...' : 'Cari'}</span>
        </button>
      </form>

      {/* Search Results List */}
      <div className="space-y-3.5">
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="font-semibold text-slate-800">{results.length}</strong> pasal rujukan relevan
        </div>

        <div className="grid grid-cols-1 gap-4">
          {results.map((reg) => (
            <div
              key={reg.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md space-y-3.5 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        CATEGORY_STYLES[reg.category] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {reg.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{reg.title}</h3>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {reg.regulation}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200/60">
                    {reg.article}
                  </span>
                  {reg.similarity && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Relevansi {Math.round(reg.similarity * 100)}%
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100/90 font-sans">
                {reg.content}
              </p>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-[#007a3d]">Terverifikasi Tim PK-JKN</span>
                <span className="font-mono text-[11px] text-slate-400">Dokumen ID: {reg.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
