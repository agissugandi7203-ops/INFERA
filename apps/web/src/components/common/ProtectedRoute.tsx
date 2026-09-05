import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  userEmail: string | null;
  isLoading?: boolean;
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ userEmail, isLoading, children }) => {
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-100" />
          <span className="text-xs text-slate-400 font-mono">Memverifikasi sesi...</span>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return <Navigate to="/" replace />;
  }

  return children;
};
