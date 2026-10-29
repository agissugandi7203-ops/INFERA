import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Dna,
  Scale,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldOff,
  Building2,
} from 'lucide-react';

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';

interface TravelCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  originCity: string;
  originHospital: string;
  originTime: string;
  originDiag: string;
  originTarif: string;
  destCity: string;
  destHospital: string;
  destTime: string;
  destDiag: string;
  destTarif: string;
  distanceKm: number;
  timeDiffMinutes: number;
  velocityKmH: number;
  legalBasis: string;
}

interface BiologyCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  gender: string;
  age: number;
  hospital: string;
  claimDiag: string;
  diagCode: string;
  cbgTarif: string;
  legalBasis: string;
}

const TRAVEL_DATA: TravelCase[] = [
  {
    id: 'HK-TRAVEL-01',
    patientName: 'Budi Santoso',
    nik: '3374**********01',
    score: 96,
    originCity: 'Surakarta',
    originHospital: 'RSUD Dr. Moewardi',
    originTime: '08:30 WIB',
    originDiag: 'I21.0 - Infark Miokard Akut',
    originTarif: 'Rp 8.400.000',
    destCity: 'Semarang',
    destHospital: 'RS Mitra Husada',
    destTime: '09:15 WIB',
    destDiag: 'M54.5 - Low Back Pain',
    destTarif: 'Rp 320.000',
    distanceKm: 63.5,
    timeDiffMinutes: 45,
    velocityKmH: 84.7,
    legalBasis: 'Perpres 82/2018 Ps. 97 & KUHP 263 (Pemalsuan Identitas)',
  },
  {
    id: 'HK-TRAVEL-02',
    patientName: 'Dewi Lestari',
    nik: '3273**********44',
    score: 92,
    originCity: 'Bandung',
    originHospital: 'RSUP Dr. Hasan Sadikin',
    originTime: '10:00 WIB',
    originDiag: 'E11.9 - DM Tipe 2',
    originTarif: 'Rp 210.000',
    destCity: 'Jakarta Selatan',
    destHospital: 'RS Fatmawati',
    destTime: '10:30 WIB',
    destDiag: 'K29.7 - Gastritis Akut',
    destTarif: 'Rp 195.000',
    distanceKm: 142.0,
    timeDiffMinutes: 30,
    velocityKmH: 284.0,
    legalBasis: 'Permenkes 16/2019 Ps. 22 & UU ITE Ps. 35',
  },
];

const BIOLOGY_DATA: BiologyCase[] = [
  {
    id: 'HK-BIO-01',
    patientName: 'Agus Pratama',
    nik: '3201**********77',
    score: 98,
    gender: 'LAKI-LAKI',
    age: 38,
    hospital: 'RSIA Bunda Medika Bogor',
    claimDiag: 'Persalinan Sectio Caesarea Tunggal',
    diagCode: 'O82',
    cbgTarif: 'Rp 6.800.000',
    legalBasis: 'Permenkes 16/2019 Ps. 5 & KUHP 378 (Klaim Fiktif)',
  },
  {
    id: 'HK-BIO-02',
    patientName: 'Rudi Hartono',
    nik: '3171**********12',
    score: 95,
    gender: 'LAKI-LAKI',
    age: 45,
    hospital: 'RS Citra Sehat Jakarta',
    claimDiag: 'Endometriosis Uterus',
    diagCode: 'N80.0',
    cbgTarif: 'Rp 4.150.000',
    legalBasis: 'Permenkes 16/2019 Ps. 5 (Diskordansi Demografis Mutlak)',
  },
];

