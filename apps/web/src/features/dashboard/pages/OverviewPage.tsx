import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Radio,
  Clock,
  Fingerprint,
  Stethoscope,
  Pill,
  Activity,
  MessageSquare,
  Scale,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import {
  participantRiskApi,
  FALLBACK_METRICS,
  FALLBACK_CASES,
} from '../../../services/participantRiskApi';
import { useSimulationStream } from '../simulation/SimulationContext';
import { supabase } from '../../../lib/supabase';
import type { ParticipantRiskMetrics, ParticipantAuditCase } from '@healthathon/shared';

// ============================================================================
// INFERA DESIGN TOKENS (selaras dengan landing page)
// ============================================================================
const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';
const INK = '#1d1d1d';
const BLUE_GRADIENT = 'linear-gradient(135deg, #3b82f6 0%, #406ae4 100%)';
const INK_GRADIENT = 'linear-gradient(135deg, #323232 0%, #000000 100%)';
const CARD_SHADOW = '0 0 0 4px rgba(221, 229, 237, 0.55), 0 12px 32px -12px rgba(15, 23, 42, 0.10)';

interface TrendPoint {
  date: string;
  anomalies: number;
  savingsMio: number;
}

const TREND_30D: TrendPoint[] = [
  { date: '01/08', anomalies: 24, savingsMio: 45 },
  { date: '05/08', anomalies: 38, savingsMio: 72 },
  { date: '10/08', anomalies: 42, savingsMio: 88 },
  { date: '15/08', anomalies: 31, savingsMio: 62 },
  { date: '20/08', anomalies: 59, savingsMio: 125 },
  { date: '25/08', anomalies: 68, savingsMio: 148 },
  { date: '30/08', anomalies: 52, savingsMio: 110 },
  { date: '04/09', anomalies: 74, savingsMio: 165 },
];

const TREND_7D: TrendPoint[] = [
  { date: 'Sen', anomalies: 9, savingsMio: 18 },
  { date: 'Sel', anomalies: 12, savingsMio: 24 },
  { date: 'Rab', anomalies: 8, savingsMio: 15 },
  { date: 'Kam', anomalies: 15, savingsMio: 31 },
  { date: 'Jum', anomalies: 11, savingsMio: 22 },
  { date: 'Sab', anomalies: 6, savingsMio: 12 },
  { date: 'Min', anomalies: 13, savingsMio: 27 },
];

const QUICK_MODULES = [
  { to: '/dashboard/identity-risk', label: 'Identitas & Travel', desc: 'Kartu pinjaman', icon: Fingerprint },
  { to: '/dashboard/unnecessary-services', label: 'Doctor Shopping', desc: 'Kunjungan berulang', icon: Stethoscope },
  { to: '/dashboard/pharmacy-alkes', label: 'Resep & Alkes', desc: 'Obat PRB', icon: Pill },
  { to: '/dashboard/transactions', label: 'Aliran Transaksi', desc: 'Stream klaim', icon: Activity },
  { to: '/dashboard/ai-report', label: 'Chat AI', desc: 'Analis virtual', icon: MessageSquare },
  { to: '/dashboard/regulations', label: 'Regulasi JKN', desc: 'Permenkes 16/2019', icon: Scale },
] as const;

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1]!;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

// ----------------------------------------------------------------------------
// Reusable bento card
// ----------------------------------------------------------------------------
const Card: React.FC<{ className?: string; style?: React.CSSProperties; children: React.ReactNode; onClick?: () => void }> = ({
  className = '',
  style,
  children,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`relative rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-5 overflow-hidden ${className}`}
    style={{ boxShadow: CARD_SHADOW, ...style }}
  >
    {children}
  </div>
);

const CircleArrow: React.FC<{ dark?: boolean; onClick?: () => void; label?: string }> = ({ dark, onClick, label }) => (
  <button
    type="button"
    aria-label={label ?? 'Buka detail'}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-transform hover:rotate-45 ${
      dark
        ? 'bg-white text-[#1d1d1d]'
        : 'border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-[#1d1d1d] hover:text-white hover:border-[#1d1d1d]'
    }`}
  >
    <ArrowUpRight className="w-4 h-4" />
  </button>
);

const ChangePill: React.FC<{ value: string; positive: boolean; onDark?: boolean }> = ({ value, positive, onDark }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
      onDark ? 'bg-white/10 text-white' : 'bg-[#1d1d1d] text-white'
    }`}
  >
    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
    {value}
  </span>
);

