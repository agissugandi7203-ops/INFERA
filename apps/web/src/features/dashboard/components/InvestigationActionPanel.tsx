import React from 'react';
import { ActionRecommendation } from '@healthathon/shared';
import {
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Lock,
  Layers,
} from 'lucide-react';

interface InvestigationActionPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  recommendations: ActionRecommendation[];
  onExecuteRecommendation: (rec: ActionRecommendation) => void;
  onConfirmRecommendation: (rec: ActionRecommendation) => void;
  className?: string;
}

export const InvestigationActionPanel: React.FC<InvestigationActionPanelProps> = ({
  isOpen,
  onToggle,
  recommendations,
  onExecuteRecommendation,
  onConfirmRecommendation,
  className = '',
}) => {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div
      className={`border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/80 backdrop-blur-md flex flex-col transition-all duration-300 ease-in-out shrink-0 z-10 ${
        isOpen ? 'w-80' : 'w-10'
      } ${className}`}
    >
      {/* Panel Toggle Header */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2.5">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Action Center
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                {recommendations.length} Rekomendasi
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors mx-auto cursor-pointer"
          title={isOpen ? 'Sembunyikan Panel' : 'Buka Action Center'}
        >
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Status Investigasi Aktif
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-snug">
              AI telah memverifikasi bukti anomali melalui tools analitik dan RAG hukum JKN.
            </p>
          </div>

          <div className="space-y-2.5">
            {recommendations.map((rec) => {
              const isCritical = rec.riskLevel === 'CRITICAL';
              return (
                <div
                  key={rec.id}
                  className="rounded-xl p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isCritical
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {rec.riskLevel}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {rec.riskScore}/100
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {rec.title}
                  </h5>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {rec.reason}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      rec.requiresConfirmation
                        ? onConfirmRecommendation(rec)
                        : onExecuteRecommendation(rec)
                    }
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      rec.requiresConfirmation
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                    }`}
                  >
                    {rec.requiresConfirmation ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    <span>{rec.actionLabel}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center pt-4 space-y-3 select-none">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[9px] font-bold font-mono rotate-90 tracking-widest text-slate-400 uppercase mt-6 whitespace-nowrap">
            ACTIONS ({recommendations.length})
          </span>
        </div>
      )}
    </div>
  );
};
