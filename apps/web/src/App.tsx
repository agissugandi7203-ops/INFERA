import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AppRoutes } from './routes';
import { AuthModal } from './features/auth/AuthModal';
import { supabase } from './lib/supabase';

export const App: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUserEmail(null);
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-neutral-200">
        <Navbar
          userEmail={userEmail}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 flex items-center justify-center">
          <AppRoutes
            userEmail={userEmail}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        </main>
        <Footer />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(email) => setUserEmail(email)}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
