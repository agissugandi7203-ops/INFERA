import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

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
