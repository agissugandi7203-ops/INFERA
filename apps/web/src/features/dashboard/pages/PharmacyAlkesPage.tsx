import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Scale,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldOff,
  Building2,
  Clock,
} from 'lucide-react';

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';

interface PharmacyCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  tipeModus: string;
  namaObat: string;
  totalBiaya: string;
  highlightText: string;
  apotekList: Array<{
    nama: string;
    tgl: string;
    jatahHari: number;
    biaya: string;
    isOverLimit?: boolean;
  }>;
  legalBasis: string;
}

const PHARMACY_CASES: PharmacyCase[] = [
  {
    id: 'HK-PRB-01',
    patientName: 'Nurul Hidayati',
    nik: '1271**********54',
    score: 94,
    tipeModus: 'Resale Arbitrage Obat PRB',
    namaObat: 'Insulin Glargine Pen + Amlodipine 10mg',
    totalBiaya: 'Rp 1.185.000',
    highlightText: 'Overlap Kuota 190% (90 hari suplai diambil dalam 22 hari)',
    apotekList: [
      {
        nama: 'Apotek Kimia Farma Juanda Medan',
        tgl: '10 Agu 2026',
        jatahHari: 30,
        biaya: 'Rp 395.000',
        isOverLimit: false,
      },
      {
        nama: 'Apotek K-24 Gatot Subroto Medan',
        tgl: '20 Agu 2026 (+10h)',
        jatahHari: 30,
        biaya: 'Rp 395.000',
        isOverLimit: false,
      },
      {
        nama: 'Apotek Sehat Sentosa Medan',
        tgl: '31 Agu 2026 (+11h)',
        jatahHari: 30,
        biaya: 'Rp 395.000',
        isOverLimit: true,
      },
    ],
    legalBasis: 'Permenkes 26/2021 & Panduan PRB BPJS Kesehatan (Maks. 30 hari/siklus)',
  },
  {
    id: 'HK-ALKES-01',
    patientName: 'Ahmad Fauzi',
    nik: '3374**********89',
    score: 82,
    tipeModus: 'Pelanggaran Cooling-Off Kacamata',
    namaObat: 'Koreksi Visus Sferis -2.5',
    totalBiaya: 'Rp 330.000',
    highlightText: 'Klaim ulang dalam 9 bulan (Regulasi wajib jeda 2 tahun / 730 hari)',
    apotekList: [
      {
        nama: 'Optik Melawai Semarang',
        tgl: '14 Nov 2025',
        jatahHari: 730,
        biaya: 'Rp 330.000',
        isOverLimit: false,
      },
      {
        nama: 'Optik Seis Paragon Semarang',
        tgl: '18 Agu 2026 (9 bln kemudian)',
        jatahHari: 730,
        biaya: 'Rp 330.000',
        isOverLimit: true,
      },
    ],
    legalBasis: 'Perpres 82/2018 Ps. 54 & Permenkes 28/2014 (Cooling-off 2 Tahun Alkes Optik)',
  },
];

export const PharmacyAlkesPage: React.FC = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>('HK-PRB-01');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAskFera = (patient: string, modus: string, obat: string) => {
    navigate('/dashboard/ai-report', {
      state: {
        autoPrompt: `Analisis anomali farmasi ${patient} (${modus} - ${obat}).\nBerikan langkah verifikasi apotek dan sanksi yang sesuai.`,
      },
    });
  };

  const handleGoToMasterData = () => {
    navigate('/dashboard/master-data');
  };

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* ================================================================ */}
      {/* 1. Header & Metric Pills                                         */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-none"
            style={{ fontFamily: HEADING_FONT }}
          >
            Resep &amp; Alkes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Monitoring kuota tumpang tindih obat PRB dan pelanggaran periode cooling-off alkes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Overlap Maks:</span>
            <span className="font-bold text-rose-500 font-mono">190% Kuota</span>
          </div>
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Cooling-Off:</span>
            <span className="font-bold text-amber-500 font-mono">2 Tahun (Kacamata)</span>
          </div>
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Total Kasus:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">2 Terdeteksi</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. Tiered Cases List                                             */}
      {/* ================================================================ */}
      <div className="space-y-3.5">
        {PHARMACY_CASES.map((c) => {
          const isExpanded = expandedId === c.id;

          return (
            <div
              key={c.id}
              className={`rounded-2xl transition-all border overflow-hidden ${
                isExpanded
                  ? 'bg-white dark:bg-[#131418] border-slate-300 dark:border-white/[0.16] shadow-lg ring-1 ring-white/[0.06]'
                  : 'bg-white dark:bg-[#131418] border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              {/* TIER 1: Compact Preview Row */}
              <div
                onClick={() => toggleExpand(c.id)}
                className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                        {c.id}
                      </span>
                      <h3
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate"
                        style={{ fontFamily: HEADING_FONT }}
                      >
                        {c.patientName} · {c.tipeModus}
                      </h3>
                    </div>
                    <p className="text-xs text-rose-500 font-semibold truncate mt-0.5">
                      {c.highlightText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Biaya</div>
                    <div className="text-sm font-bold font-mono text-rose-500">{c.totalBiaya}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Skor Risiko</div>
                    <div className="text-sm font-bold font-mono text-amber-500">{c.score}/100</div>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 flex items-center justify-center"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* TIER 2: Expanded Encounter Table */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-white/[0.08] p-4 sm:p-5 bg-slate-50/60 dark:bg-white/[0.015] space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Kronologi Penyerahan Obat / Alkes ({c.namaObat})
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">NIK: {c.nik}</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/[0.05] bg-white dark:bg-[#111216] rounded-xl border border-slate-200/70 dark:border-white/[0.06] overflow-hidden">
                      {c.apotekList.map((a, i) => (
                        <div
                          key={i}
                          className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{a.nama}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Jatah suplai: <strong className="text-slate-700 dark:text-slate-300">{a.jatahHari} hari</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0">
                            <div className="flex items-center gap-2">
                              {a.isOverLimit && (
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  Over Kuota
                                </span>
                              )}
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{a.biaya}</span>
                            </div>
                            <span className="font-mono text-[10.5px] text-slate-400">{a.tgl}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Scale className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Rujukan: <strong className="text-slate-700 dark:text-slate-200">{c.legalBasis}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGoToMasterData}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldOff className="w-3 h-3" />
                        <span>Kirim Surat / Suspend</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAskFera(c.patientName, c.tipeModus, c.namaObat)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Konsultasi AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
