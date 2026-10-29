import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Radio,
  ArrowUpRight,
  X,
  Layers,
  Activity,
} from 'lucide-react';
import { useSimulationStream } from '../simulation/SimulationContext';
import type { JknClaimRecord } from '@healthathon/shared';

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';
const BLUE_GRADIENT = 'linear-gradient(135deg, #3b82f6 0%, #406ae4 100%)';
const INK_GRADIENT = 'linear-gradient(135deg, #1f2026 0%, #111216 100%)';

export const TransactionsPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const {
    claims,
    isPaused,
    togglePause,
    intervalSec,
    triggerManualClaim,
    setSelectedClaimForAudit,
  } = useSimulationStream();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterJns, setFilterJns] = useState<'ALL' | 'RANAP' | 'RALAN'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CLEAN' | 'ANOMALY'>('ALL');
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const cleanCount = useMemo(() => claims.filter((c) => !c.isAnomaly).length, [claims]);
  const anomalyCount = useMemo(() => claims.filter((c) => c.isAnomaly).length, [claims]);
  const totalTariffMio = useMemo(
    () => Math.round(claims.reduce((acc, c) => acc + (c.cbgTariff || c.tarifRs || 0), 0) / 1_000_000),
    [claims]
  );

  const filteredClaims = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return claims.filter((c) => {
      const matchesSearch =
        !query ||
        c.namaPeserta.toLowerCase().includes(query) ||
        c.noSep.toLowerCase().includes(query) ||
        c.namaFaskes.toLowerCase().includes(query) ||
        c.diagAwal.toLowerCase().includes(query) ||
        c.cbgCode.toLowerCase().includes(query);

      const matchesJns =
        filterJns === 'ALL'
          ? true
          : filterJns === 'RANAP'
          ? c.jnsPelayanan === 1
          : c.jnsPelayanan === 2;

      const matchesStatus =
        filterStatus === 'ALL'
          ? true
          : filterStatus === 'CLEAN'
          ? !c.isAnomaly
          : c.isAnomaly;

      return matchesSearch && matchesJns && matchesStatus;
    });
  }, [claims, searchQuery, filterJns, filterStatus]);

  const handleInspectInAi = (claim: JknClaimRecord) => {
    setSelectedClaimForAudit(claim);
    const costText = claim.cbgTariff
      ? `Tarif CBG: Rp ${claim.cbgTariff.toLocaleString('id-ID')}`
      : `Tarif RS: Rp ${claim.tarifRs.toLocaleString('id-ID')}`;
    const anomalyText = claim.isAnomaly
      ? `Indikasi Anomali: ${claim.anomalyTitle} (Skor Risiko: ${claim.fraudRiskScore}/100, Tingkat: ${claim.riskLevel}). ${claim.anomalyDescription}`
      : `Status: Lolos Verifikasi Wajar (Skor Risiko: ${claim.fraudRiskScore}/100)`;
    const jnsText = claim.jnsPelayanan === 1 ? 'Rawat Inap (RITL)' : 'Rawat Jalan (RJTL)';

    const promptText = `Lakukan audit investigasi dan uji forensik komprehensif terhadap berkas klaim berikut:
- No. SEP: ${claim.noSep}
- Nama Peserta: ${claim.namaPeserta} (No. Kartu: ${claim.noKartu}, NIK: ${claim.nik})
- Fasilitas Kesehatan: ${claim.namaFaskes} (Kelas ${claim.kelasFaskes}, Kode PPK: ${claim.ppkPelayanan})
- Jenis Pelayanan: ${jnsText}${claim.poliTujuan ? ` | Poli: ${claim.poliTujuan}` : ''}
- Diagnosa Utama: ${claim.diagAwal} - ${claim.namaDiagnosaAwal}
- Kode INA-CBG: ${claim.cbgCode} (Tingkat Keparahan: Severity ${claim.severityLevel})
- Biaya Klaim: ${costText}
- Temuan Indikator: ${anomalyText}

Sajikan analisis kepatuhan regulasi JKN, hitung potensi kerugian dana jaminan sosial (DJS), dan rekomendasikan tindakan tegas auditor.`;

    navigate('/dashboard/ai-report', {
      state: {
        autoPrompt: promptText,
        claim,
      },
    });
  };

  const cleanPercent = Math.round((cleanCount / (claims.length || 1)) * 100);
  const anomalyPercent = Math.round((anomalyCount / (claims.length || 1)) * 100);

  return (
    <div className="space-y-6 w-full max-w-[1760px] mx-auto pb-8">
      {/* ================================================================ */}
      {/* 1. Header Section: Title & Stream Control Pills                  */}
      {/* ================================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-[28px] sm:text-[32px] font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-none"
              style={{ fontFamily: HEADING_FONT }}
            >
              Aliran Transaksi Klaim
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
              <Radio className="w-3 h-3 animate-pulse text-blue-500" />
              Live Stream VEDIKA
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Verifikasi kelayakan klaim JKN secara real-time dengan model audit non-bias &amp; tanpa friksi.
          </p>
        </div>

        {/* Live Stream Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status badge pill */}
          <div className="flex items-center gap-2 h-10 px-4 rounded-full bg-white dark:bg-[#131418] border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-amber-400' : 'bg-blue-500 animate-pulse'
              }`}
            />
            <span className="font-mono">
              {isPaused ? 'Stream Dijeda' : `Live (+1/${intervalSec}s)`}
            </span>
          </div>

          {/* Toggle Pause/Resume button */}
          <button
            type="button"
            onClick={togglePause}
            className="flex items-center gap-2 h-10 px-4 rounded-full border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#131418] hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            title={isPaused ? 'Lanjutkan stream data' : 'Jeda stream data'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span>{isPaused ? 'Lanjutkan' : 'Jeda Stream'}</span>
          </button>

          {/* Manual trigger claim button */}
          <button
            type="button"
            onClick={triggerManualClaim}
            className="flex items-center gap-2 h-10 px-4 rounded-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-[#131418] text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>+ Simulasikan Klaim</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. Modern Bento Summary Cards Row                                */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Total Klaim (Hero Dark Card) */}
        <div
          className="md:col-span-5 relative rounded-[28px] p-6 text-white overflow-hidden flex flex-col justify-between shadow-xl"
          style={{ background: INK_GRADIENT }}
        >
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20 blur-3xl" style={{ background: BLUE_GRADIENT }} />
          
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-medium text-white/60 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-white/80" />
              Total Transaksi Terpantau
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
              Hari Ini
            </span>
          </div>

          <div className="relative my-4">
            <div
              className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-white"
              style={{ fontFamily: HEADING_FONT }}
            >
              {claims.length.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-white/60 mt-1">
              Akumulasi nilai klaim diaudit: <strong className="text-white font-mono">Rp {totalTariffMio.toLocaleString('id-ID')} Jt</strong>
            </div>
          </div>

          <div className="relative pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
            <span>Integritas Audit Non-Bias</span>
            <span className="font-semibold text-white">100% Objektif</span>
          </div>
        </div>

        {/* Card 2: Klaim Wajar (Blue Gradient Card) */}
        <div
          className="md:col-span-4 relative rounded-[28px] p-6 text-white overflow-hidden flex flex-col justify-between shadow-xl cursor-pointer group"
          style={{ background: BLUE_GRADIENT }}
          onClick={() => setFilterStatus(filterStatus === 'CLEAN' ? 'ALL' : 'CLEAN')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Klaim Wajar &amp; Lolos
            </span>
            <span className="w-7 h-7 rounded-full bg-white/15 text-white flex items-center justify-center transition-transform group-hover:rotate-45">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="my-3">
            <div
              className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white"
              style={{ fontFamily: HEADING_FONT }}
            >
              {cleanCount.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-white/80 mt-1">
              {cleanPercent}% dari total klaim berjalan
            </div>
          </div>

          <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
            <span>Status Verifikasi:</span>
            <span className="font-semibold text-white">Disetujui Otomatis</span>
          </div>
        </div>

        {/* Card 3: Anomali Terdeteksi (Obsidian Matte Card) */}
        <div
          className="md:col-span-3 rounded-[28px] p-6 bg-white dark:bg-[#131418] border border-slate-200/70 dark:border-white/[0.08] shadow-sm flex flex-col justify-between cursor-pointer group hover:border-rose-400/50 transition-all"
          onClick={() => setFilterStatus(filterStatus === 'ANOMALY' ? 'ALL' : 'ANOMALY')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Anomali Terdeteksi
            </span>
            <span className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center transition-transform group-hover:rotate-45">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="my-3">
            <div
              className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-slate-100"
              style={{ fontFamily: HEADING_FONT }}
            >
              {anomalyCount.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              {anomalyPercent}% memicu alarm risiko
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tindakan:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">Perlu Audit AI</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. Search & Segmented Filter Bar                                 */}
      {/* ================================================================ */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. SEP, nama peserta, NIK, faskes, diagnosa ICD-10, atau CBG..."
            className="w-full h-11 pl-10 pr-9 bg-white dark:bg-[#131418] rounded-full border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segment */}
          <div className="flex items-center h-10 p-1 rounded-full bg-white dark:bg-[#131418] border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`h-8 px-3.5 rounded-full transition-colors cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Semua ({claims.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('CLEAN')}
              className={`h-8 px-3.5 rounded-full transition-colors cursor-pointer ${
                filterStatus === 'CLEAN'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-blue-500'
              }`}
            >
              Wajar ({cleanCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ANOMALY')}
              className={`h-8 px-3.5 rounded-full transition-colors cursor-pointer ${
                filterStatus === 'ANOMALY'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'
              }`}
            >
              Anomali ({anomalyCount})
            </button>
          </div>

          {/* Service Type Segment */}
          <div className="flex items-center h-10 p-1 rounded-full bg-white dark:bg-[#131418] border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterJns('ALL')}
              className={`h-8 px-3.5 rounded-full transition-colors cursor-pointer ${
                filterJns === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Semua Tipe
            </button>
            <button
              type="button"
              onClick={() => setFilterJns('RANAP')}
              className={`h-8 px-3.5 rounded-full transition-colors cursor-pointer ${
                filterJns === 'RANAP'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Ranap
            </button>
            <button
              type="button"
              onClick={() => setFilterJns('RALAN')}
              className={`h-8 px-3.5 rounded-full transition-colors cursor-pointer ${
                filterJns === 'RALAN'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-[#131418]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Ralan
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. Stream Table Card Container                                   */}
      {/* ================================================================ */}
      <div className="rounded-[28px] bg-white dark:bg-[#131418] border border-slate-200/70 dark:border-white/[0.08] p-4 sm:p-5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
              style={{ fontFamily: HEADING_FONT }}
            >
              Daftar Transaksi Terpantau
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredClaims.length} dari {claims.length})
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Klik <strong className="text-slate-700 dark:text-slate-200">Uji AI ↗</strong> untuk forensik komprehensif
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">No. SEP &amp; Waktu</th>
                <th className="py-3 px-3">Peserta &amp; NIK</th>
                <th className="py-3 px-3">Fasilitas Kesehatan</th>
                <th className="py-3 px-3">Layanan</th>
                <th className="py-3 px-3">Diagnosa &amp; CBG</th>
                <th className="py-3 px-3 text-right">Tarif CBG</th>
                <th className="py-3 px-3 text-center">Status Integritas</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody
              ref={tableBodyRef}
              className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs"
              style={{ overflowAnchor: 'auto' }}
            >
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada klaim yang cocok dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* No SEP & Timestamp */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{claim.noSep}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{claim.tglSep}</div>
                    </td>

                    {/* Patient & NIK */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{claim.namaPeserta}</div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{claim.nik}</div>
                    </td>

                    {/* Faskes */}
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{claim.namaFaskes}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">Kelas {claim.kelasFaskes}</div>
                    </td>

                    {/* Service Type */}
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{claim.ruangPerawatan || 'Umum'}</span>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {claim.jnsPelayanan === 1 ? 'Rawat Inap (RITL)' : 'Rawat Jalan (RJTL)'}
                      </div>
                    </td>

                    {/* Diagnosis & CBG */}
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 mr-1.5">
                          {claim.diagAwal}
                        </span>
                        <span className="truncate max-w-[200px] inline-block align-bottom text-slate-600 dark:text-slate-300">
                          {claim.namaDiagnosaAwal}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        CBG: {claim.cbgCode} · Sev {claim.severityLevel}
                      </div>
                    </td>

                    {/* Tariff */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      Rp {claim.cbgTariff.toLocaleString('id-ID')}
                    </td>

                    {/* Integrity & Score */}
                    <td className="py-3.5 px-3 text-center">
                      {claim.isAnomaly ? (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            Skor {claim.fraudRiskScore}
                          </span>
                          <span className="text-[10px] text-rose-500 font-medium">Anomali</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            Skor {claim.fraudRiskScore}
                          </span>
                          <span className="text-[10px] text-blue-500/80 font-medium">Lolos Wajar</span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleInspectInAi(claim)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-98 ${
                          claim.isAnomaly
                            ? 'bg-rose-600 text-white hover:bg-rose-500'
                            : 'bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10'
                        }`}
                        title={claim.isAnomaly ? 'Audit forensik anomali di Lab AI' : 'Uji kelayakan klaim di Lab AI'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Uji AI</span>
                        <ArrowUpRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
