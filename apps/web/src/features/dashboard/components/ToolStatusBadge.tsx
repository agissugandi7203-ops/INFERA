import React from 'react';
import { ToolProgressStep } from '@healthathon/shared';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToolStatusBadgeProps {
  steps: ToolProgressStep[];
  className?: string;
}

export const ToolStatusBadge: React.FC<ToolStatusBadgeProps> = ({ steps, className = '' }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={`space-y-1.5 my-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Tahapan Analisis &amp; Audit Data:</span>
      </div>

      <div className="flex flex-col gap-1.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2.5">
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          const isFailed = step.status === 'failed';

          return (
            <div
              key={step.id + step.status}
              className="flex items-start gap-2 text-xs transition-all duration-200"
            >
              <div className="mt-0.5 shrink-0">
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                ) : isFailed ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`font-medium ${
                    isRunning
                      ? 'text-slate-700 dark:text-slate-200 animate-pulse'
                      : isFailed
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {step.label}
                </span>

                {step.detail && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
