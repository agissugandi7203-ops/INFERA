import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Zap,
  Clock,
  Stethoscope,
  ShieldAlert,
} from 'lucide-react';
import { FALLBACK_CASES } from '../../../services/participantRiskApi';
import type { ParticipantAuditCase } from '@healthathon/shared';

export const CasesDeepDivePage: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(FALLBACK_CASES[0]!.id);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const currentCase: ParticipantAuditCase =
    FALLBACK_CASES.find((c) => c.id === selectedCaseId) || FALLBACK_CASES[0]!;

  const handleRunAiAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 650);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Studi Kasus &amp; Investigasi Anomali
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              4 BENCHMARK
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Validasi komprehensif tipologi fraud peserta berdasarkan regulasi resmi BPJS Kesehatan.
          </p>
        </div>

        <button
          onClick={handleRunAiAudit}
          disabled={isScanning}
          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer self-start sm:self-auto disabled:opacity-60"
        >
          {isScanning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memindai Bukti Forensik...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Jalankan Audit AI</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Elevated Case Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {FALLBACK_CASES.map((c) => {
          const isSelected = c.id === selectedCaseId;
          return (
            <div
              key={c.id}
              onClick={() => {
                setSelectedCaseId(c.id);
              }}
              className={`p-4 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-2 border-[#007a3d] dark:border-emerald-500 shadow-md shadow-emerald-900/5 -translate-y-0.5'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {c.caseCode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.riskScore >= 90
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                  }`}
                >
                  Skor {c.riskScore}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {c.categoryLabel}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {c.patientName} • {c.nikMasked}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Potensi Klaim:</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                  Rp {(c.potentialLoss / 1000000).toFixed(1)} Jt
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Case Deep Dive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Case Summary & Encounters */}
        <div className="lg:col-span-8 space-y-4">
          {/* Elevated Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white">
                    {currentCase.caseCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Kasus Terverifikasi
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {currentCase.categoryLabel}
                </h2>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400">Estimasi Disparitas DJS:</span>
                <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                  Rp {currentCase.potentialLoss.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Quick Metadata Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-slate-400 dark:text-slate-400 text-[10px] block">Nama Peserta</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                  {currentCase.patientName}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-slate-400 dark:text-slate-400 text-[10px] block">Nomor Kartu JKN</span>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {currentCase.noKartu}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-slate-400 dark:text-slate-400 text-[10px] block">NIK Terlindungi</span>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                  {currentCase.nikMasked}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-slate-400 dark:text-slate-400 text-[10px] block">Evaluasi Risiko</span>
                <div className="font-bold text-rose-600 dark:text-rose-400 text-xs font-mono">
                  {currentCase.riskScore}/100 ({currentCase.riskLevel})
                </div>
              </div>
            </div>

            {/* Elevated 4-Point Forensic Highlight (Clean, Non-Wordy) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Modus Utama</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {currentCase.detailedAnalysis.split('.')[0] || currentCase.categoryLabel}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Anomali Klinis</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {currentCase.encounters[0]?.namaDiagnosa || 'Klaim diagnosa repetitif'} pada {currentCase.encounters.length} faskes berbeda.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Bukti Forensik Waktu</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Terbit SEP berturutan dalam rentang interval waktu yang melanggar batas wajar klinis.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <Scale className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Konsekuensi Regulasi</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {currentCase.legalReference.regulation} — {currentCase.legalReference.article}.
                </p>
              </div>
            </div>
          </div>

          {/* Connected Timeline of Encounters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Kronologi Penerbitan SEP ({currentCase.encounters.length} Titik Kunjungan)
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Audit Trail VEDIKA</span>
            </div>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-3 pl-5 py-1">
              {currentCase.encounters.map((enc, idx) => (
                <div
                  key={enc.id}
                  className="relative p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xs transition-shadow"
                >
                  {/* Stepper Dot */}
                  <span className="absolute -left-[27px] top-4 w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-[10px] flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                    {idx + 1}
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{enc.faskesName}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        ({enc.location.city})
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(enc.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB • {new Date(enc.timestamp).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Diagnosa ICD-10</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 mr-1">
                          {enc.diagnosaUtama}
                        </span>
                        <span>{enc.namaDiagnosa}</span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-slate-400 text-[10px] block">Tarif INA-CBG</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        Rp {enc.cbgTariff.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Legal Grounding & Recommended Sanctions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Elevated Legal Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dasar Hukum &amp; Pelanggaran</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100">{currentCase.legalReference.regulation}</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">{currentCase.legalReference.article}</div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] mt-1">
                {currentCase.legalReference.summary}
              </p>
            </div>
          </div>

          {/* Elevated Sanctions Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Rekomendasi Sanksi Sistem</span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5">
              <div className="font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wide text-[11px]">
                {currentCase.recommendedSanction}
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                {currentCase.legalReference.sanction}
              </p>
            </div>

            <button
              onClick={() => alert(`Rekomendasi tindakan '${currentCase.recommendedSanction}' telah diteruskan ke modul Master Data.`)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Teruskan ke Master Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
