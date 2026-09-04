import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Uncaught component rendering error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 text-slate-800 selection:bg-emerald-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">
                Terjadi Kendala pada Tampilan
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Aplikasi mendeteksi adanya gangguan render atau koneksi grafis. Anda dapat memuat ulang halaman untuk memulihkan sesi.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-50 rounded-xl p-3 border border-slate-200/60 max-h-28 overflow-y-auto">
                <p className="text-[11px] font-mono text-rose-600 break-words font-medium">
                  {this.state.error.message || 'Unknown render exception'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
