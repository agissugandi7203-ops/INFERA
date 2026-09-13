import React from 'react';
import { NavLink } from 'react-router-dom';
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
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  userEmail = 'dr.arief@bpjs-kesehatan.go.id',
  onLogout,
  onNavigate,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { claims, isPaused, togglePause, intervalSec, anomalies } = useSimulationStream();

  const mainNav: NavItem[] = [
    { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    {
      to: '/dashboard/ai-report',
      label: 'Chat AI',
      icon: Sparkles,
      badge: `${anomalies.length > 0 ? anomalies.length : 'Live'}`,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-semibold',
    },
    {
      to: '/dashboard/transactions',
      label: 'Aliran Transaksi',
      icon: Activity,
      badge: `${claims.length}`,
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium',
    },
    {
      to: '/dashboard/cases',
      label: 'Studi Kasus',
      icon: FolderKanban,
      badge: '4',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium',
    },
  ];

  const modusNav: NavItem[] = [
    {
      to: '/dashboard/identity-risk',
      label: 'Identitas & Travel',
      icon: MapPin,
      badge: 'M1-2',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    },
    {
      to: '/dashboard/unnecessary-services',
      label: 'Doctor Shopping',
      icon: Stethoscope,
      badge: 'M3',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    },
    {
      to: '/dashboard/pharmacy-alkes',
      label: 'Resep & Alkes',
      icon: Pill,
      badge: 'M4',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    },
  ];

  const knowledgeNav: NavItem[] = [
    {
      to: '/dashboard/regulations',
      label: 'Regulasi JKN',
      icon: BookOpen,
    },
  ];

  const actionNav: NavItem[] = [
    {
      to: '/dashboard/master-data',
      label: 'Master Data',
      icon: UserCog,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all duration-200 z-30 shrink-0 select-none shadow-sm h-full ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center border-b border-slate-100 dark:border-slate-800 shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
        }`}
      >
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'overflow-hidden'}`}>
          <button
            type="button"
            onClick={isCollapsed ? onToggleCollapse : undefined}
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
              isCollapsed ? 'hover:scale-105 cursor-pointer shadow-xs' : ''
            }`}
            title={isCollapsed ? 'Klik untuk membuka sidebar' : 'INFERA'}
          >
            <img
              src="/infera-logo.png"
              alt="INFERA Logo"
              className="w-8 h-8 rounded-lg object-contain shrink-0 drop-shadow-sm"
            />
          </button>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight truncate">
                INFERA
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">Fraud &amp; Risk Analysis Agent</span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center shrink-0"
            title="Perkecil sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stream Status Widget (Quiet, No Blinking) */}
      {!isCollapsed && (
        <div className="mx-3 mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isPaused ? 'bg-slate-300 dark:bg-slate-600' : 'bg-[#007a3d]'
              }`}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                {isPaused ? 'Stream Terjeda' : 'Stream Aktif'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {claims.length} klaim ({intervalSec}s)
              </span>
            </div>
          </div>

          <button
            onClick={togglePause}
            className={`p-1 rounded-md border text-xs transition-colors flex items-center justify-center shrink-0 ${
              isPaused
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isPaused ? 'Lanjutkan' : 'Jeda'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
        {/* Section 1: Utama */}
        <div>
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Navigasi
            </p>
          )}
          <nav className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-colors group ${
                    isActive
                      ? 'bg-slate-900 dark:bg-emerald-600/90 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isActive
                            ? 'bg-slate-800 dark:bg-emerald-700 text-slate-200 dark:text-white font-bold'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Section 2: Modus Risiko */}
        <div>
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Modus Risiko
            </p>
          )}
          <nav className="space-y-0.5">
            {modusNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-colors group ${
                    isActive
                      ? 'bg-slate-900 dark:bg-emerald-600/90 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isActive
                            ? 'bg-slate-800 dark:bg-emerald-700 text-slate-200 dark:text-white font-bold'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Section 3: Regulasi */}
        <div>
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Referensi
            </p>
          )}
          <nav className="space-y-0.5">
            {knowledgeNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-colors group ${
                    isActive
                      ? 'bg-slate-900 dark:bg-emerald-600/90 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Section 4: Aksi & Master Data */}
        <div>
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Tindakan
            </p>
          )}
          <nav className="space-y-0.5">
            {actionNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-colors group ${
                    isActive
                      ? 'bg-slate-900 dark:bg-emerald-600/90 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Theme Switcher above User Profile */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-full flex items-center rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            isCollapsed
              ? 'justify-center p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'gap-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90'
          }`}
          title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          )}
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {isDark ? 'DARK' : 'LIGHT'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* User Profile Footer */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600"
              title={userEmail || 'Verifikator BPJS'}
            >
              {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'BP'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {userEmail?.split('@')[0] || 'dr.arief'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  Verifikator JKN
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && onLogout && (
            <button
              onClick={onLogout}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
