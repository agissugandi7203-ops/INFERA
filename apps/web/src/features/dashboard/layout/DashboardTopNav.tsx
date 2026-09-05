import React from 'react';
import { useLocation } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';

interface DashboardTopNavProps {
  onToggleSettings: () => void;
  selectedVoiceId?: string;
  onOpenVoiceModal?: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Ringkasan Eksekutif', category: 'Pengawasan' },
  '/dashboard/ai-report': { title: 'Laporan Audit Forensik', category: 'Audit' },
  '/dashboard/transactions': { title: 'Aliran Transaksi Klaim', category: 'Data Transaksi' },
  '/dashboard/cases': { title: 'Studi Kasus Pembuktian', category: 'Benchmark' },
  '/dashboard/identity-risk': { title: 'Identitas & Impossible Travel', category: 'Modus 1-2' },
  '/dashboard/unnecessary-services': { title: 'Doctor Shopping (DSI)', category: 'Modus 3' },
  '/dashboard/pharmacy-alkes': { title: 'Resep PRB & Alkes', category: 'Modus 4' },
  '/dashboard/regulations': { title: 'Regulasi Anti-Fraud', category: 'Dasar Hukum' },
  '/dashboard/master-data': { title: 'Master Data & Tindakan', category: 'Penegakan' },
};

export const DashboardTopNav: React.FC<DashboardTopNavProps> = ({
  onToggleSettings,
}) => {
  const location = useLocation();
  const currentRouteInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Portal Analisis Risiko',
    category: 'Pengawasan',
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Clean Enterprise Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-bold tracking-tight">INFERA</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-500 dark:text-slate-400 font-medium">{currentRouteInfo.category}</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-bold text-slate-900 dark:text-slate-100">{currentRouteInfo.title}</span>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2.5">
        {/* Settings Button */}
        <button
          onClick={onToggleSettings}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Pengaturan"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
