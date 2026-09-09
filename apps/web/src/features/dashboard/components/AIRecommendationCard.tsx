import React from 'react';
import { ActionRecommendation, InvestigationRiskLevel } from '@healthathon/shared';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Scale,
  ExternalLink,
  ArrowRight,
  FileCheck2,
  Lock,
} from 'lucide-react';

interface AIRecommendationCardProps {
  recommendation: ActionRecommendation;
  onExecuteAction: (rec: ActionRecommendation) => void;
  onConfirmAction?: (rec: ActionRecommendation) => void;
  className?: string;
}

const RISK_THEMES: Record<
  InvestigationRiskLevel,
  {
    badge: string;
    border: string;
    bg: string;
    text: string;
    label: string;
    icon: React.ReactNode;
  }
> = {
  CRITICAL: {
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    border: 'border-rose-200 dark:border-rose-800/80',
    bg: 'bg-rose-50/50 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-400',
    label: 'RISIKO KRITIS',
    icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
  },
  HIGH: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    border: 'border-amber-200 dark:border-amber-800/80',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'RISIKO TINGGI',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  },
  MEDIUM: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    border: 'border-blue-200 dark:border-blue-800/80',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'RISIKO SEDANG',
    icon: <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
  },
  LOW: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'RISIKO RENDAH (WAJAR)',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  },
};

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  recommendation,
  onExecuteAction,
  onConfirmAction,
  className = '',
}) => {
  const theme = RISK_THEMES[recommendation.riskLevel] || RISK_THEMES.HIGH;

  const handleActionClick = () => {
    if (recommendation.requiresConfirmation) {
      if (onConfirmAction) {
        onConfirmAction(recommendation);
      } else {
        onExecuteAction(recommendation);
      }
    } else {
      onExecuteAction(recommendation);
    }
  };

  return (
    <div
      className={`my-3 rounded-2xl border ${theme.border} ${theme.bg} p-4 shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
    >
      {/* Top Header: Badge & Score */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-white dark:bg-slate-900 shadow-2xs">
            {theme.icon}
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${theme.badge}`}
            >
              {theme.label}
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
              {recommendation.title}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Skor Risiko</div>
          <div className="text-base font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
            <span className={theme.text}>{recommendation.riskScore}</span>
            <span className="text-slate-400 text-xs font-normal"> / 100</span>
          </div>
        </div>
      </div>

      {/* Description & Findings */}
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3 font-sans">
        {recommendation.description}
      </p>

      {/* Sinyal Anomali Terdeteksi */}
      {recommendation.signals && recommendation.signals.length > 0 && (
        <div className="space-y-1.5 mb-3 bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 border border-slate-200/50 dark:border-slate-800/60 text-xs">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Bukti Sinyal Anomali Terverifikasi:</span>
          </div>
          {recommendation.signals.map((sig, sIdx) => (
            <div key={sIdx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
              <span className="text-rose-500 font-bold">•</span>
              <div className="flex-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{sig.label}:</span>{' '}
                <span>{sig.description}</span>
                {sig.evidence && (
                  <span className="block font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {sig.evidence}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rujukan Regulasi Hukum (Grounding) */}
      {recommendation.legalBasis && (
        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-3.5 px-2 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
          <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-800 dark:text-slate-200">Dasar Hukum:</strong>{' '}
            {recommendation.legalBasis}
          </span>
        </div>
      )}

      {/* Two-Phase Action Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
          {recommendation.requiresConfirmation ? (
            <>
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Memerlukan otorisasi manusia</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-3 h-3 text-emerald-500" />
              <span>Pintasan modul investigasi</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleActionClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer active:scale-95 ${
            recommendation.requiresConfirmation
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <span>{recommendation.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