// ============================================================================
// OVERVIEW PAGE — Bento Dashboard
// ============================================================================
export const OverviewPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { stats, latestAnomaly, isPaused, togglePause } = useSimulationStream();
  const [metrics, setMetrics] = useState<ParticipantRiskMetrics>(FALLBACK_METRICS);
  const [cases, setCases] = useState<ParticipantAuditCase[]>(FALLBACK_CASES);
  const [timeframe, setTimeframe] = useState<'7D' | '30D'>('30D');
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState('Verifikator');
  const [now, setNow] = useState(() => new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Greeting name from Supabase session
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string };
      const name = meta.full_name || meta.name || u.email?.split('@')[0];
      if (name) setDisplayName(name.split(' ')[0]!);
    });
  }, []);

  // Data loading (API + Supabase RPC) — unchanged wiring
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [m, c] = await Promise.all([
          participantRiskApi.getMetrics(),
          participantRiskApi.getCaseStudies(),
        ]);
        if (isMounted) {
          setMetrics(m);
          setCases(c);
        }

        if (supabase) {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_participant_risk_aggregate_metrics');
          if (!rpcError && rpcData && isMounted) {
            setMetrics((prev) => ({
              ...prev,
              totalAnomaliesDetected: rpcData.total_anomalies > 0 ? prev.totalAnomaliesDetected + rpcData.total_anomalies : prev.totalAnomaliesDetected,
              totalPotentialDjsLossPrevented: rpcData.total_potential_loss_prevented > 0 ? prev.totalPotentialDjsLossPrevented + Number(rpcData.total_potential_loss_prevented) : prev.totalPotentialDjsLossPrevented,
            }));
          }
        }
      } catch {
        // Fallback preloaded
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const computed = useMemo(() => ({
    djsValue: ((metrics.totalPotentialDjsLossPrevented + stats.totalDjsLossAmount) / 1_000_000_000).toFixed(2).replace('.', ','),
    anomalyCount: (metrics.totalAnomaliesDetected + stats.totalAnomalies).toLocaleString('id-ID'),
    auditCount: (metrics.totalParticipantsAudited + stats.totalClaims).toLocaleString('id-ID'),
    cleanClaimsValue: ((metrics.totalCleanClaimsApproved + stats.totalVerifiedAmount) / 1_000_000_000).toFixed(1).replace('.', ','),
  }), [metrics, stats.totalDjsLossAmount, stats.totalAnomalies, stats.totalClaims, stats.totalVerifiedAmount]);

  // Category distribution (computed percentages)
  const categories = useMemo(() => {
    const raw = [
      { key: 'UNNECESSARY_SERVICES', label: 'Doctor Shopping', value: metrics.categoryDistribution.UNNECESSARY_SERVICES, color: INK },
      { key: 'IDENTITY_SHARING', label: 'Kartu Pinjaman', value: metrics.categoryDistribution.IDENTITY_SHARING, color: '#3b82f6' },
      { key: 'MEDICINE_ALKES_ABUSE', label: 'Obat PRB & Alkes', value: metrics.categoryDistribution.MEDICINE_ALKES_ABUSE, color: '#93c5fd' },
      { key: 'IDENTITY_FALSIFICATION', label: 'Pemalsuan Data', value: metrics.categoryDistribution.IDENTITY_FALSIFICATION, color: '#cbd5e1' },
    ];
    const total = raw.reduce((s, r) => s + r.value, 0) || 1;
    return { total, items: raw.map((r) => ({ ...r, pct: (r.value / total) * 100 })) };
  }, [metrics.categoryDistribution]);

  // 48 tick bar coloured by category share
  const ticks = useMemo(() => {
    const N = 48;
    const out: string[] = [];
    categories.items.forEach((c) => {
      const n = Math.round((c.pct / 100) * N);
      for (let i = 0; i < n; i++) out.push(c.color);
    });
    while (out.length < N) out.push(categories.items[categories.items.length - 1]!.color);
    return out.slice(0, N);
  }, [categories]);

  // Risk-level dot grid (live from simulation stream)
  const riskDots = useMemo(() => {
    const { CRITICAL, HIGH, MEDIUM } = stats.riskCounts;
    const total = CRITICAL + HIGH + MEDIUM || 1;
    const N = 30;
    const c = Math.round((CRITICAL / total) * N);
    const h = Math.round((HIGH / total) * N);
    return Array.from({ length: N }, (_, i) => (i < c ? 'CRITICAL' : i < c + h ? 'HIGH' : 'MEDIUM'));
  }, [stats.riskCounts]);

  // Trend bars + wave
  const trend = timeframe === '7D' ? TREND_7D : TREND_30D;
  const chart = useMemo(() => {
    const W = 460;
    const H = 170;
    const padTop = 14;
    const padBottom = 22;
    const maxS = Math.max(...trend.map((d) => d.savingsMio)) * 1.08;
    const maxA = Math.max(...trend.map((d) => d.anomalies)) * 1.25;
    const slot = W / trend.length;
    const barW = Math.min(30, slot * 0.58);
    const bars = trend.map((d, i) => {
      const h = (d.savingsMio / maxS) * (H - padTop - padBottom);
      const cx = slot * i + slot / 2;
      return { ...d, x: cx - barW / 2, cx, y: H - padBottom - h, h, w: barW };
    });
    const wave = smoothPath(
      trend.map((d, i) => ({
        x: slot * i + slot / 2,
        y: H - padBottom - (d.anomalies / maxA) * (H - padTop - padBottom),
      })),
    );
    const peak = bars.reduce((best, b, i) => (b.savingsMio > bars[best]!.savingsMio ? i : best), 0);
    const totalSavings = trend.reduce((s, d) => s + d.savingsMio, 0);
    return { W, H, bars, wave, peak, totalSavings };
  }, [trend]);

  const activeBar = hoverBar ?? chart.peak;
  const maxCity = Math.max(...metrics.topRiskCities.map((c) => c.count), 1);

  const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="space-y-5 pb-4">
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1
            className="text-[28px] sm:text-[32px] font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-none"
            style={{ fontFamily: HEADING_FONT }}
          >
            Halo, {displayName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Ringkasan integritas klaim JKN &amp; risiko peserta · {metrics.timeframe}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live clock pill */}
          <div className="flex items-center gap-2 h-10 pl-2 pr-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            </span>
            <div className="leading-tight">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">{timeLabel} WIB</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{dateLabel}</div>
            </div>
          </div>

          {/* Timeframe segmented pill */}
          <div className="flex items-center h-10 p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            {(['7D', '30D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`h-8 px-4 rounded-full transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#1d1d1d] text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tf === '7D' ? '7 Hari' : '30 Hari'}
              </button>
            ))}
          </div>

          {/* Primary CTA pill (landing style) */}
          <button
            onClick={() => navigate('/dashboard/cases')}
            className="group flex items-center gap-3 h-10 pl-5 pr-1.5 rounded-full text-white text-xs font-semibold cursor-pointer"
            style={{ background: INK_GRADIENT, boxShadow: 'inset 2px 2px 6px rgba(255,255,255,0.25), 0 4px 14px rgba(29,29,29,0.35)' }}
          >
            {cases.length} Kasus Benchmark
            <span className="w-7 h-7 rounded-full bg-white text-[#1d1d1d] flex items-center justify-center transition-transform group-hover:rotate-45">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* ROW 1 — Hero black card + blue accent card                       */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* HERO: Efisiensi DJS + bar/wave chart */}
        <div
          className="lg:col-span-8 relative rounded-[28px] p-6 text-white overflow-hidden"
          style={{ background: INK_GRADIENT, boxShadow: '0 20px 40px -18px rgba(0,0,0,0.55)' }}
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-25 blur-3xl" style={{ background: BLUE_GRADIENT }} />

          <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: number + chart */}
            <div className="md:col-span-8 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Potensi Efisiensi DJS Terselamatkan
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-white/60 text-lg font-semibold mb-1.5">Rp</span>
                    <span className="text-5xl sm:text-[56px] font-semibold tracking-tight leading-none tabular-nums" style={{ fontFamily: HEADING_FONT }}>
                      {computed.djsValue}
                    </span>
                    <span className="text-white/60 text-lg font-semibold mb-1.5">M</span>
                  </div>
                </div>
                <ChangePill value="+18,4%" positive onDark />
              </div>

              <div className="relative mt-5 flex-1 min-h-[170px]">
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full h-[170px] overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="inferaBarBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#406ae4" />
                    </linearGradient>
                    <linearGradient id="inferaWave" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#bfdbfe" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {chart.bars.map((b, i) => (
                    <g key={b.date} onMouseEnter={() => setHoverBar(i)} onMouseLeave={() => setHoverBar(null)} className="cursor-pointer">
                      <rect x={b.cx - (b.w / 2) - 4} y={0} width={b.w + 8} height={chart.H} fill="transparent" />
                      <rect
                        x={b.x}
                        y={b.y}
                        width={b.w}
                        height={b.h}
                        rx={b.w / 2}
                        fill={i === activeBar ? 'url(#inferaBarBlue)' : 'rgba(255,255,255,0.92)'}
                        style={{ transition: 'fill 0.2s ease' }}
                      />
                      <text x={b.cx} y={chart.H - 4} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)">
                        {b.date}
                      </text>
                    </g>
                  ))}
                  <path d={chart.wave} fill="none" stroke="url(#inferaWave)" strokeWidth="4" strokeLinecap="round" />
                </svg>

                {chart.bars[activeBar] && (
                  <div
                    className="absolute -top-1 -translate-x-1/2 px-2.5 py-1.5 rounded-xl bg-white text-[#1d1d1d] text-[11px] font-semibold shadow-lg pointer-events-none whitespace-nowrap"
                    style={{ left: `${(chart.bars[activeBar]!.cx / chart.W) * 100}%` }}
                  >
                    Rp {chart.bars[activeBar]!.savingsMio} Jt · {chart.bars[activeBar]!.anomalies} anomali
                  </div>
                )}
              </div>
            </div>

            {/* Right: two stacked stat pills */}
            <div className="md:col-span-4 flex flex-col gap-3 rounded-[22px] bg-white p-3 text-[#1d1d1d]">
              <button
                onClick={() => navigate('/dashboard/transactions')}
                className="flex-1 flex flex-col justify-between rounded-2xl bg-slate-100 p-4 text-left hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Anomali Terdeteksi</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1d1d1d] text-white text-[10px] font-bold">+6,2%</span>
                </div>
                <div className="text-3xl font-semibold tabular-nums mt-3" style={{ fontFamily: HEADING_FONT }}>
                  {computed.anomalyCount}
                </div>
              </button>
              <button
                onClick={() => navigate('/dashboard/master-data')}
                className="flex-1 flex flex-col justify-between rounded-2xl bg-slate-100 p-4 text-left hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Peserta Diaudit</span>
                  <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold" style={{ background: BLUE_GRADIENT }}>+12,1%</span>
                </div>
                <div className="text-3xl font-semibold tabular-nums mt-3" style={{ fontFamily: HEADING_FONT }}>
                  {computed.auditCount}
                </div>
              </button>
              <div className="flex items-center justify-between px-1 pb-0.5 text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1d1d1d]" /> DJS (Juta Rp)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-[3px] rounded-full bg-blue-300" /> Anomali
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BLUE ACCENT: Klaim Valid + risk dot grid */}
        <div
          className="lg:col-span-4 relative rounded-[28px] p-6 text-white overflow-hidden flex flex-col"
          style={{ background: BLUE_GRADIENT, boxShadow: '0 20px 40px -18px rgba(64,106,228,0.6)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-white/80">Komposisi Risiko Anomali</div>
              <p className="text-[11px] text-white/60 mt-1 max-w-[180px] leading-snug">
                Distribusi live tingkat Critical, High &amp; Medium dari stream klaim.
              </p>
            </div>
            <CircleArrow dark onClick={() => navigate('/dashboard/transactions')} label="Buka aliran transaksi" />
          </div>

          <div className="grid grid-cols-10 gap-1.5 mt-5">
            {riskDots.map((lvl, i) => (
              <span
                key={i}
                className="aspect-square rounded-[6px]"
                style={{
                  background: lvl === 'CRITICAL' ? '#1d1d1d' : lvl === 'HIGH' ? '#ffffff' : 'rgba(255,255,255,0.28)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 mt-4">
            {[
              { k: 'Critical', v: stats.riskCounts.CRITICAL, c: '#1d1d1d', t: 'text-white' },
              { k: 'High', v: stats.riskCounts.HIGH, c: '#ffffff', t: 'text-[#1d1d1d]' },
              { k: 'Medium', v: stats.riskCounts.MEDIUM, c: 'rgba(255,255,255,0.28)', t: 'text-white' },
            ].map((r) => (
              <span key={r.k} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.t}`} style={{ background: r.c }}>
                {r.k} · {r.v.toLocaleString('id-ID')}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-5 flex items-end justify-between">
            <div className="text-[11px] text-white/70 leading-tight">
              Klaim Valid JKN
              <br />
              <span className="font-semibold text-white">98,4% akurasi</span>
            </div>
            <div className="text-right leading-none">
              <span className="text-[44px] font-semibold tracking-tight tabular-nums" style={{ fontFamily: HEADING_FONT }}>
                {computed.cleanClaimsValue}
              </span>
              <span className="text-lg font-medium text-white/70"> M</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* ROW 2 — Tipologi + Kasus Prioritas + Live Stream                  */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tipologi modus */}
        <Card className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Activity className="w-4 h-4 text-slate-800 dark:text-slate-200" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: HEADING_FONT }}>
                Tipologi Modus
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100 text-sm">{categories.total.toLocaleString('id-ID')}</strong> kasus
            </span>
          </div>

          <div className="mt-6 flex items-end gap-1.5">
            <span className="text-[44px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-50 tabular-nums" style={{ fontFamily: HEADING_FONT }}>
              {categories.items[0]!.pct.toFixed(1).replace('.', ',')}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">% {categories.items[0]!.label}</span>
          </div>

          <div className="mt-4 flex items-end gap-[3px] h-12">
            {ticks.map((c, i) => (
              <span key={i} className="flex-1 rounded-full" style={{ background: c, height: '100%' }} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5">
            {categories.items.map((c) => (
              <div key={c.key} className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: c.color }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {c.value.toLocaleString('id-ID')}
                    <span className="text-[11px] font-medium text-slate-400 ml-1">{c.pct.toFixed(1).replace('.', ',')}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Kasus prioritas */}
        <Card className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: HEADING_FONT }}>
                Kasus Prioritas Audit
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Temuan forensik dengan skor risiko tertinggi</div>
            </div>
            <button
              onClick={() => navigate('/dashboard/cases')}
              className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
            >
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {cases.slice(0, 4).map((row) => {
              const critical = row.riskLevel === 'CRITICAL';
              const r = 15;
              const circ = 2 * Math.PI * r;
              return (
                <button
                  key={row.id}
                  onClick={() => navigate('/dashboard/cases')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={critical ? { background: INK, color: '#fff' } : { background: '#dbeafe', color: '#1e40af' }}
                  >
                    {initials(row.patientName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">{row.patientName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{row.categoryLabel}</div>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <div className="text-[10px] text-slate-400">Potensi</div>
                    <div className="text-[12px] font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      Rp {(row.potentialLoss / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt
                    </div>
                  </div>
                  <div className="relative w-10 h-10 shrink-0">
                    <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
                      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5" className="stroke-slate-200 dark:stroke-slate-700" />
                      <circle
                        cx="20"
                        cy="20"
                        r={r}
                        fill="none"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke={critical ? INK : '#3b82f6'}
                        strokeDasharray={`${(row.riskScore / 100) * circ} ${circ}`}
                        className={critical ? 'dark:stroke-white' : ''}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-900 dark:text-slate-100">
                      {row.riskScore}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Live stream (Time-Tracker style black card) */}
        <div
          className="lg:col-span-3 relative rounded-[26px] p-5 text-white overflow-hidden flex flex-col"
          style={{ background: INK_GRADIENT, boxShadow: '0 20px 40px -18px rgba(0,0,0,0.55)' }}
        >
          <div className="absolute -bottom-16 -right-10 w-48 h-48 rounded-full opacity-30 blur-3xl" style={{ background: BLUE_GRADIENT }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold" style={{ fontFamily: HEADING_FONT }}>Live Stream</span>
            </div>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${isPaused ? 'bg-white/10 text-white/60' : 'bg-blue-500/20 text-blue-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-white/50' : 'bg-blue-400 animate-pulse'}`} />
              {isPaused ? 'JEDA' : 'LIVE'}
            </span>
          </div>

          <div className="relative mt-5">
            <div className="text-[11px] text-white/50">Total klaim diproses</div>
            <div className="text-[34px] font-semibold tracking-tight tabular-nums leading-tight" style={{ fontFamily: HEADING_FONT }}>
              {stats.totalClaims.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="relative mt-3 rounded-2xl bg-white/[0.07] border border-white/10 p-3 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Anomali terbaru</div>
            {latestAnomaly ? (
              <>
                <div className="text-[12px] font-semibold mt-1 line-clamp-2">{latestAnomaly.anomalyTitle ?? latestAnomaly.fraudTypology}</div>
                <div className="text-[10px] text-white/50 mt-1 truncate">{latestAnomaly.namaFaskes}</div>
                <div className="mt-2 inline-flex px-2 py-0.5 rounded-full bg-white text-[#1d1d1d] text-[10px] font-bold">
                  Skor {latestAnomaly.fraudRiskScore}
                </div>
              </>
            ) : (
              <div className="text-[11px] text-white/50 mt-1">Menunggu klaim anomali berikutnya…</div>
            )}
          </div>

          <div className="relative flex items-center gap-2 mt-4">
            <button
              onClick={togglePause}
              aria-label={isPaused ? 'Lanjutkan stream' : 'Jeda stream'}
              className="w-11 h-11 rounded-full bg-white text-[#1d1d1d] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigate('/dashboard/transactions')}
              className="flex-1 h-11 rounded-full border border-white/20 text-xs font-semibold hover:bg-white/10 transition-colors cursor-pointer"
            >
              Buka Aliran Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* ROW 3 — Sebaran wilayah + Modul cepat                             */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-slate-800 dark:text-slate-200" />
              </span>
              <div>
                <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: HEADING_FONT }}>
                  Sebaran per Wilayah
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Konsentrasi transaksi ganda &amp; mobilitas tinggi</div>
              </div>
            </div>
            <CircleArrow onClick={() => navigate('/dashboard/identity-risk')} label="Buka identitas & travel" />
          </div>

          <div className="space-y-3">
            {metrics.topRiskCities.map((c, i) => (
              <div key={c.city} className="flex items-center gap-3">
                <span className="w-6 text-[11px] font-bold text-slate-400 tabular-nums">0{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.city}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{c.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.count / maxCity) * 100}%`, background: i === 0 ? BLUE_GRADIENT : INK, opacity: i === 0 ? 1 : 1 - i * 0.15 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: HEADING_FONT }}>
                Modul Investigasi
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Akses cepat ke seluruh modul deteksi INFERA</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_MODULES.map((m, i) => {
              const Icon = m.icon;
              const highlight = i === 0;
              return (
                <button
                  key={m.to}
                  onClick={() => navigate(m.to)}
                  className={`group relative text-left rounded-2xl p-4 transition-all cursor-pointer ${
                    highlight
                      ? 'text-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={highlight ? { background: BLUE_GRADIENT } : undefined}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        highlight ? 'bg-white/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${highlight ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`} />
                    </span>
                    <ArrowUpRight
                      className={`w-4 h-4 transition-transform group-hover:rotate-45 ${highlight ? 'text-white' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'}`}
                    />
                  </div>
                  <div className={`mt-4 text-[13px] font-semibold ${highlight ? '' : 'text-slate-900 dark:text-slate-100'}`}>{m.label}</div>
                  <div className={`text-[11px] ${highlight ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
});
