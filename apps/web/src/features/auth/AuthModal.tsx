import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (userEmail: string) => void;
}

type AuthView = 'login' | 'register' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setStatusMessage(null);
  };

  const switchView = (newView: AuthView) => {
    setStatusMessage(null);
    setView(newView);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else if (data.user) {
        setStatusMessage({ type: 'success', text: 'Berhasil masuk.' });
        if (onAuthSuccess) onAuthSuccess(data.user.email ?? email);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 800);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else if (data.user) {
        setStatusMessage({
          type: 'success',
          text: 'Akun berhasil dibuat. Silakan cek email Anda untuk konfirmasi jika diperlukan.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal membuat akun',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Tautan reset kata sandi telah dikirim ke email Anda.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mengirim email reset',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
        setLoading(false);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal login dengan Google',
      });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Title */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-neutral-900">
            {view === 'login' && 'Masuk'}
            {view === 'register' && 'Buat Akun'}
            {view === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {view === 'login' && 'Masukkan email dan password untuk melanjutkan.'}
            {view === 'register' && 'Daftarkan akun baru Anda.'}
            {view === 'reset' && 'Masukkan email untuk menerima tautan reset password.'}
          </p>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`mb-4 flex items-start space-x-2 rounded-lg p-3 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                : 'bg-neutral-100 text-neutral-900 border border-neutral-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-neutral-800" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-neutral-800" />
            )}
            <div>{statusMessage.text}</div>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-700">Password</label>
                <button
                  type="button"
                  onClick={() => switchView('reset')}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 hover:underline"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-neutral-500">Belum punya akun? </span>
              <button
                type="button"
                onClick={() => switchView('register')}
                className="text-xs font-semibold text-neutral-900 hover:underline"
              >
                Buat Akun
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition"
            >
              {loading ? 'Memproses...' : 'Daftar Akun'}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-neutral-500">Sudah punya akun? </span>
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-xs font-semibold text-neutral-900 hover:underline"
              >
                Masuk
              </button>
            </div>
          </form>
        )}

        {/* 3. RESET PASSWORD FORM */}
        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Email Terdaftar</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition"
            >
              {loading ? 'Memproses...' : 'Kirim Link Reset Password'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-xs font-semibold text-neutral-900 hover:underline"
              >
                Kembali ke Masuk
              </button>
            </div>
          </form>
        )}

        {/* DIVIDER */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2 text-neutral-400">atau</span>
          </div>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center space-x-2 rounded-lg border border-neutral-300 bg-white py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Login with Google</span>
        </button>
      </div>
    </div>
  );
};
