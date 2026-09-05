import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import type { HealthStatus } from '@healthathon/shared';

interface LandingPageProps {
  userEmail: string | null;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ userEmail, onOpenAuth }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<HealthStatus>('/health')
      .then((res) => setHealth(res))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:py-28 text-center space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold font-mono text-emerald-700 dark:text-emerald-400 mb-2">
          INTEGRATED FRAUD EARLY-WARNING &amp; RISK ANALYTICS
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-slate-100">
          INFERA
        </h1>
        <p className="text-sm text-neutral-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Platform AI Kognitif Pengawasan Integritas Klaim &amp; Deteksi Dini Kecurangan Layanan Jaminan Kesehatan Nasional BPJS Kesehatan.
        </p>
      </div>

      <div className="flex justify-center items-center gap-3">
        {!userEmail ? (
          <button
            onClick={onOpenAuth}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition"
          >
            Masuk / Buat Akun
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition"
            >
              Buka Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Status Bar Sederhana (Monochrome) */}
      <div className="pt-8 border-t border-neutral-200 max-w-md mx-auto text-xs text-neutral-500 flex justify-between items-center">
        <span>Backend API: {loading ? 'Memeriksa...' : health ? 'Online' : 'Offline'}</span>
        <span>•</span>
        <span>Auth Engine: Supabase</span>
        <span>•</span>
        <span>OAuth: Google</span>
      </div>
    </div>
  );
};
