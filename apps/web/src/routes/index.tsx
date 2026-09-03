import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';

interface AppRoutesProps {
  userEmail: string | null;
  onOpenAuth: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ userEmail, onOpenAuth }) => {
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
