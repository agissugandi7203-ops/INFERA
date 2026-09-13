import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Volume2, ChevronDown, Check } from 'lucide-react';
import { VOICE_DEFAULT_ID, VOICE_SECONDARY_ID } from '../services/tts-processor';

interface DashboardTopNavProps {
  onToggleSettings?: () => void;
  selectedVoiceId?: string;
  onSelectVoice?: (voiceId: string) => void;
  onToggleMobileSidebar?: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Ringkasan Eksekutif', category: 'Pengawasan' },
  '/dashboard/ai-report': { title: 'Chat AI Asisten JKN', category: 'Kecerdasan Buatan' },
  '/dashboard/transactions': { title: 'Aliran Transaksi Klaim', category: 'Data Transaksi' },
  '/dashboard/cases': { title: 'Studi Kasus Pembuktian', category: 'Benchmark' },
  '/dashboard/identity-risk': { title: 'Identitas & Impossible Travel', category: 'Modus 1-2' },
  '/dashboard/unnecessary-services': { title: 'Doctor Shopping (DSI)', category: 'Modus 3' },
  '/dashboard/pharmacy-alkes': { title: 'Resep PRB & Alkes', category: 'Modus 4' },
  '/dashboard/regulations': { title: 'Regulasi Anti-Fraud', category: 'Dasar Hukum' },
  '/dashboard/master-data': { title: 'Master Data & Tindakan', category: 'Penegakan' },
};

export const DashboardTopNav: React.FC<DashboardTopNavProps> = ({
  selectedVoiceId = VOICE_DEFAULT_ID,
  onSelectVoice,
  onToggleMobileSidebar,
}) => {
  const location = useLocation();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);

  const currentRouteInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Portal Analisis Risiko',
    category: 'Pengawasan',
  };

  const isLuna = selectedVoiceId === VOICE_SECONDARY_ID;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(e.target as Node)) {
        setIsVoiceOpen(false);
      }
    };
    if (isVoiceOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVoiceOpen]);

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left: Mobile Hamburger & Clean Responsive Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Menu Navigasi"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs truncate">
          <span className="text-slate-400 dark:text-slate-500 font-bold tracking-tight">INFERA</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">{currentRouteInfo.category}</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{currentRouteInfo.title}</span>
        </div>
      </div>

      {/* Right: Quick Voice Switcher & Settings */}
      <div className="flex items-center gap-2">
        {/* Quick Voice Switcher Pill (Touch & Mobile Friendly) */}
        <div className="relative" ref={voiceDropdownRef}>
          <button
            type="button"
            onClick={() => setIsVoiceOpen(!isVoiceOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Ganti Suara AI Asisten"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden xs:inline">Suara:</span>
            <span className="text-emerald-700 dark:text-emerald-400">{isLuna ? 'Luna' : 'Vera'}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isVoiceOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Voice Dropdown Menu */}
          {isVoiceOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Suara Asisten
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectVoice?.(VOICE_DEFAULT_ID);
                  setIsVoiceOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                  !isLuna
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-semibold">Vera (Default)</div>
                  <div className="text-[10px] text-slate-400">Jernih &amp; natural</div>
                </div>
                {!isLuna && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectVoice?.(VOICE_SECONDARY_ID);
                  setIsVoiceOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                  isLuna
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-semibold">Luna</div>
                  <div className="text-[10px] text-slate-400">Lebih lembut</div>
                </div>
                {isLuna && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
