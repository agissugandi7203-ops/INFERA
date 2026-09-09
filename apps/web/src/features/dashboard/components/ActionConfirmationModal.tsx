import React, { useState } from 'react';
import { ActionRecommendation } from '@healthathon/shared';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle,
  Scale,
} from 'lucide-react';

interface ActionConfirmationModalProps {
  isOpen: boolean;
  recommendation: ActionRecommendation | null;
  onClose: () => void;
  onConfirm: (rec: ActionRecommendation, auditorNotes: string) => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  recommendation,
  onClose,
  onConfirm,
}) => {
  const [auditorNotes, setAuditorNotes] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !recommendation) return null;

  const isSuspension = recommendation.actionType === 'PROPOSE_SUSPENSION';

  const handleExecute = () => {
    if (!isAgreed) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm(recommendation, auditorNotes);
      setIsSubmitting(false);
      setAuditorNotes('');
      setIsAgreed(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isSuspension
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/60'
              : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isSuspension ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              {isSuspension ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Otorisasi Tindakan Administratif (Level 3)
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {recommendation.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Info */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Target Peserta/ID</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {recommendation.targetName || recommendation.targetId}
              </p>
              <p className="font-mono text-[10px] text-slate-500">{recommendation.targetId}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Skor &amp; Tingkat Risiko</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                <span className={isSuspension ? 'text-rose-600' : 'text-amber-600'}>
                  {recommendation.riskScore} / 100
                </span>{' '}
                ({recommendation.riskLevel})
              </p>
            </div>
          </div>

          {/* Substantive Reason */}
          <div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Uraian Bukti &amp; Dasar Temuan:
            </span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {recommendation.reason}
            </div>
          </div>

          {/* Legal Basis */}
          {recommendation.legalBasis && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
              <Scale className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[11px] font-medium">
                Dasar Hukum: {recommendation.legalBasis}
              </span>
            </div>
          )}

          {/* Auditor Notes Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Catatan Berita Acara Pemeriksaan (BAP Auditor):
            </label>
            <textarea
              rows={2}
              value={auditorNotes}
              onChange={(e) => setAuditorNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus rekomendasi penanganan sebelum dieksekusi..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
              Saya selaku auditor memverifikasi bahwa bukti anomali telah diteliti secara seksama dan tindakan ini diajukan sesuai dengan ketentuan tata kelola Program JKN.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!isAgreed || isSubmitting}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              !isAgreed || isSubmitting
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : isSuspension
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi & Catat ke Log Audit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
