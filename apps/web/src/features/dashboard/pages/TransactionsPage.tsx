import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useSimulationStream } from '../simulation/SimulationContext';
import type { JknClaimRecord } from '@healthathon/shared';

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

  const filteredClaims = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return claims.filter((c) => {
      const matchesSearch =
        !query ||
        c.namaPeserta.toLowerCase().includes(query) ||
        c.noSep.toLowerCase().includes(query) ||
        c.namaFaskes.toLowerCase().includes(query) ||
        c.diagAwal.toLowerCase().includes(query);

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

  return (
    <div className="space-y-4 max-w-6xl mx-auto w-full">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Aliran Transaksi Klaim Real-Time
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoring penerbitan SEP &amp; verifikasi kelayakan otomatis tanpa bias.
          </p>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-slate-400' : 'bg-[#007a3d]'
              }`}
            />
            <span className="font-semibold font-mono text-xs">
              {isPaused ? 'Dijeda' : `Live (+1/${intervalSec}s)`}
            </span>
          </div>

          <button
            type="button"
            onClick={togglePause}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
          >
            {isPaused ? 'Lanjutkan' : 'Jeda'}
          </button>

          <button
            type="button"
            onClick={triggerManualClaim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>+ Klaim Baru</span>
          </button>
        </div>
      </div>

      {/* Objectivity & Fairness Banner (Non-Bias Guarantee) */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#007a3d] dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">Audit Non-Bias &amp; Objektif:</strong>{' '}
            Sistem secara adil memverifikasi mayoritas klaim yang sah dan hanya memicu alarm pada
            penyimpangan nyata.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono font-semibold">
          <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
            Wajar: {cleanCount} ({Math.round((cleanCount / (claims.length || 1)) * 100)}%)
          </span>
          <span className="text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
            Anomali: {anomalyCount} ({Math.round((anomalyCount / (claims.length || 1)) * 100)}%)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SEP, nama peserta, faskes, atau ICD-10..."
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400"
          />
        </div>

        {/* Status Filter (Semua / Wajar / Anomali) */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 self-start">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Semua ({claims.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('CLEAN')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'CLEAN'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Wajar ({cleanCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ANOMALY')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'ANOMALY'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Anomali ({anomalyCount})
          </button>
        </div>

        {/* Jenis Pelayanan Filter */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 self-start">
          <button
            type="button"
            onClick={() => setFilterJns('ALL')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterJns === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterJns('RANAP')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterJns === 'RANAP'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Ranap
          </button>
          <button
            type="button"
            onClick={() => setFilterJns('RALAN')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterJns === 'RALAN'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Ralan
          </button>
        </div>
      </div>

      {/* Standard Clean VClaim Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Waktu &amp; No. SEP</th>
                <th className="py-2.5 px-4">Nama Peserta / NIK</th>
                <th className="py-2.5 px-4">Faskes</th>
                <th className="py-2.5 px-4">Layanan</th>
                <th className="py-2.5 px-4">Diagnosa (ICD-10)</th>
                <th className="py-2.5 px-4 text-right">Tarif CBG</th>
                <th className="py-2.5 px-4 text-center">Integritas &amp; Skor</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody
              ref={tableBodyRef}
              className="divide-y divide-slate-100 dark:divide-slate-800 text-sm"
              style={{ overflowAnchor: 'auto' }}
            >
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="py-2.5 px-4">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{claim.noSep}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{claim.tglSep}</div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{claim.namaPeserta}</div>
                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{claim.nik}</div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{claim.namaFaskes}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">Kelas {claim.kelasFaskes}</div>
                  </td>

                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{claim.ruangPerawatan}</span>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {claim.jnsPelayanan === 1 ? 'Rawat Inap' : 'Rawat Jalan'}
                    </div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 mr-1.5">
                        {claim.diagAwal}
                      </span>
                      <span className="truncate max-w-[200px] inline-block align-bottom text-slate-600 dark:text-slate-300">
                        {claim.namaDiagnosaAwal}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                      CBG: {claim.cbgCode}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    Rp {claim.cbgTariff.toLocaleString('id-ID')}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    {claim.isAnomaly ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          Skor {claim.fraudRiskScore}
                        </span>
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Anomali</span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Skor {claim.fraudRiskScore}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Lolos Wajar</span>
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleInspectInAi(claim)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        claim.isAnomaly
                          ? 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300'
                      }`}
                      title={claim.isAnomaly ? 'Audit forensik anomali' : 'Uji kelayakan klaim di Lab AI'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Uji AI</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
