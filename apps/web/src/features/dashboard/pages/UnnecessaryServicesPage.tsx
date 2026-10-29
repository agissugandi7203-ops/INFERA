import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat,
  Scale,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldOff,
  Building2,
  Clock,
} from 'lucide-react';

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';

interface ClinicVisit {
  faskes: string;
  tipeFaskes: string;
  tgl: string;
  intervalHari: string;
  keluhan: string;
  tindakan: string;
  biaya: string;
  isRedundant?: boolean;
}

interface DoctorShoppingCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  diagnosa: string;
  totalInefisiensi: string;
  dsiValue: number;
  visits: ClinicVisit[];
  legalBasis: string;
}

const CASES_DATA: DoctorShoppingCase[] = [
  {
    id: 'HK-DS-01',
    patientName: 'Hendra Wijaya',
    nik: '3273**********88',
    score: 88,
    diagnosa: 'R42 - Vertigo & Gangguan Keseimbangan',
    totalInefisiensi: 'Rp 4.200.000',
    dsiValue: 1.0,
    visits: [
      {
        faskes: 'Klinik Pratama Sehat Sejahtera',
        tipeFaskes: 'FKTP Pertama',
        tgl: '26 Agu 2026',
        intervalHari: 'Hari ke-1',
        keluhan: 'Pusing berputar, mual',
        tindakan: 'Betahistine 6mg (Jatah 14 hari)',
        biaya: 'Rp 180.000',
        isRedundant: false,
      },
      {
        faskes: 'RS Rajawali Bandung',
        tipeFaskes: 'Poli Saraf (Kelas C)',
        tgl: '28 Agu 2026',
        intervalHari: '+2 Hari',
        keluhan: 'Pusing berputar, minta resep baru',
        tindakan: 'Flunarizine + Lab Rutin Redundan',
        biaya: 'Rp 950.000',
        isRedundant: true,
      },
      {
        faskes: 'RS Advent Bandung',
        tipeFaskes: 'IGD Rumah Sakit',
        tgl: '31 Agu 2026',
        intervalHari: '+3 Hari',
        keluhan: 'Pusing berputar (tanpa defisit)',
        tindakan: 'CT-Scan Kepala Non-Kontras Redundan',
        biaya: 'Rp 1.450.000',
        isRedundant: true,
      },
    ],
    legalBasis: 'Permenkes 16/2019 Ps. 5 ayat (3) & Pedoman INA-CBG (Unnecessary Utilization)',
  },
  {
    id: 'HK-DS-02',
    patientName: 'Siti Rahayu',
    nik: '3204**********42',
    score: 74,
    diagnosa: 'M54.5 - Low Back Pain Kronis',
    totalInefisiensi: 'Rp 2.850.000',
    dsiValue: 0.67,
    visits: [
      {
        faskes: 'Klinik Harapan Medika',
        tipeFaskes: 'FKTP Pertama',
        tgl: '02 Sep 2026',
        intervalHari: 'Hari ke-1',
        keluhan: 'Nyeri punggung bawah',
        tindakan: 'Meloxicam + Vitamin B Neuro',
        biaya: 'Rp 150.000',
        isRedundant: false,
      },
      {
        faskes: 'RS Al-Islam Bandung',
        tipeFaskes: 'Poli Bedah Tulang',
        tgl: '04 Sep 2026',
        intervalHari: '+2 Hari',
        keluhan: 'Nyeri punggung bawah menetap',
        tindakan: 'Rontgen Lumbal Redundan',
        biaya: 'Rp 820.000',
        isRedundant: true,
      },
    ],
    legalBasis: 'Permenkes 16/2019 tentang Pencegahan Kecurangan JKN',
  },
];

export const UnnecessaryServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>('HK-DS-01');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAskFera = (patient: string, diag: string, inefisiensi: string) => {
    navigate('/dashboard/ai-report', {
      state: {
        autoPrompt: `Analisis Doctor Shopping ${patient} (Diagnosa: ${diag}). Inefisiensi: ${inefisiensi}.\nBerikan saran penguncian rujukan VClaim dan sanksi yang sesuai.`,
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
            Doctor Shopping
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Pelayanan berulang tanpa indikasi medis baru &amp; perpindahan faskes berturut-turut.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Inefisiensi DJS:</span>
            <span className="font-bold text-rose-500 font-mono">Rp 7,05 Jt</span>
          </div>
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Batas Wajar:</span>
            <span className="font-bold text-amber-500 font-mono">DSI &lt; 0.30</span>
          </div>
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Kasus:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">2 Terdeteksi</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. Tiered Cases List                                             */}
      {/* ================================================================ */}
      <div className="space-y-3.5">
        {CASES_DATA.map((c) => {
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
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Repeat className="w-5 h-5" />
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
                        {c.patientName} · {c.diagnosa}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Doctor Shopping Index (DSI) <strong className="text-amber-500">{c.dsiValue.toFixed(2)}</strong> (Ambang Batas: 0.30) · {c.visits.length} Kunjungan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Inefisiensi</div>
                    <div className="text-sm font-bold font-mono text-rose-500">{c.totalInefisiensi}</div>
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
                  {/* Visits Table */}
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Kronologi Kunjungan Faskes ({c.visits.length} Kali)
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">NIK: {c.nik}</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/[0.05] bg-white dark:bg-[#111216] rounded-xl border border-slate-200/70 dark:border-white/[0.06] overflow-hidden">
                      {c.visits.map((v, i) => (
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
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{v.faskes}</span>
                                <span className="text-slate-400 text-[10px]">({v.tipeFaskes})</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {v.keluhan} · <span className="text-slate-700 dark:text-slate-300 font-medium">{v.tindakan}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0">
                            <div className="flex items-center gap-2">
                              {v.isRedundant && (
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  Redundan
                                </span>
                              )}
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{v.biaya}</span>
                            </div>
                            <span className="font-mono text-[10.5px] text-slate-400">{v.tgl} ({v.intervalHari})</span>
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
                        onClick={() => handleAskFera(c.patientName, c.diagnosa, c.totalInefisiensi)}
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
