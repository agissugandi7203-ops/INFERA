import React from 'react';

interface DashboardHeaderProps {
  userEmail: string | null;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userEmail, onLogout }) => {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-sm text-neutral-900">INFERA</span>
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            Dashboard
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-neutral-500 truncate max-w-[180px] sm:max-w-none">
            {userEmail}
          </span>
          <button
            onClick={onLogout}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
};
