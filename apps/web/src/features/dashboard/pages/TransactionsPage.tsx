import React, { useState, useRef, useEffect } from 'react';
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

export const TransactionsPage: React.FC = () => {
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
  const prevClaimCountRef = useRef(claims.length);

  const cleanCount = claims.filter((c) => !c.isAnomaly).length;
  const anomalyCount = claims.filter((c) => c.isAnomaly).length;

  // Preserve scroll position when new claims prepend at top
  useEffect(() => {
    const tbody = tableBodyRef.current;
    if (!tbody || claims.length <= prevClaimCountRef.current) {
      prevClaimCountRef.current = claims.length;
      return;
    }
    prevClaimCountRef.current = claims.length;
  }, [claims.length]);

  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      c.namaPeserta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.noSep.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.namaFaskes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.diagAwal.toLowerCase().includes(searchQuery.toLowerCase());

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

  const handleInspectInAi = (claim: JknClaimRecord) => {
    setSelectedClaimForAudit(claim);
    navigate('/dashboard/ai-report');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto w-full">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Aliran Transaksi Klaim Real-Time
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring penerbitan SEP &amp; verifikasi kelayakan otomatis tanpa bias.
          </p>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-700 border border-slate-200">
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
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            {isPaused ? 'Lanjutkan' : 'Jeda'}
          </button>

          <button
            type="button"
            onClick={triggerManualClaim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>+ Klaim Baru</span>
          </button>
        </div>
      </div>

      {/* Objectivity & Fairness Banner (Non-Bias Guarantee) */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#007a3d] shrink-0" />
          <span>
            <strong className="text-slate-900 font-semibold">Audit Non-Bias &amp; Objektif:</strong>{' '}
            Sistem secara adil memverifikasi mayoritas klaim yang sah dan hanya memicu alarm pada
            penyimpangan nyata.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono font-semibold">
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            Wajar: {cleanCount} ({Math.round((cleanCount / (claims.length || 1)) * 100)}%)
          </span>
          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            Anomali: {anomalyCount} ({Math.round((anomalyCount / (claims.length || 1)) * 100)}%)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SEP, nama peserta, faskes, atau ICD-10..."
            className="w-full h-9 pl-9 pr-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {/* Status Filter (Semua / Wajar / Anomali) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 self-start">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            Semua ({claims.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('CLEAN')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'CLEAN'
                ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            Wajar ({cleanCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ANOMALY')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'ANOMALY'
                ? 'bg-white text-rose-700 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            Anomali ({anomalyCount})
          </button>
        </div>

        {/* Jenis Pelayanan Filter */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 self-start">
          <button
            type="button"
            onClick={() => setFilterJns('ALL')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterJns === 'ALL'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterJns('RANAP')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterJns === 'RANAP'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            Ranap
          </button>
          <button
            type="button"
            onClick={() => setFilterJns('RALAN')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterJns === 'RALAN'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            Ralan
          </button>
        </div>
      </div>

      {/* Standard Clean VClaim Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
              className="divide-y divide-slate-100 text-sm"
              style={{ overflowAnchor: 'auto' }}
            >
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-2.5 px-4">
                    <div className="font-mono font-bold text-slate-900">{claim.noSep}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{claim.tglSep}</div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">{claim.namaPeserta}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">{claim.nik}</div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-800">{claim.namaFaskes}</div>
                    <div className="text-xs text-slate-400">Kelas {claim.kelasFaskes}</div>
                  </td>

                  <td className="py-3.5 px-5 text-slate-600">
                    <span className="font-medium text-slate-800">{claim.ruangPerawatan}</span>
                    <div className="text-xs text-slate-400">
                      {claim.jnsPelayanan === 1 ? 'Rawat Inap' : 'Rawat Jalan'}
                    </div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-800">
                      <span className="font-mono font-bold text-slate-900 mr-1.5">
                        {claim.diagAwal}
                      </span>
                      <span className="truncate max-w-[200px] inline-block align-bottom">
                        {claim.namaDiagnosaAwal}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      CBG: {claim.cbgCode}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    Rp {claim.cbgTariff.toLocaleString('id-ID')}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    {claim.isAnomaly ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Skor {claim.fraudRiskScore}
                        </span>
                        <span className="text-[10px] text-rose-600 font-medium">Anomali</span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Skor {claim.fraudRiskScore}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">Lolos Wajar</span>
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleInspectInAi(claim)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        claim.isAnomaly
                          ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200'
                          : 'bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700'
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
};
