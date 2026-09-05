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
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');

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
      {!isDashboard && (
        <Navbar
          userEmail={userEmail}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <main className={isDashboard ? 'flex-1' : 'flex-1 flex items-center justify-center'}>
        <AppRoutes
          userEmail={userEmail}
          isAuthLoading={isAuthLoading}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      </main>

      {!isDashboard && <Footer />}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
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
