import React from 'react';

interface PrescriptionGaugeProps {
  value: number; // e.g. 190 (%)
  title?: string;
  subtitle?: string;
  threshold?: number; // e.g. 140 (%)
}

export const PrescriptionGauge: React.FC<PrescriptionGaugeProps> = ({
  value,
  title = 'Prescription Overlap Ratio (POR)',
  subtitle = 'Ambang batas penimbunan obat kronis PRB (> 140%)',
  threshold = 140,
}) => {
  const normalizedVal = Math.min(Math.max(value, 0), 250);
  const maxScale = 250;

  const isCritical = value >= threshold;
  const isWarning = value > 100 && value < threshold;

  const color = isCritical ? '#e11d48' : isWarning ? '#d97706' : '#059669';
  const statusLabel = isCritical
    ? 'CRITICAL RESALE ARBITRAGE'
    : isWarning
    ? 'PERINGATAN SURPLUS RESEP'
    : 'TERAPI NORMAL (30 HARI)';

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center justify-center my-4">
        {/* Gauge Arc */}
        <div className="relative w-56 h-28 overflow-hidden flex items-end justify-center">
          <svg className="w-56 h-56 -rotate-180 transform" viewBox="0 0 200 200">
            {/* Background semi-ring */}
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="#f1f5f9"
              strokeWidth="20"
              fill="transparent"
              strokeDasharray="251.3 502.6"
              strokeLinecap="round"
            />
            {/* Threshold marker (140%) */}
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke={color}
              strokeWidth="20"
              fill="transparent"
              strokeDasharray={`${(normalizedVal / maxScale) * 251.3} 502.6`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Needle / Value */}
          <div className="absolute bottom-0 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}%
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                isCritical
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : isWarning
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Labels below */}
        <div className="w-56 flex justify-between text-[11px] text-slate-400 font-mono mt-2">
          <span>0%</span>
          <span className="text-amber-600 font-semibold">100%</span>
          <span className="text-rose-600 font-semibold">140% (Batas)</span>
          <span>250%</span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Kepatuhan Obat: 90 Hari dalam 22 Hari</span>
        <span className="text-rose-600 font-semibold">Over-Supply 190%</span>
      </div>
    </div>
  );
};
