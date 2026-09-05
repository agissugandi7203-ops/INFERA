import React, { useState } from 'react';

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface DonutChartProps {
  data: DonutSegment[];
  totalLabel?: string;
  totalValue?: string;
  title?: string;
  subtitle?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalLabel = 'Total Anomali',
  totalValue = '1,485',
  title = 'Distribusi Modus Risiko Peserta',
  subtitle = 'Audit komparatif 4 tipologi Healthkathon 2026',
}) => {
  const [activeSegment, setActiveSegment] = useState<DonutSegment | null>(null);

  const radius = 68;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-4">
        {/* SVG Donut Circle */}
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
            {/* Background ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Render segments */}
            {data.map((seg) => {
              const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += seg.percentage;

              const isSelected = activeSegment?.key === seg.key;

              return (
                <circle
                  key={seg.key}
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setActiveSegment(seg)}
                  onMouseLeave={() => setActiveSegment(null)}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {activeSegment ? activeSegment.label.slice(0, 14) + '...' : totalLabel}
            </span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              {activeSegment ? `${activeSegment.value} (${activeSegment.percentage}%)` : totalValue}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2.5">
          {data.map((seg) => {
            const isSelected = activeSegment?.key === seg.key;
            return (
              <div
                key={seg.key}
                onMouseEnter={() => setActiveSegment(seg)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSelected ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-700 truncate max-w-[160px] sm:max-w-[200px]">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-900">{seg.value}</span>
                  <span className="text-slate-400 text-[11px] w-8 text-right">
                    {seg.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Tingkat Kepastian Verifikasi: 98.4%</span>
        <span className="text-emerald-700 font-medium">Validasi Permenkes 16/2019</span>
      </div>
    </div>
  );
};
