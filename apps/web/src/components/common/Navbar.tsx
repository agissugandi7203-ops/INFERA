import React from 'react';

interface NavbarProps {
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userEmail, onOpenAuth, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="font-extrabold text-neutral-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-2.5">
          <img src="/infera-logo.png" alt="INFERA Logo" className="w-7 h-7 object-contain rounded-md" />
          <span>INFERA</span>
          <span className="text-[10px] font-normal text-slate-400 border-l border-slate-300 pl-2">BPJS Kesehatan</span>
        </div>

        {/* CTA Atas */}
        <div className="flex items-center space-x-3">
          {userEmail ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-neutral-600 truncate max-w-[180px] sm:max-w-none">
                {userEmail}
              </span>
              <button
                onClick={onLogout}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-sm"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
