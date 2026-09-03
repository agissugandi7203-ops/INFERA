import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardEmptyState } from './DashboardEmptyState';

interface DashboardPageProps {
  userEmail: string | null;
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ userEmail, onLogout }) => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <DashboardHeader userEmail={userEmail} onLogout={onLogout} />

      <main className="flex-1 mx-auto max-w-5xl w-full p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Selamat datang di area dashboard pengguna.
          </p>
        </div>

        <DashboardEmptyState />
      </main>
    </div>
  );
};

export default DashboardPage;
