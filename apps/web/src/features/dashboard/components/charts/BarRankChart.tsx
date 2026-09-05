import React from 'react';

export interface BarRankItem {
  label: string;
  count: number;
  secondaryText?: string;
  badge?: string;
}

interface BarRankChartProps {
  title: string;
  subtitle?: string;
  items: BarRankItem[];
  barColorClass?: string;
}

export const BarRankChart: React.FC<BarRankChartProps> = ({
  title,
  subtitle,
  items,
  barColorClass = 'bg-emerald-500',
}) => {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-3.5 my-4">
        {items.map((item, idx) => {
          const percent = Math.round((item.count / maxCount) * 100);
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-800">{item.label}</span>
                  {item.secondaryText && (
                    <span className="text-[11px] text-slate-400">({item.secondaryText})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{item.count.toLocaleString('id-ID')}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColorClass} transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Fokus Patroli Cabang Utama</span>
        <span className="text-slate-400 font-mono">DJS Risk Map 2026</span>
      </div>
    </div>
  );
};
