import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Volume2, ChevronDown, Check, Search } from 'lucide-react';
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
  const navigate = useNavigate();
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
    <header className="h-16 bg-white/80 dark:bg-[#131418]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between z-20 shrink-0">
      {/* Left: Mobile Hamburger & Clean Responsive Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Menu Navigasi"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/50 dark:border-white/[0.07] text-xs truncate">
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">INFERA</span>
          <span className="text-slate-400 dark:text-slate-600 text-[10px]">/</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">{currentRouteInfo.category}</span>
          <span className="text-slate-400 dark:text-slate-600 text-[10px] hidden sm:inline">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{currentRouteInfo.title}</span>
        </div>
      </div>

      {/* Center: Search courses/claims Bar (Eduplex style) */}
      <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs text-slate-500 w-64 lg:w-80">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Cari SEP, faskes, diagnosa..."
          className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 w-full"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate('/dashboard/transactions');
            }
          }}
        />
        <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-400">⌘K</kbd>
      </div>

      {/* Right: Quick Voice Switcher & Settings */}
      <div className="flex items-center gap-2">
        {/* Quick Voice Switcher Pill (Touch & Mobile Friendly) */}
        <div className="relative" ref={voiceDropdownRef}>
          <button
            type="button"
            onClick={() => setIsVoiceOpen(!isVoiceOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Ganti Suara AI Asisten"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="hidden xs:inline">Suara:</span>
            <span className="text-slate-900 dark:text-white font-bold">{isLuna ? 'Luna' : 'Fera'}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isVoiceOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Voice Dropdown Menu */}
          {isVoiceOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-white/10 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Suara Asisten
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectVoice?.(VOICE_DEFAULT_ID);
                  setIsVoiceOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  !isLuna
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="font-semibold">Fera (Default)</div>
                  <div className="text-[10px] text-slate-400">Jernih &amp; natural</div>
                </div>
                {!isLuna && <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectVoice?.(VOICE_SECONDARY_ID);
                  setIsVoiceOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  isLuna
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="font-semibold">Luna</div>
                  <div className="text-[10px] text-slate-400">Lebih lembut</div>
                </div>
                {isLuna && <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
