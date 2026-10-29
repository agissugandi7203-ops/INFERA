import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Scale, Loader2 } from 'lucide-react';
import type { ActionProposal } from '@healthathon/shared';

interface ActionApprovalCardProps {
  proposal: ActionProposal;
  onApprove: (approvalRequestId: string, notes?: string) => Promise<void> | void;
  onReject: (approvalRequestId: string, notes?: string) => Promise<void> | void;
}

export const ActionApprovalCard: React.FC<ActionApprovalCardProps> = ({
  proposal,
  onApprove,
  onReject,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const isCritical = proposal.severity === 'CRITICAL';

  const handleApproveClick = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(proposal.approvalRequestId);
      setDecision('APPROVED');
      setTicketId(`BPJS-ACT-${Date.now().toString(36).toUpperCase()}`);
    } catch (err) {
      console.error('[ActionApprovalCard] Approval error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = async () => {
    setIsSubmitting(true);
    try {
      await onReject(proposal.approvalRequestId, 'Dibatalkan oleh auditor via dashboard');
      setDecision('REJECTED');
    } catch (err) {
      console.error('[ActionApprovalCard] Rejection error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (decision === 'APPROVED') {
    return (
      <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 backdrop-blur-md shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Tindakan Berhasil Disetujui</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Tindakan <strong>{proposal.toolName}</strong> terhadap {proposal.targetName || proposal.targetId} telah dicatat dalam sistem investigasi BPJS Kesehatan.
        </p>
        {ticketId && (
          <div className="mt-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/20 inline-block">
            Tiket Eksekusi: {ticketId}
          </div>
        )}
      </div>
    );
  }

  if (decision === 'REJECTED') {
    return (
      <div className="p-4 rounded-2xl border border-slate-700 bg-slate-900/60 backdrop-blur-md text-left opacity-75">
        <div className="flex items-center gap-2.5 text-slate-400 font-bold text-sm mb-1">
          <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span>Rekomendasi Tindakan Ditolak</span>
        </div>
        <p className="text-xs text-slate-400">
          Auditor memutuskan untuk membatalkan tindakan rekomendasi {proposal.toolName}.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all text-left ${
        isCritical
          ? 'border-rose-500/40 bg-rose-950/25 shadow-rose-950/30'
          : 'border-amber-500/40 bg-amber-950/25 shadow-amber-950/30'
      }`}
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {proposal.toolName.replace(/_/g, ' ')}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
            isCritical ? 'bg-rose-500/30 text-rose-200' : 'bg-amber-500/30 text-amber-200'
          }`}
        >
          {proposal.severity}
        </span>
      </div>

      {/* Target & Reason */}
      <div className="space-y-1.5 mb-3">
        <div className="text-xs text-slate-200">
          <span className="text-slate-400">Target:</span>{' '}
          <strong>{proposal.targetName || 'Peserta JKN'}</strong>{' '}
          <span className="font-mono text-slate-400 text-[11px]">({proposal.targetId})</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="text-slate-400 font-medium">Uraian Bukti:</span> {proposal.reason}
        </p>
      </div>

      {/* Legal Basis */}
      {proposal.legalBasis && (
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-black/30 border border-white/5 mb-3.5 text-[11px] text-slate-300">
          <Scale className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <span className="leading-tight">
            <strong>Dasar Hukum:</strong> {proposal.legalBasis}
          </span>
        </div>
      )}

      {/* Estimated Loss if available */}
      {proposal.estimatedLoss && proposal.estimatedLoss > 0 && (
        <div className="mb-3 text-[11px] text-slate-300">
          <span className="text-slate-400">Potensi Kerugian DJS:</span>{' '}
          <span className="font-bold text-rose-300">
            Rp {proposal.estimatedLoss.toLocaleString('id-ID')}
          </span>
        </div>
      )}

      {/* Action Buttons (Human-in-the-Loop) */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/10">
        <button
          type="button"
          onClick={handleApproveClick}
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>Setujui Tindakan</span>
        </button>

        <button
          type="button"
          onClick={handleRejectClick}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white active:scale-95 disabled:opacity-50 transition-all border border-slate-700 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Tolak</span>
        </button>
      </div>
    </div>
  );
};
