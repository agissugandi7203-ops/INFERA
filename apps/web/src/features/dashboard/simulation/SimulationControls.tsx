import React from 'react';
import type {
  SimulationScenarioPreset,
  SimulationConfig,
  SimulationStats,
} from '@healthathon/shared';
import {
  Play,
  Pause,
  RotateCcw,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SimulationControlsProps {
  config: SimulationConfig;
  stats: SimulationStats;
  onSetScenario: (scenario: SimulationScenarioPreset) => void;
  onSetSpeed: (speedMs: number) => void;
  onTogglePause: () => void;
  onReset: () => void;
  onEmitNow: () => void;
  onOpenRegulations: () => void;
}

const SCENARIOS: { id: SimulationScenarioPreset; label: string; badge: string }[] = [
  {
    id: 'ALL_RANDOM',
    label: '🌐 Semua Skenario (Multi-Modus Acak)',
    badge: 'Real-World Stream',
  },
  {
    id: 'KPK_PHYSIOTHERAPY_PHANTOM',
    label: '🚨 Kasus KPK 2024: Fisioterapi Fiktif (Phantom Billing)',
    badge: 'KPK Benchmark',
  },
  {
    id: 'KPK_CATARACT_UPCODING',
    label: '👁️ Kasus KPK 2024: Katarak Upcoding & Unbundling',
    badge: 'KPK Benchmark',
  },
  {
    id: 'SECTIO_CESAREAN_UPCODING',
    label: '👶 Upcoding Seksio Sesarea (Severity III Non-ICU)',
    badge: 'Upcoding',
  },
  {
    id: 'INAPPROPRIATE_READMISSION',
    label: '🔄 Readmisi Berulang Prematur (<14 Hari DBD)',
    badge: 'Readmission',
  },
  {
    id: 'MONOPOLISTIC_REFERRAL',
    label: '🤝 Rujukan Monopolistik & Kickback (Self-Referral)',
    badge: 'Referral',
  },
];

function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  stats,
  onSetScenario,
  onSetSpeed,
  onTogglePause,
  onReset,
  onEmitNow,
  onOpenRegulations,
}) => {
  const anomalyRatePercent =
    stats.totalClaims > 0
      ? Math.round((stats.totalAnomalies / stats.totalClaims) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Top Bar: Scenario Selector & Playback Controls */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Scenario Picker */}
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Skenario Simulasi Klaim VClaim WS 2.0:
            </label>
            <div className="relative">
              <select
                value={config.scenario}
                onChange={(e) => onSetScenario(e.target.value as SimulationScenarioPreset)}
                aria-label="Pilih Skenario Simulasi Klaim VClaim WS 2.0"
                className="w-full bg-slate-950 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer shadow-inner"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 py-1 text-slate-100">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center flex-wrap gap-2 pt-1 lg:pt-5">
            {/* Play/Pause */}
            <button
              onClick={onTogglePause}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
                config.isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
              }`}
            >
              {config.isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Mulai Stream
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  Jeda Stream
                </>
              )}
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              {[
                { label: '1x (2.5s)', speed: 2500 },
                { label: '2x (1.2s)', speed: 1200 },
                { label: '5x (0.5s)', speed: 500 },
              ].map((sp) => (
                <button
                  key={sp.speed}
                  onClick={() => onSetSpeed(sp.speed)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    config.speedMs === sp.speed
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {/* Emit 1 Claim Now */}
            <button
              onClick={onEmitNow}
              title="Kirim 1 Klaim Baru Sekarang"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700/60 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">+1 Klaim</span>
            </button>

            {/* Reset */}
            <button
              onClick={onReset}
              title="Reset Statistik Simulasi"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-medium border border-slate-700/60 hover:border-rose-700/60 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Regulatory RAG Browser Button */}
            <button
              onClick={onOpenRegulations}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-950/40 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Korpus RAG JKN (13 Dokumen)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Claims */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Klaim Diperiksa</div>
            <div className="text-xl font-bold text-white tracking-tight">
              {stats.totalClaims.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">VClaim WS 2.0 Stream</div>
          </div>
        </div>

        {/* Total Anomalies */}
        <div className="bg-slate-900/80 border border-rose-900/30 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Anomali Terdeteksi</div>
            <div className="text-xl font-bold text-rose-400 tracking-tight flex items-baseline gap-2">
              {stats.totalAnomalies.toLocaleString('id-ID')}
              <span className="text-xs font-normal text-rose-400/80">({anomalyRatePercent}%)</span>
            </div>
            <div className="text-[11px] text-rose-300/80 mt-0.5">Deteksi VEDIKA & DEFRADA</div>
          </div>
        </div>

        {/* DJS Loss Avoided */}
        <div className="bg-slate-900/80 border border-amber-900/30 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Potensi Kerugian DJS</div>
            <div className="text-xl font-bold text-amber-400 tracking-tight">
              {formatRupiah(stats.totalDjsLossAmount)}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-0.5">Dicegah / Ditahan</div>
          </div>
        </div>

        {/* Clean Claims Approved */}
        <div className="bg-slate-900/80 border border-emerald-900/30 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Klaim Bersih Terverifikasi</div>
            <div className="text-xl font-bold text-emerald-400 tracking-tight">
              {formatRupiah(stats.totalVerifiedAmount)}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-0.5">Lolos Otomatis (100%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
