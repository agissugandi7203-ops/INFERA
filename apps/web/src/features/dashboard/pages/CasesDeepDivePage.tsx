import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Building2,
  Scale,
  MessageSquare,
  ShieldOff,
  Navigation,
  Dna,
  Stethoscope,
  Pill,
} from 'lucide-react';
import { FALLBACK_CASES } from '../../../services/participantRiskApi';
import type { ParticipantAuditCase } from '@healthathon/shared';

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';

const CASE_ICONS: Record<string, React.ElementType> = {
  IMPOSSIBLE_TRAVEL: Navigation,
  BIOLOGICAL_DISCORDANCE: Dna,
  UNNECESSARY_SERVICES: Stethoscope,
  PHARMACY_ABUSE: Pill,
};

export const CasesDeepDivePage: React.FC = () => {
  const navigate = useNavigate();
  // Expanded case ID for tiered progressive disclosure (starts with first case open, or null)
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>('CASE-001');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const totalDisparity = FALLBACK_CASES.reduce((acc, c) => acc + c.potentialLoss, 0);
  const avgRiskScore = Math.round(
    FALLBACK_CASES.reduce((acc, c) => acc + c.riskScore, 0) / FALLBACK_CASES.length
  );

  const toggleCase = (id: string) => {
    setExpandedCaseId((prev) => (prev === id ? null : id));
  };

  const handleAskFera = (c: ParticipantAuditCase) => {
    const prompt = `Analisis kasus ${c.caseCode} (${c.categoryLabel}):
- Peserta: ${c.patientName} (${c.nikMasked})
- Disparitas: Rp ${c.potentialLoss.toLocaleString('id-ID')}
- Skor Risiko: ${c.riskScore}/100
- Regulasi: ${c.legalReference.regulation} (${c.legalReference.article})

Berikan verifikasi teknis dan rekomendasi penindakan singkat.`;

    navigate('/dashboard/ai-report', {
      state: { autoPrompt: prompt },
    });
  };

  const handleSuspend = (c: ParticipantAuditCase) => {
    setActionNotice(`Kasus ${c.caseCode} (${c.patientName}) dialihkan ke Master Data Penindakan.`);
    setTimeout(() => setActionNotice(null), 3500);
    navigate('/dashboard/master-data');
  };

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* ================================================================ */}
      {/* 1. Header: Clean & Punchy                                        */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-none"
            style={{ fontFamily: HEADING_FONT }}
          >
            Studi Kasus Pembuktian
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            4 Kasus benchmark prioritas dengan bukti audit trail VEDIKA &amp; rujukan regulasi JKN.
          </p>
        </div>

        {/* 3 Compact Metrics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Total Disparitas:</span>
            <span className="text-rose-500 font-bold font-mono">
              Rp {(totalDisparity / 1_000_000).toFixed(1)} Jt
            </span>
          </div>

          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Rata-rata Risiko:</span>
            <span className="text-amber-500 font-bold font-mono">{avgRiskScore}/100</span>
          </div>

          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-500 font-bold">4 Kasus Siap Ditindak</span>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. Tiered Cases List (Desain Bertingkat: Preview -> Detail)       */}
      {/* ================================================================ */}
      <div className="space-y-3.5">
        {FALLBACK_CASES.map((c, index) => {
          const isExpanded = expandedCaseId === c.id;
          const Icon = CASE_ICONS[c.category] || ShieldAlert;

          return (
            <div
              key={c.id}
              className={`rounded-2xl transition-all border overflow-hidden ${
                isExpanded
                  ? 'bg-white dark:bg-[#131418] border-slate-300 dark:border-white/[0.16] shadow-lg ring-1 ring-white/[0.06]'
                  : 'bg-white dark:bg-[#131418] border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              {/* TIER 1: Compact Preview Card (Always visible, click to toggle) */}
              <div
                onClick={() => toggleCase(c.id)}
                className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Left: Code, Icon, Title, and 1-line Summary */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      c.riskScore >= 95
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                        M-{index + 1}
                      </span>
                      <h3
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate"
                        style={{ fontFamily: HEADING_FONT }}
                      >
                        {c.categoryLabel.replace(/^Pelayanan Tidak Perlu:\s*/, '')}
                      </h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">
                        · {c.patientName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {c.summary}
                    </p>
                  </div>
                </div>

                {/* Right: Numbers & Toggle Button */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Disparitas
                    </div>
                    <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                      Rp {(c.potentialLoss / 1_000_000).toFixed(1)} Jt
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Skor Risiko
                    </div>
                    <div className="text-sm font-bold font-mono text-amber-500">
                      {c.riskScore}/100
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isExpanded
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                    }`}
                    title={isExpanded ? 'Tutup Detail' : 'Buka Detail Kasus'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* TIER 2: Expanded Detail Panel (Progressive Disclosure) */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-white/[0.08] p-4 sm:p-5 bg-slate-50/60 dark:bg-white/[0.015] space-y-4">
                  {/* Encounter Chronology Table */}
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kronologi Klaim VEDIKA ({c.encounters.length} Titik Pelayanan)</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        NIK: {c.nikMasked} · Kartu: {c.noKartu}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/[0.05] bg-white dark:bg-[#111216] rounded-xl border border-slate-200/70 dark:border-white/[0.06] overflow-hidden">
                      {c.encounters.map((enc, idx) => (
                        <div
                          key={enc.id}
                          className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {enc.faskesName}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  ({enc.location.city})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Diagnosa: <span className="font-mono font-semibold">{enc.diagnosaUtama}</span> - {enc.namaDiagnosa}
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              Rp {enc.cbgTariff.toLocaleString('id-ID')}
                            </span>
                            <span className="font-mono text-[10.5px] text-slate-400">
                              {new Date(enc.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB · {new Date(enc.timestamp).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal Basis & Sanksi Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#111216] border border-slate-200/70 dark:border-white/[0.06] text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                        <Scale className="w-3.5 h-3.5 text-blue-500" />
                        <span>Dasar Regulasi:</span>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.legalReference.regulation} ({c.legalReference.article})
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                      <div className="text-[10px] text-rose-500 uppercase tracking-wider font-bold mb-0.5">
                        Rekomendasi Sanksi:
                      </div>
                      <div className="font-bold text-rose-600 dark:text-rose-400">
                        {c.recommendedSanction}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSuspend(c)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>Ajukan Tindakan di Master Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAskFera(c)}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Konsultasi AI</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
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
