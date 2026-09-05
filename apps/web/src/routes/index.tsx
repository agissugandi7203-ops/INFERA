import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { DashboardLayout } from '../features/dashboard/layout/DashboardLayout';

// Lazy-load dashboard pages for instantaneous initial page load & anti-lag startup
const OverviewPage = React.lazy(() =>
  import('../features/dashboard/pages/OverviewPage').then((m) => ({ default: m.OverviewPage }))
);
const AiReportPage = React.lazy(() =>
  import('../features/dashboard/pages/AiReportPage').then((m) => ({ default: m.AiReportPage }))
);
const TransactionsPage = React.lazy(() =>
  import('../features/dashboard/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage }))
);
const CasesDeepDivePage = React.lazy(() =>
  import('../features/dashboard/pages/CasesDeepDivePage').then((m) => ({ default: m.CasesDeepDivePage }))
);
const IdentityRiskPage = React.lazy(() =>
  import('../features/dashboard/pages/IdentityRiskPage').then((m) => ({ default: m.IdentityRiskPage }))
);
const UnnecessaryServicesPage = React.lazy(() =>
  import('../features/dashboard/pages/UnnecessaryServicesPage').then((m) => ({ default: m.UnnecessaryServicesPage }))
);
const PharmacyAlkesPage = React.lazy(() =>
  import('../features/dashboard/pages/PharmacyAlkesPage').then((m) => ({ default: m.PharmacyAlkesPage }))
);
const RegulationsPage = React.lazy(() =>
  import('../features/dashboard/pages/RegulationsPage').then((m) => ({ default: m.RegulationsPage }))
);
const MasterDataPage = React.lazy(() =>
  import('../features/dashboard/pages/MasterDataPage').then((m) => ({ default: m.MasterDataPage }))
);

const PageSkeleton: React.FC = () => (
  <div className="space-y-4 max-w-6xl mx-auto w-full animate-pulse">
    <div className="h-7 bg-slate-200/70 rounded-lg w-1/3 mb-4" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div className="h-24 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-24 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-24 bg-slate-100 rounded-2xl border border-slate-200/60" />
      <div className="h-24 bg-slate-100 rounded-2xl border border-slate-200/60" />
    </div>
    <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200/60 mt-4" />
  </div>
);

interface AppRoutesProps {
  userEmail: string | null;
  isAuthLoading?: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  userEmail,
  isAuthLoading,
  onOpenAuth,
  onLogout,
}) => {
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

      {/* Multi-Page Dashboard with Anti-Lag Global Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute userEmail={userEmail} isLoading={isAuthLoading}>
            <DashboardLayout
              userEmail={userEmail}
              onLogout={onLogout}
            />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageSkeleton />}>
              <OverviewPage />
            </Suspense>
          }
        />
        <Route
          path="ai-report"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <AiReportPage />
            </Suspense>
          }
        />
        <Route
          path="transactions"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <TransactionsPage />
            </Suspense>
          }
        />
        <Route
          path="cases"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <CasesDeepDivePage />
            </Suspense>
          }
        />
        <Route
          path="identity-risk"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <IdentityRiskPage />
            </Suspense>
          }
        />
        <Route
          path="unnecessary-services"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <UnnecessaryServicesPage />
            </Suspense>
          }
        />
        <Route
          path="pharmacy-alkes"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PharmacyAlkesPage />
            </Suspense>
          }
        />
        <Route
          path="regulations"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <RegulationsPage />
            </Suspense>
          }
        />
        <Route
          path="master-data"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <MasterDataPage />
            </Suspense>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <div className="py-20 text-center text-xs text-slate-500">
            404 — Halaman tidak ditemukan.{' '}
            <a href="/dashboard" className="text-emerald-600 underline">
              Kembali ke Dashboard
            </a>
          </div>
        }
      />
    </Routes>
  );
};
