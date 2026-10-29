import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Filter out noisy third-party Framer UI deprecation and DOM prop warnings in dev mode
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  const shouldFilter = (msg: unknown) => {
    if (typeof msg !== 'string') return false;
    return (
      msg.includes('Support for defaultProps will be removed from function components') ||
      msg.includes('React does not recognize the `fetchPriority` prop') ||
      msg.includes('React does not recognize the `__withFX` prop')
    );
  };
  console.error = (...args: unknown[]) => {
    if (shouldFilter(args[0])) return;
    originalError.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    if (shouldFilter(args[0])) return;
    originalWarn.apply(console, args);
  };
}

// Handle dynamic module import failures gracefully (e.g. after fresh Vercel deployments with new chunk hashes)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const retryKey = 'vite_chunk_preload_reload';
  const lastReload = sessionStorage.getItem(retryKey);
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(retryKey, String(now));
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
