import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  FolderKanban,
  MapPin,
  Stethoscope,
  Pill,
  BookOpen,
  LogOut,
  ChevronLeft,
  Play,
  Pause,
  UserCog,
  Sun,
  Moon,
  ArrowUpRight,
} from 'lucide-react';
import { useSimulationStream } from '../simulation/SimulationContext';
import { useTheme } from '../../../context/ThemeContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
  onOpenAvatarChat?: () => void;
  onNavigate?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'active' | 'alert' | 'neutral' | 'accent';
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  userEmail = 'dr.arief@bpjs-kesehatan.go.id',
  onLogout,
  onOpenAvatarChat,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { claims, isPaused, togglePause, intervalSec, anomalies } = useSimulationStream();

  const mainNav: NavItem[] = [
    { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    {
      to: '/dashboard/ai-report',
      label: 'Chat AI',
      icon: Sparkles,
      badge: anomalies.length > 0 ? `${anomalies.length}` : 'Live',
      badgeType: anomalies.length > 0 ? 'alert' : 'accent',
    },
    {
      to: '/dashboard/transactions',
      label: 'Aliran Transaksi',
      icon: Activity,
      badge: `${claims.length}`,
      badgeType: 'neutral',
    },
    {
      to: '/dashboard/cases',
      label: 'Studi Kasus',
      icon: FolderKanban,
      badge: '4',
      badgeType: 'neutral',
    },
  ];

  const modusNav: NavItem[] = [
    {
      to: '/dashboard/identity-risk',
      label: 'Identitas & Travel',
      icon: MapPin,
      badge: 'M1-2',
      badgeType: 'neutral',
    },
    {
      to: '/dashboard/unnecessary-services',
      label: 'Doctor Shopping',
      icon: Stethoscope,
      badge: 'M3',
      badgeType: 'neutral',
    },
    {
      to: '/dashboard/pharmacy-alkes',
      label: 'Resep & Alkes',
      icon: Pill,
      badge: 'M4',
      badgeType: 'neutral',
    },
  ];

  const governanceNav: NavItem[] = [
    {
      to: '/dashboard/regulations',
      label: 'Regulasi JKN',
      icon: BookOpen,
    },
    {
      to: '/dashboard/master-data',
      label: 'Master Data',
      icon: UserCog,
    },
  ];

  const renderBadge = (item: NavItem, isActive: boolean) => {
    if (!item.badge || isCollapsed) return null;

    if (isActive) {
      return (
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#131418]/15 text-[#131418]">
          {item.badge}
        </span>
      );
    }

    if (item.badgeType === 'alert') {
      return (
        <span className="ml-auto text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#ff5733] text-white shadow-xs">
          {item.badge}
        </span>
      );
    }

    if (item.badgeType === 'accent') {
      return (
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d4f866]/20 text-[#d4f866] border border-[#d4f866]/30">
          {item.badge}
        </span>
      );
    }

    return (
      <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
        {item.badge}
      </span>
    );
  };

  const renderNavList = (items: NavItem[]) => (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          onClick={onNavigate}
          title={isCollapsed ? item.label : undefined}
          className={({ isActive }) =>
            `group flex items-center rounded-2xl text-[13.5px] transition-all duration-150 select-none ${
              isCollapsed
                ? 'justify-center w-12 h-12 mx-auto p-0'
                : 'gap-3 px-3.5 py-2.5 w-full'
            } ${
              isActive
                ? 'bg-[#d4f866] text-[#131418] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.08] font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                  isActive
                    ? 'text-[#131418]'
                    : 'text-slate-400 group-hover:text-white'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {renderBadge(item, isActive)}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <aside
      className={`relative flex flex-col bg-[#131418] text-white rounded-[28px] border border-white/[0.08] shadow-2xl transition-all duration-300 z-30 shrink-0 select-none h-full overflow-hidden ${
        isCollapsed ? 'w-[82px]' : 'w-[268px]'
      }`}
    >
      {/* Brand Header with crystal-clear Logo on solid white squircle */}
      <div
        className={`h-16 flex items-center border-b border-white/[0.08] shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'overflow-hidden'}`}>
          <button
            type="button"
            onClick={isCollapsed ? onToggleCollapse : undefined}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCollapsed ? 'hover:scale-105 hover:bg-white/[0.05] cursor-pointer' : ''
            }`}
            title={isCollapsed ? 'Buka Sidebar' : 'INFERA JKN'}
          >
            <img
              src="/logo-dark.png"
              alt="INFERA Logo"
              className="w-7 h-7 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
            />
          </button>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span
                className="font-extrabold text-white text-[16px] tracking-tight leading-none truncate"
                style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif' }}
              >
                INFERA
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide truncate mt-1">
                Fraud &amp; Risk Agent
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            title="Kecilkan Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections (Clean, uncluttered, Eduplex style) */}
      <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-3 custom-scrollbar">
        {renderNavList(mainNav)}

        <div className="pt-2 border-t border-white/[0.07]">
          {!isCollapsed && (
            <p className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Modus Investigasi
            </p>
          )}
          {renderNavList(modusNav)}
        </div>

        <div className="pt-2 border-t border-white/[0.07]">
          {!isCollapsed && (
            <p className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tata Kelola
            </p>
          )}
          {renderNavList(governanceNav)}
        </div>
      </div>

      {/* Eduplex Signature Bottom Card (Vibrant Lime with Arrow Button & Wavy Graphic) */}
      {!isCollapsed ? (
        <div className="mx-3 mb-3 p-4 rounded-[24px] bg-[#d4f866] text-[#131418] relative overflow-hidden shadow-lg shadow-[#d4f866]/10">
          {/* Abstract wavy lines background */}
          <svg
            className="absolute -right-3 -bottom-3 w-28 h-28 opacity-25 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
            stroke="#131418"
            strokeWidth="4"
            strokeLinecap="round"
          >
            <path d="M 0 35 C 30 15, 70 55, 100 35" />
            <path d="M 0 55 C 30 35, 70 75, 100 55" />
            <path d="M 0 75 C 30 55, 70 95, 100 75" />
          </svg>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131418]/10 text-[#131418] text-[10px] font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPaused ? 'bg-slate-500' : 'bg-[#131418]'
                }`}
              />
              <span>{isPaused ? 'Stream Terjeda' : 'Stream Aktif'}</span>
            </div>
            <button
              onClick={() => {
                if (onOpenAvatarChat) {
                  onOpenAvatarChat();
                } else {
                  navigate('/dashboard/ai-report');
                }
              }}
              className="w-8 h-8 rounded-full bg-[#131418] text-white hover:scale-110 active:scale-95 transition-transform flex items-center justify-center font-bold text-xs shadow-md shrink-0 cursor-pointer"
              title="Buka Chat AI"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 relative z-10">
            <div
              className="font-extrabold text-[14px] leading-tight text-[#131418]"
              style={{ fontFamily: '"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif' }}
            >
              Proteksi JKN AI
            </div>
            <p className="text-[11px] text-[#131418]/85 mt-1 font-medium leading-snug">
              {claims.length} klaim diuji real-time ({intervalSec}s stream)
            </p>
          </div>

          {/* Quick Pause / Play Button */}
          <div className="mt-3 pt-2.5 border-t border-[#131418]/15 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[#131418]/80 text-[10px]">Kontrol Stream</span>
            <button
              onClick={togglePause}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#131418] text-white hover:bg-[#202127] transition-colors cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3 h-3" /> Lanjutkan
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" /> Jeda
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 mb-3 px-2">
          <button
            onClick={() => {
              if (onOpenAvatarChat) onOpenAvatarChat();
              else navigate('/dashboard/ai-report');
            }}
            className="w-11 h-11 rounded-2xl bg-[#d4f866] text-[#131418] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center font-bold shadow-md cursor-pointer"
            title="Buka Chat AI"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* User Profile & Actions Footer (Clean & minimal, no blue AR circle) */}
      <div className="px-3.5 py-3 border-t border-white/[0.08] bg-[#0e0f13]">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-white truncate">
                {userEmail?.split('@')[0] || 'dr.arief'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                Verifikator JKN
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
