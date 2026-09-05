import React, { useState } from 'react';

export interface TrendDataPoint {
  date: string;
  anomalies: number;
  savingsMio: number; // In Million Rupiah
}

interface TrendAreaChartProps {
  data?: TrendDataPoint[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_TREND: TrendDataPoint[] = [
  { date: '01/08', anomalies: 24, savingsMio: 45 },
  { date: '05/08', anomalies: 38, savingsMio: 72 },
  { date: '10/08', anomalies: 42, savingsMio: 88 },
  { date: '15/08', anomalies: 31, savingsMio: 62 },
  { date: '20/08', anomalies: 59, savingsMio: 125 },
  { date: '25/08', anomalies: 68, savingsMio: 148 },
  { date: '30/08', anomalies: 52, savingsMio: 110 },
  { date: '04/09', anomalies: 74, savingsMio: 165 },
];

function getSmoothCurve(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1]!;

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;
    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  data = DEFAULT_TREND,
  title = 'Tren Deteksi Risiko & Penyelamatan DJS',
  subtitle = 'Dinamika anomali klaim & potensi kerugian dicegah 30 hari terakhir',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 580;
  const height = 190;
  const paddingX = 30;
  const paddingY = 25;

  const maxVal = Math.max(...data.map((d) => d.savingsMio)) * 1.15;
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.savingsMio - minVal) / (maxVal - minVal)) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  // Construct smooth bezier spline curve for area and line
  const linePath = getSmoothCurve(points);
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${height - paddingY} L ${points[0]!.x} ${height - paddingY} Z`;

  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>

        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Penyelamatan DJS (Juta Rp)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-500">Jumlah Kasus</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((p, idx) => {
            const y = height - paddingY - p * (height - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#emeraldAreaGrad)" />

          {/* Clean Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Dots */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === i ? 6 : 4}
                fill="#ffffff"
                stroke="#059669"
                strokeWidth={hoverIndex === i ? 3 : 2}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
              {/* X Axis Date */}
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {pt.date}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="absolute top-2 pointer-events-none transform -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs z-20 space-y-0.5"
            style={{ left: `${(points[hoverIndex]!.x / width) * 100}%` }}
          >
            <div className="font-semibold text-emerald-400">
              Rp {points[hoverIndex]!.savingsMio} Juta Diselamatkan
            </div>
            <div className="text-slate-300 text-[11px]">
              {points[hoverIndex]!.anomalies} Anomali ({points[hoverIndex]!.date})
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Total Efisiensi Dicegah: <strong className="text-slate-900 font-bold">Rp 2.45 Miliar</strong></span>
        <span className="text-slate-400">Sinkronisasi Harian SATUSEHAT</span>
      </div>
    </div>
  );
};
