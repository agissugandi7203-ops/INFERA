import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

interface AppRoutesProps {
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ userEmail, onOpenAuth, onLogout }) => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            userEmail={userEmail}
            onOpenAuth={onOpenAuth}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute userEmail={userEmail}>
            <DashboardPage
              userEmail={userEmail}
              onLogout={onLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <div className="py-20 text-center text-xs text-neutral-500">
            404 — Halaman tidak ditemukan.
          </div>
        }
      />
    </Routes>
  );
};
