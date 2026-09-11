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

export const DonutChart: React.FC<DonutChartProps> = React.memo(({
  data,
  totalLabel = 'Total Anomali',
  totalValue = '1,485',
  title = 'Distribusi Modus Risiko Peserta',
  subtitle = 'Audit komparatif 4 tipologi fraud INFERA',
}) => {
  const [activeSegment, setActiveSegment] = useState<DonutSegment | null>(null);

  const radius = 68;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200/80 dark:via-slate-700/80 to-transparent" />
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
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
              className="stroke-slate-100 dark:stroke-slate-800"
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
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {activeSegment ? activeSegment.label.slice(0, 14) + '...' : totalLabel}
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
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
                  isSelected ? 'bg-slate-100 dark:bg-slate-800 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[160px] sm:max-w-[200px]">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{seg.value}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] w-8 text-right">
                    {seg.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Tingkat Kepastian Verifikasi: 98.4%</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Validasi Permenkes 16/2019</span>
      </div>
    </div>
  );
});

