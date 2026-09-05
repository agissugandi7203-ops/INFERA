import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldAlert,
  PiggyBank,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { MetricCard } from '../components/charts/MetricCard';
import { DonutChart, DonutSegment } from '../components/charts/DonutChart';
import { TrendAreaChart } from '../components/charts/TrendAreaChart';
import { BarRankChart } from '../components/charts/BarRankChart';
import {
  participantRiskApi,
  FALLBACK_METRICS,
  FALLBACK_CASES,
} from '../../../services/participantRiskApi';
import { useSimulationStream } from '../simulation/SimulationContext';
import { supabase } from '../../../lib/supabase';
import type { ParticipantRiskMetrics, ParticipantAuditCase } from '@healthathon/shared';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { stats } = useSimulationStream();
  const [metrics, setMetrics] = useState<ParticipantRiskMetrics>(FALLBACK_METRICS);
  const [cases, setCases] = useState<ParticipantAuditCase[]>(FALLBACK_CASES);
  const [timeframe, setTimeframe] = useState<'7D' | '30D'>('30D');

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

        // Try reading live aggregate metrics from Supabase RPC if configured
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


  const donutSegments: DonutSegment[] = [
    {
      key: 'IDENTITY_SHARING',
      label: 'Kartu Pinjaman',
      value: metrics.categoryDistribution.IDENTITY_SHARING,
      percentage: 29.1,
      color: '#059669',
    },
    {
      key: 'UNNECESSARY_SERVICES',
      label: 'Doctor Shopping (DSI)',
      value: metrics.categoryDistribution.UNNECESSARY_SERVICES,
      percentage: 34.5,
      color: '#0284c7',
    },
    {
      key: 'MEDICINE_ALKES_ABUSE',
      label: 'Obat PRB & Alkes',
      value: metrics.categoryDistribution.MEDICINE_ALKES_ABUSE,
      percentage: 25.7,
      color: '#d97706',
    },
    {
      key: 'IDENTITY_FALSIFICATION',
      label: 'Pemalsuan Data',
      value: metrics.categoryDistribution.IDENTITY_FALSIFICATION,
      percentage: 10.8,
      color: '#e11d48',
    },
  ];

  const topCitiesItems = metrics.topRiskCities.map((c) => ({
    label: c.city,
    count: c.count,
    badge: 'Prioritas',
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Ringkasan Risiko Peserta
          </h1>
        </div>

        {/* Timeframe & Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setTimeframe('7D')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                timeframe === '7D'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setTimeframe('30D')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                timeframe === '30D'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              30 Hari
            </button>
          </div>

          <button
            onClick={() => navigate('/dashboard/cases')}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <span>4 Kasus Benchmark</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards (Elevated 3D Depth & Real Stream Dynamic Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Potensi Efisiensi DJS"
          value={`Rp ${((metrics.totalPotentialDjsLossPrevented + stats.totalDjsLossAmount) / 1_000_000_000).toFixed(2).replace('.', ',')} M`}
          changeText="+18.4%"
          isPositive={true}
          icon={PiggyBank}
          iconColorClass="text-emerald-700"
          iconBgClass="bg-emerald-50"
          subtitle="Terselamatkan real-time"
        />

        <MetricCard
          title="Anomali Terdeteksi"
          value={(metrics.totalAnomaliesDetected + stats.totalAnomalies).toLocaleString('id-ID')}
          changeText="+6.2%"
          isPositive={false}
          icon={ShieldAlert}
          iconColorClass="text-rose-700"
          iconBgClass="bg-rose-50"
          subtitle="Audit investigasi"
        />

        <MetricCard
          title="Peserta Diaudit"
          value={(metrics.totalParticipantsAudited + stats.totalClaims).toLocaleString('id-ID')}
          changeText="+12.1%"
          isPositive={true}
          icon={Users}
          iconColorClass="text-sky-600"
          iconBgClass="bg-sky-50"
          subtitle="Stream real-time"
        />

        <MetricCard
          title="Klaim Valid JKN"
          value={`Rp ${((metrics.totalCleanClaimsApproved + stats.totalVerifiedAmount) / 1_000_000_000).toFixed(1).replace('.', ',')} M`}
          subtitle="98.4% tingkat akurasi"
          icon={CheckCircle2}
          iconColorClass="text-indigo-600"
          iconBgClass="bg-indigo-50"
        />
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <TrendAreaChart />
        </div>
        <div className="lg:col-span-5">
          <DonutChart data={donutSegments} />
        </div>
      </div>

      {/* Data-Dense Anomaly Audit Table (Linear / Supabase Style) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-slate-900">
              Temuan Kasus Prioritas Audit Forensik
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 font-semibold">
              4 Kasus Benchmark
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard/cases')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
          >
            <span>Buka Detail Forensik Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dense Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Kasus ID</th>
                <th className="py-3 px-5">Peserta / NIK</th>
                <th className="py-3 px-5">Tipologi Modus</th>
                <th className="py-3 px-5 text-right">Potensi Inefisiensi</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cases.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate('/dashboard/cases')}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                    {row.caseCode}
                  </td>
                  <td className="py-3.5 px-5 text-slate-700">
                    <div className="font-semibold text-slate-900">{row.patientName}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">{row.nikMasked}</div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">
                    <span className="font-medium text-slate-800 line-clamp-1">
                      {row.categoryLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-rose-600 tabular-nums">
                    Rp {row.potentialLoss.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        row.riskLevel === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {row.riskLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700 text-xs font-semibold transition-all">
                      Audit Kasus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Top Risk Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <BarRankChart
            title="Sebaran Kasus per Wilayah Cabang"
            subtitle="Konsentrasi transaksi ganda & mobilitas tinggi"
            items={topCitiesItems}
            barColorClass="bg-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