export const IdentityRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TRAVEL' | 'BIOLOGY'>('TRAVEL');
  const [expandedId, setExpandedId] = useState<string | null>('HK-TRAVEL-01');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAskFera = (title: string, details: string) => {
    navigate('/dashboard/ai-report', {
      state: {
        autoPrompt: `Analisis anomali ${title}:\n${details}\nBerikan verifikasi teknis dan rekomendasi penindakan.`,
      },
    });
  };

  const handleGoToMasterData = () => {
    navigate('/dashboard/master-data');
  };

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* ================================================================ */}
      {/* 1. Header & Tab Switcher                                         */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-none"
            style={{ fontFamily: HEADING_FONT }}
          >
            Identitas &amp; Travel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Deteksi peminjaman kartu via audit geospasial simultan dan diskordansi demografis.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center h-10 p-1 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('TRAVEL');
              setExpandedId('HK-TRAVEL-01');
            }}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-full transition-colors cursor-pointer ${
              activeTab === 'TRAVEL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Impossible Travel (M-1)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('BIOLOGY');
              setExpandedId('HK-BIO-01');
            }}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-full transition-colors cursor-pointer ${
              activeTab === 'BIOLOGY'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Diskordansi Biologis (M-2)</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. Tiered List of Cases                                          */}
      {/* ================================================================ */}
      {activeTab === 'TRAVEL' ? (
        <div className="space-y-3.5">
          {TRAVEL_DATA.map((c) => {
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
                {/* TIER 1: Compact Preview */}
                <div
                  onClick={() => toggleExpand(c.id)}
                  className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <Navigation className="w-5 h-5" />
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
                          {c.patientName} ({c.originCity} → {c.destCity})
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Jarak {c.distanceKm} km dalam {c.timeDiffMinutes} menit · Implisit {c.velocityKmH} km/jam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Tarif</div>
                      <div className="text-sm font-bold font-mono text-rose-500">{c.originTarif}</div>
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

                {/* TIER 2: Expanded Evidence View */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-white/[0.08] p-4 sm:p-5 bg-slate-50/60 dark:bg-white/[0.015] space-y-4">
                    {/* Origin vs Dest Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Origin */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#111216] border border-slate-200/70 dark:border-white/[0.06] space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            Klaim Pertama (Origin)
                          </span>
                          <span className="font-mono">{c.originTime}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{c.originHospital} ({c.originCity})</div>
                        <div className="text-slate-500 dark:text-slate-400">{c.originDiag}</div>
                        <div className="font-mono font-bold text-rose-500 pt-1">{c.originTarif}</div>
                      </div>

                      {/* Dest */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#111216] border border-slate-200/70 dark:border-white/[0.06] space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-rose-500" />
                            Klaim Kedua (Simultan)
                          </span>
                          <span className="font-mono">{c.destTime}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{c.destHospital} ({c.destCity})</div>
                        <div className="text-slate-500 dark:text-slate-400">{c.destDiag}</div>
                        <div className="font-mono font-bold text-slate-600 dark:text-slate-300 pt-1">{c.destTarif}</div>
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
                          <span>Tindak di Master Data</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAskFera(
                              `Impossible Travel ${c.patientName}`,
                              `Klaim 1: ${c.originHospital} (${c.originTime}). Klaim 2: ${c.destHospital} (${c.destTime}). Jarak: ${c.distanceKm} km.`
                            )
                          }
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
      ) : (
        <div className="space-y-3.5">
          {BIOLOGY_DATA.map((c) => {
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
                {/* TIER 1: Compact Preview */}
                <div
                  onClick={() => toggleExpand(c.id)}
                  className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <Dna className="w-5 h-5" />
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
                          {c.patientName} ({c.gender}, {c.age} thn)
                        </h3>
                      </div>
                      <p className="text-xs text-rose-500 font-semibold truncate mt-0.5">
                        Klaim: {c.diagCode} - {c.claimDiag} di {c.hospital}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Tarif CBG</div>
                      <div className="text-sm font-bold font-mono text-rose-500">{c.cbgTarif}</div>
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

                {/* TIER 2: Expanded Evidence View */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-white/[0.08] p-4 sm:p-5 bg-slate-50/60 dark:bg-white/[0.015] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#111216] border border-slate-200/70 dark:border-white/[0.06] space-y-1">
                        <span className="text-slate-400 text-[11px] block font-semibold">Master Data Dukcapil &amp; SATUSEHAT</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {c.patientName} · {c.gender} · {c.age} Tahun
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">NIK: {c.nik}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                        <span className="text-rose-500 text-[11px] block font-semibold">Anomali Klinis Mutlak</span>
                        <div className="font-bold text-rose-600 dark:text-rose-400">
                          Diagnosa {c.diagCode} ({c.claimDiag}) mustahil pada gender Laki-laki.
                        </div>
                        <div className="text-rose-700 dark:text-rose-300 text-[11px] font-mono">Faskes: {c.hospital}</div>
                      </div>
                    </div>

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
                          <span>Tindak di Master Data</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAskFera(
                              `Diskordansi Biologis ${c.patientName}`,
                              `Diagnosa: ${c.claimDiag} (${c.diagCode}) pada pasien ${c.gender} ${c.age} tahun di ${c.hospital}. Tarif: ${c.cbgTarif}.`
                            )
                          }
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
      )}
    </div>
  );
};
