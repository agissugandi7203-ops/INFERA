import React, { useState } from 'react';
import { ToolProgressStep } from '@healthathon/shared';
import { Loader2, CheckCircle2, AlertCircle, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

interface ToolStatusBadgeProps {
  steps: ToolProgressStep[];
  className?: string;
}

export const ToolStatusBadge: React.FC<ToolStatusBadgeProps> = ({ steps, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  const isAnyRunning = steps.some((s) => s.status === 'running');
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const isAllCompleted = completedCount === steps.length;
  const hasFailed = steps.some((s) => s.status === 'failed');

  return (
    <div className={`my-2 transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
            : 'bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
        }`}
        title="Klik untuk melihat langkah investigasi forensik"
      >
        {isAnyRunning ? (
          <Loader2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 animate-spin shrink-0" />
        ) : hasFailed ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        ) : (
          <Wrench className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
        )}
        <span className="font-semibold">Langkah Investigasi</span>
        {isAnyRunning ? (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono animate-pulse">
            (Sedang memproses...)
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            ({completedCount}/{steps.length} alat selesai)
          </span>
        )}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-0.5">
          {isOpen ? 'Tutup' : 'Lihat'}
        </span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 animate-in fade-in duration-150">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pb-1.5 mb-1.5 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span>Rincian Eksekusi Tool Forensik</span>
            <span className="font-mono text-[10px]">
              {isAllCompleted ? 'Selesai Terverifikasi' : 'Sedang Berjalan'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
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
                      <Loader2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 animate-spin" />
                    ) : isFailed ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className={`font-medium ${
                        isRunning
                          ? 'text-slate-700 dark:text-slate-200'
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
      )}
    </div>
  );
};
