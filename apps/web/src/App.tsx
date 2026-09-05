import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AppRoutes } from './routes';
import { AuthModal } from './features/auth/AuthModal';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isLanding = location.pathname === '/';

  // Tangkap pesan error jika dialihkan kembali dari OAuth provider (Google/Supabase)
  useEffect(() => {
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    const errDesc = hashParams.get('error_description') || searchParams.get('error_description');
    const errCode = hashParams.get('error') || searchParams.get('error');

    if (errDesc || errCode) {
      const decoded = decodeURIComponent((errDesc || errCode || '').replace(/\+/g, ' '));
      setOauthError(decoded);
      setIsAuthOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        if (event === 'SIGNED_IN') {
          navigate('/dashboard');
        }
      } else {
        setUserEmail(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUserEmail(null);
    navigate('/');
  };

  const handleAuthSuccess = (email: string) => {
    setUserEmail(email);
    setIsAuthOpen(false);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 text-neutral-900 dark:text-slate-100 selection:bg-neutral-200 dark:selection:bg-slate-800">
      {!isDashboard && !isLanding && (
        <Navbar
          userEmail={userEmail}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <main className={isDashboard || isLanding ? 'flex-1' : 'flex-1 flex items-center justify-center'}>
        <AppRoutes
          userEmail={userEmail}
          isAuthLoading={isAuthLoading}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      </main>

      {!isDashboard && !isLanding && <Footer />}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setOauthError(null);
        }}
        onAuthSuccess={handleAuthSuccess}
        initialError={oauthError}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
