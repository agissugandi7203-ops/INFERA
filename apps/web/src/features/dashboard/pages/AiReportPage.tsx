import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Volume2,
  FileCheck,
  Download,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useSimulationStream } from '../simulation/SimulationContext';
import { FALLBACK_CASES } from '../../../services/participantRiskApi';
import type { JknClaimRecord } from '@healthathon/shared';

interface AiReportPageProps {
  onTriggerAvatarSpeech?: (text: string, emotion: string) => void;
}

export const AiReportPage: React.FC<AiReportPageProps> = ({ onTriggerAvatarSpeech }) => {
  const { claims, anomalies, selectedClaimForAudit, setSelectedClaimForAudit } = useSimulationStream();
  const [filterType, setFilterType] = useState<'ALL' | 'ANOMALY' | 'CLEAN'>('ALL');

  // Build list of auditable cases including both anomalies and verified clean claims
  const streamAnomalies = anomalies.slice(0, 8).map((a) => ({
    id: a.id,
    code: a.noSep,
    patient: a.namaPeserta,
    nik: a.nik,
    title: a.anomalyTitle || 'Anomali Aliran Transaksi',
    description: a.anomalyDescription || 'Klaim terindikasi ketidaksesuaian pola pelayanan medis.',
    riskScore: a.fraudRiskScore,
    riskLevel: a.riskLevel,
    tariff: a.cbgTariff,
    action: a.recommendedAction || 'Audit berkas medis dan konfirmasi ke faskes.',
    citations: a.legalCitations || [],
    isRealtimeStream: true,
    isCleanClaim: false,
    claim: a,
  }));

  const streamCleanClaims = claims
    .filter((c) => !c.isAnomaly)
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      code: c.noSep,
      patient: c.namaPeserta,
      nik: c.nik,
      title: c.anomalyTitle || 'Klaim Terverifikasi Sesuai Ketentuan JKN',
      description:
        c.anomalyDescription ||
        'Seluruh rekam medis elektronik, kepatuhan tarif INA-CBG, dan indikasi klinis terverifikasi absah sesuai regulasi JKN tanpa kejanggalan.',
      riskScore: c.fraudRiskScore,
      riskLevel: c.riskLevel,
      tariff: c.cbgTariff,
      action: c.recommendedAction || 'Klaim disetujui untuk pembayaran tepat waktu oleh BPJS.',
      citations: [
        {
          regulation: 'Permenkes No. 16 Tahun 2019',
          article: 'Pasal 2 (Kepatuhan Layanan JKN)',
          summary: 'Pelayanan kesehatan memenuhi indikasi medis yang dapat dipertanggungjawabkan.',
        },
      ],
      isRealtimeStream: true,
      isCleanClaim: true,
      claim: c,
    }));

  const fallbackAuditCases = FALLBACK_CASES.map((c) => ({
    id: c.id,
    code: c.caseCode,
    patient: c.patientName,
    nik: c.nikMasked,
    title: c.categoryLabel,
    description: c.detailedAnalysis,
    riskScore: c.riskScore,
    riskLevel: c.riskLevel,
    tariff: c.potentialLoss,
    action: c.recommendedSanction,
    citations: [c.legalReference],
    isRealtimeStream: false,
    isCleanClaim: false,
    claim: null as JknClaimRecord | null,
  }));

  // Selected item guarantee (prepend if not present)
  const selectedCaseEntry = selectedClaimForAudit
    ? [
        {
          id: selectedClaimForAudit.id,
          code: selectedClaimForAudit.noSep,
          patient: selectedClaimForAudit.namaPeserta,
          nik: selectedClaimForAudit.nik,
          title:
            selectedClaimForAudit.anomalyTitle ||
            (selectedClaimForAudit.isAnomaly
              ? 'Anomali Aliran Transaksi'
              : 'Klaim Terverifikasi Sesuai Ketentuan JKN'),
          description:
            selectedClaimForAudit.anomalyDescription ||
            (selectedClaimForAudit.isAnomaly
              ? 'Klaim terindikasi pelanggaran ketentuan JKN.'
              : 'Seluruh kriteria klinis, administrasi SATUSEHAT, kepatuhan tarif INA-CBG, dan rekam medis digital terpenuhi secara lengkap tanpa anomali.'),
          riskScore: selectedClaimForAudit.fraudRiskScore,
          riskLevel: selectedClaimForAudit.riskLevel,
          tariff: selectedClaimForAudit.cbgTariff,
          action:
            selectedClaimForAudit.recommendedAction ||
            (selectedClaimForAudit.isAnomaly
              ? 'Audit berkas medis dan konfirmasi ke faskes.'
              : 'Klaim disetujui untuk pembayaran tepat waktu oleh BPJS.'),
          citations: selectedClaimForAudit.legalCitations || [],
          isRealtimeStream: true,
          isCleanClaim: !selectedClaimForAudit.isAnomaly,
          claim: selectedClaimForAudit,
        },
      ]
    : [];

  const rawCases = [...selectedCaseEntry, ...streamAnomalies, ...streamCleanClaims, ...fallbackAuditCases];
  // Deduplicate by ID
  const allAuditableCases = Array.from(new Map(rawCases.map((c) => [c.id, c])).values());

  const filteredCases = allAuditableCases.filter((c) => {
    if (filterType === 'ANOMALY') return !c.isCleanClaim;
    if (filterType === 'CLEAN') return c.isCleanClaim;
    return true;
  });

  const [activeCaseId, setActiveCaseId] = useState<string>(
    selectedClaimForAudit ? selectedClaimForAudit.id : allAuditableCases[0]?.id || 'CASE-001'
  );

  const currentCase =
    allAuditableCases.find((c) => c.id === activeCaseId) || filteredCases[0] || allAuditableCases[0]!;

  const handleSpeakBriefing = () => {
    const isClean = currentCase.isCleanClaim;
    const speechText = isClean
      ? `Laporan Verifikasi AI: Kasus ${currentCase.code}, atas nama ${currentCase.patient}. Klaim terverifikasi wajar dan sah. Nilai klaim sebesar ${currentCase.tariff.toLocaleString('id-ID')} rupiah telah disetujui untuk pembayaran.`
      : `Laporan Investigasi AI: Kasus ${currentCase.code}, atas nama ${currentCase.patient}. Terdeteksi ${currentCase.title}. Estimasi potensi inefisiensi Dana Jaminan Sosial sebesar ${currentCase.tariff.toLocaleString('id-ID')} rupiah. Rekomendasi: ${currentCase.action}`;

    if (onTriggerAvatarSpeech) {
      onTriggerAvatarSpeech(speechText, isClean ? 'happy' : currentCase.riskLevel === 'CRITICAL' ? 'surprised' : 'thinking');
    }
  };

  return (
    <div
      className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto w-full"
      style={{ minHeight: '600px', height: 'calc(100vh - 130px)' }}
    >
      {/* Left Panel - Case Selector */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Daftar Audit &amp; Verifikasi
          </span>
          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {filteredCases.length} kasus
          </span>
        </div>

        {/* Filter Switcher: Semua vs Anomali vs Wajar */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`flex-1 py-1 text-center rounded-md transition-colors cursor-pointer ${
              filterType === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterType('CLEAN')}
            className={`flex-1 py-1 text-center rounded-md transition-colors cursor-pointer ${
              filterType === 'CLEAN' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Wajar
          </button>
          <button
            type="button"
            onClick={() => setFilterType('ANOMALY')}
            className={`flex-1 py-1 text-center rounded-md transition-colors cursor-pointer ${
              filterType === 'ANOMALY' ? 'bg-white text-rose-700 font-bold shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Anomali
          </button>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredCases.slice(0, 16).map((c) => {
            const isSelected = c.id === activeCaseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveCaseId(c.id);
                  if (c.claim) setSelectedClaimForAudit(c.claim);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-[10px] font-semibold ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {c.code.slice(0, 16)}
                  </span>
                  <span
                    className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                      c.isCleanClaim
                        ? isSelected
                          ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isSelected
                        ? 'bg-rose-900/80 text-rose-200 border-rose-700'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    Skor {c.riskScore}
                  </span>
                </div>
                <div
                  className={`font-semibold text-xs truncate ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {c.patient}
                </div>
                <div
                  className={`text-[11px] truncate mt-0.5 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {c.title}
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Sedang diaudit
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Reading Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                currentCase.isCleanClaim ? 'bg-[#007a3d] text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {currentCase.isCleanClaim ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 leading-tight truncate">
                {currentCase.patient}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                SEP: {currentCase.code}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border font-mono ${
                currentCase.isCleanClaim
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {currentCase.isCleanClaim
                ? `Skor ${currentCase.riskScore} • Lolos Wajar`
                : `Skor ${currentCase.riskScore} • Anomali`}
            </span>
            <button
              type="button"
              onClick={handleSpeakBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dengarkan</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Dokumen</span>
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-7">
          {/* Main Financial / Tariff Metric */}
          <div className="flex items-baseline gap-4">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                {currentCase.isCleanClaim
                  ? 'Nilai Klaim Terverifikasi Sah (INA-CBG)'
                  : 'Estimasi Potensi Inefisiensi DJS'}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-bold font-mono ${
                  currentCase.isCleanClaim ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                Rp {currentCase.tariff.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="flex-1 h-px bg-slate-100 self-center ml-2" />
          </div>

          {/* Temuan */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {currentCase.isCleanClaim ? 'Hasil Uji Kelayakan Klinis' : 'Temuan Forensik Integritas'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-2">
              {currentCase.title}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              NIK: <code className="font-mono text-slate-700">{currentCase.nik}</code> — Verifikasi
              otomatis sistem audit integritas JKN.
            </p>
          </div>

          {/* Analisis Naratif */}
          <div>
            <p className="text-sm text-slate-800 leading-relaxed">
              {currentCase.isCleanClaim ? (
                <>
                  Pemeriksaan silang terhadap berkas admisi dan riwayat klaim peserta atas nama{' '}
                  <strong>{currentCase.patient}</strong> membuktikan bahwa pelayanan medis yang diberikan
                  telah memenuhi seluruh kriteria klinis yang sah, diagnosis primer dan sekunder koheren,
                  serta tarif sesuai standar INA-CBG:
                </>
              ) : (
                <>
                  Hasil penelusuran riwayat berkas digital atas nama peserta{' '}
                  <strong>{currentCase.patient}</strong> mengidentifikasi potensi ketidaksesuaian pola
                  pelayanan terhadap ketentuan regulasi JKN:
                </>
              )}
            </p>
            <blockquote
              className={`mt-3 pl-4 border-l-2 text-sm leading-relaxed ${
                currentCase.isCleanClaim
                  ? 'border-emerald-400 bg-emerald-50/40 p-3 rounded-r-xl text-slate-700'
                  : 'border-rose-400 bg-rose-50/40 p-3 rounded-r-xl text-slate-700'
              }`}
            >
              {currentCase.description}
            </blockquote>
          </div>

          {/* Dasar Hukum */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Rujukan Regulasi &amp; Ketentuan JKN
              </span>
            </div>
            <div className="space-y-2.5">
              {currentCase.citations?.map((cit, idx) => (
                <div key={idx} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="shrink-0">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {cit.article}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">{cit.regulation}</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{cit.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rekomendasi Box */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              currentCase.isCleanClaim
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200/80 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {currentCase.isCleanClaim ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-700" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">
                {currentCase.isCleanClaim
                  ? 'Status Verifikasi VEDIKA: Disetujui'
                  : 'Rekomendasi Tindakan Korektif'}
              </span>
            </div>
            <p className="text-sm font-semibold leading-relaxed mb-3">{currentCase.action}</p>
            <ul
              className={`space-y-1.5 text-xs ${
                currentCase.isCleanClaim ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {currentCase.isCleanClaim ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Klaim memenuhi seluruh syarat administrasi dan verifikasi kepatuhan klinis.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Hak pelayanan peserta terjamin tanpa hambatan atau penundaan.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Pembayaran DJS kepada fasilitas kesehatan diteruskan sesuai siklus berkala.
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    Peninjauan kembali berkas klaim pada sistem VEDIKA.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    Pemberitahuan resmi klarifikasi kepada fasilitas kesehatan perujuk.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    Penerbitan surat peringatan atau klarifikasi kepada peserta bersangkutan.
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
            <span>Audit objektif otomatis berdasar Rule Engine PK-JKN</span>
            <span className="font-mono">Audit Log: HK-2026-BAP-09</span>
          </div>
        </div>
      </div>
    </div>
  );
};
