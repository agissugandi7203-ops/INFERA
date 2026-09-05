import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  changeText?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
  badgeText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  changeText,
  isPositive = true,
  icon: Icon,
  iconColorClass = 'text-emerald-600',
  iconBgClass = 'bg-emerald-50',
  badgeText,
}) => {
  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_-4px_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
      {/* Subtle 3D Top Specular Line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase font-sans">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight tabular-nums">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBgClass} ${iconColorClass} flex items-center justify-center shrink-0 shadow-xs ring-1 ring-black/5 group-hover:scale-105 group-hover:shadow-md transition-all duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {changeText ? (
          <div className="flex items-center gap-1.5 font-medium">
            {isPositive ? (
              <span className="flex items-center text-emerald-600 font-semibold gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {changeText}
              </span>
            ) : (
              <span className="flex items-center text-rose-600 font-semibold gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {changeText}
              </span>
            )}
            <span className="text-slate-400 font-normal">{subtitle || 'vs bulan lalu'}</span>
          </div>
        ) : (
          <span className="text-slate-500 font-medium">{subtitle}</span>
        )}

        {badgeText && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

