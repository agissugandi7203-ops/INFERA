import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AppRoutes } from './routes';
import { AuthModal } from './features/auth/AuthModal';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
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
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-neutral-200">
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
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
