import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  userEmail: string | null;
  onOpenAuth: () => void;
}

const CHIP_PROMPTS: Record<string, string> = {
  travel: 'Analisis dugaan fraud Impossible Travel: kartu peserta tercatat di 2 RS berjarak >200 km dalam 3 jam...',
  shopping: 'Investigasi indikasi Doctor Shopping: kunjungan 5 faskes berbeda untuk keluhan serupa dalam 7 hari...',
  prb: 'Audit anomali resep PRB & klaim alkes: iterasi resep polifarmasi tanpa rekam medis pendukung...',
};

export const LandingPage: React.FC<LandingPageProps> = ({ userEmail, onOpenAuth }) => {
  const navigate = useNavigate();
  const [promptText, setPromptText] = useState(
    'Analisis anomali klaim mustahil: pasien cuci darah di 2 faskes berbeda dalam waktu 1 jam...'
  );
  const [activeChip, setActiveChip] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('anim');
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('anim');
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  const handleChipClick = (key: string) => {
    setActiveChip(key);
    setPromptText(CHIP_PROMPTS[key] || promptText);
  };

  const handleAction = () => {
    if (userEmail) {
      navigate('/dashboard');
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="infera-stage">
      {/* BACKGROUND VIDEO */}
      <video
        className="infera-stage-video"
        autoPlay
        muted
        loop
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_124724_bc041163-d651-425f-aea3-2acc1efc2c96.mp4"
      />

      <div className="infera-frame">
        <input type="checkbox" id="infera-menu" aria-label="Toggle navigation menu" />

        {/* HEADER NAV */}
        <header className="infera-nav">
          {/* BRAND */}
          <div className="infera-brand">
            <svg className="infera-mark" viewBox="0 0 34 34" fill="none" aria-hidden="true">
              <circle cx="17" cy="17" r="17" fill="#007a3d" />
              <circle cx="17" cy="17" r="8.6" fill="#FFFFFF" />
              <circle cx="17" cy="17" r="3.7" fill="#0a0d12" />
            </svg>
            <div className="infera-brand-text">
              <span className="infera-wordmark">INFERA</span>
              <span className="infera-badge">BPJS Kesehatan</span>
            </div>
          </div>

          {/* CENTER NAV LINKS */}
          <nav className="infera-links">
            <a href="#overview" onClick={(e) => { e.preventDefault(); handleAction(); }}>Ringkasan</a>
            <a href="#modus" onClick={(e) => { e.preventDefault(); handleAction(); }}>Modus Fraud</a>
            <a href="#regulations" onClick={(e) => { e.preventDefault(); handleAction(); }}>Regulasi JKN</a>
            <a href="#audit" onClick={(e) => { e.preventDefault(); handleAction(); }}>Audit AI</a>
          </nav>

          {/* CTA RIGHT */}
          <button type="button" onClick={handleAction} className="infera-cta">
            <span>{userEmail ? 'Buka Dashboard' : 'Masuk Sistem'}</span>
          </button>

          {/* MOBILE BURGER */}
          <label htmlFor="infera-menu" className="infera-burger" aria-label="Toggle menu">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <line x1="0" y1="2" x2="17" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </label>

          {/* MOBILE SHEET */}
          <div className="infera-sheet">
            <div className="infera-sheet-inner">
              <div className="infera-sheet-panel">
                <a href="#overview" onClick={(e) => { e.preventDefault(); handleAction(); }}>Ringkasan</a>
                <a href="#modus" onClick={(e) => { e.preventDefault(); handleAction(); }}>Modus Fraud</a>
                <a href="#regulations" onClick={(e) => { e.preventDefault(); handleAction(); }}>Regulasi JKN</a>
                <a href="#audit" onClick={(e) => { e.preventDefault(); handleAction(); }}>Audit AI</a>
                <button type="button" onClick={handleAction} className="infera-sheet-cta">
                  {userEmail ? 'Buka Dashboard' : 'Masuk Sistem'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* HERO MAIN */}
        <main className="infera-hero">
          <div className="infera-hero-header">
            <div className="infera-pill-label">
              INTELLIGENT FRAUD &amp; RISK ANALYSIS AGENT
            </div>
            <h1 className="infera-h1">
              Deteksi Anomali Klaim. Cegah Kecurangan.
            </h1>
          </div>

          {/* COMPOSER CARD (Pixel-faithful desktop geometry) */}
          <form className="infera-card" onSubmit={(e) => { e.preventDefault(); handleAction(); }}>
            <p className="infera-ph">{promptText}</p>

            <div className="infera-tools">
              {/* CHIP ROW */}
              <div className="infera-chips">
                <button
                  type="button"
                  onClick={() => handleChipClick('travel')}
                  className={`infera-chip ${activeChip === 'travel' ? 'active' : ''}`}
                  style={{ '--cw': '112', '--pl': '12', '--ig': '4' } as React.CSSProperties}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Impossible Travel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChipClick('shopping')}
                  className={`infera-chip ${activeChip === 'shopping' ? 'active' : ''}`}
                  style={{ '--cw': '116', '--pl': '14', '--ig': '4' } as React.CSSProperties}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                    <circle cx="20" cy="10" r="2" />
                  </svg>
                  <span>Doctor Shopping</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChipClick('prb')}
                  className={`infera-chip ${activeChip === 'prb' ? 'active' : ''}`}
                  style={{ '--cw': '118', '--pl': '14', '--ig': '4' } as React.CSSProperties}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                    <path d="m8.5 8.5 7 7" />
                  </svg>
                  <span>Resep PRB &amp; Alkes</span>
                </button>
              </div>

              {/* RIGHT CLUSTER (Exact measured desktop coordinates) */}
              <div className="infera-right">
                {/* MODEL LABEL */}
                <div className="infera-model" title="Model AI Aktif: Vera (Nitro 120B)">
                  <span>Vera 120B</span>
                  <svg className="infera-chev" viewBox="0 0 7 4" fill="none" aria-hidden="true">
                    <path d="M1 1L3.5 3L6 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* ATTACH PAPERCLIP */}
                <button
                  type="button"
                  onClick={handleAction}
                  className="infera-attach"
                  title="Lampirkan Dokumen Klaim / SEP"
                  aria-label="Lampirkan berkas"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M14.5 6.5L7.5 13.5C6.39543 14.6046 4.60457 14.6046 3.5 13.5C2.39543 12.3954 2.39543 10.6046 3.5 9.5L10.5 2.5C12.1569 0.843146 14.8431 0.843146 16.5 2.5C18.1569 4.15685 18.1569 6.84315 16.5 8.5L9.5 15.5C8.39543 16.6046 6.60457 16.6046 5.5 15.5C4.39543 14.3954 4.39543 12.6046 5.5 11.5L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* SEND BUTTON */}
                <button
                  type="button"
                  onClick={handleAction}
                  className="infera-send"
                  aria-label="Mulai Analisis"
                  title="Mulai Analisis Investigasi"
                >
                  <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M6 1L10.5 5.5H7.5V11H4.5V5.5H1.5L6 1Z" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </main>

        {/* PROOF FOOTER */}
        <footer className="infera-proof">
          <div className="infera-proof-caption">Platform Integritas &amp; Mitigasi Fraud Klaim Kesehatan</div>
          <div className="infera-logos">
            <div className="infera-badge-item">BPJS KESEHATAN</div>
            <div className="infera-dot">•</div>
            <div className="infera-badge-item">KEMENKES RI</div>
            <div className="infera-dot">•</div>
            <div className="infera-badge-item">SUPABASE SECURITY</div>
            <div className="infera-dot">•</div>
            <div className="infera-badge-item">OPENROUTER NITRO</div>
          </div>
        </footer>
      </div>

      {/* SCOPED CSS STYLING MATCHING SPECIFICATION PIXEL-FAITHFULLY */}
      <style>{`
        .infera-stage {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #0a0d12;
          color: #fff;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          z-index: 50;
        }

        .infera-stage-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }

        :root {
          --u: min(0.06410256vw, 0.12400794vh);
          --vu: 0.09920635vh;
          --inset-top: 41;
          --inset-bottom: 106;
          --e-primary: cubic-bezier(.16, 1, .3, 1);
          --e-soft: cubic-bezier(.22, 1, .36, 1);
        }

        @supports (height: 100dvh) {
          :root {
            --u: min(0.06410256vw, 0.12400794dvh);
            --vu: 0.09920635dvh;
          }
        }

        @media (min-width: 1561px) {
          :root {
            --inset-top: 27;
            --inset-bottom: 74;
          }
        }

        .infera-frame {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          padding: calc(var(--inset-top) * var(--vu)) calc(225 * var(--u)) calc(var(--inset-bottom) * var(--vu));
          background: radial-gradient(circle at 50% 40%, rgba(10, 13, 18, 0.35) 0%, rgba(10, 13, 18, 0.75) 100%);
        }

        #infera-menu { display: none; }
        .infera-burger { display: none; }
        .infera-sheet { display: none; }

        /* NAV */
        header.infera-nav {
          height: calc(43 * var(--u));
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .infera-brand {
          display: inline-flex;
          align-items: center;
          gap: calc(12 * var(--u));
          text-decoration: none;
          color: #fff;
        }

        .infera-mark {
          width: calc(34 * var(--u));
          height: calc(34 * var(--u));
        }

        .infera-brand-text {
          display: flex;
          align-items: center;
          gap: calc(8 * var(--u));
        }

        .infera-wordmark {
          font-size: calc(18.49 * var(--u));
          font-weight: 700;
          letter-spacing: -0.0154em;
          transform: translateY(calc(1 * var(--u)));
          text-shadow: 0 calc(1 * var(--u)) calc(10 * var(--u)) rgba(0, 0, 0, .30);
        }

        .infera-badge {
          font-size: calc(10 * var(--u));
          font-weight: 500;
          color: #a1a1aa;
          border-left: 1px solid rgba(255, 255, 255, 0.2);
          padding-left: calc(8 * var(--u));
          line-height: 1;
        }

        .infera-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: calc((50.5 - 41) * var(--u));
          display: flex;
          align-items: center;
          gap: calc(50 * var(--u));
        }

        .infera-links a {
          font-size: calc(18 * var(--u));
          font-weight: 400;
          letter-spacing: -0.0115em;
          color: #fff;
          text-decoration: none;
          text-shadow: 0 calc(1 * var(--u)) calc(12 * var(--u)) rgba(0, 0, 0, .32);
          transition: opacity .18s ease;
        }

        .infera-links a:hover {
          opacity: .72;
        }

        .infera-cta {
          height: calc(43 * var(--u));
          padding: 0 calc(20 * var(--u));
          border-radius: calc(12 * var(--u));
          font-size: calc(15.7 * var(--u));
          font-weight: 600;
          letter-spacing: -0.0127em;
          align-self: flex-start;
          margin-top: calc((42 - 41) * var(--u));
          background: linear-gradient(180deg, #3d3d3f 0%, #1d1d20 100%);
          box-shadow: inset 0 calc(1 * var(--u)) 0 rgba(255, 255, 255, .10), 0 calc(2 * var(--u)) calc(14 * var(--u)) rgba(0, 0, 0, .28);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #fff;
          cursor: pointer;
          transition: filter .18s ease, transform .1s ease;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .infera-cta span {
          transform: translateY(calc(1 * var(--u)));
        }

        .infera-cta:hover {
          filter: brightness(1.18);
        }

        .infera-cta:active {
          transform: translateY(1px);
        }

        /* HERO */
        main.infera-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: calc(46 * var(--vu));
          padding-bottom: calc(4 * var(--vu));
        }

        .infera-hero-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(10 * var(--u));
        }

        .infera-pill-label {
          font-size: calc(11 * var(--u));
          font-family: monospace;
          font-weight: 600;
          color: #cbd5e1;
          letter-spacing: 0.05em;
          padding: calc(4 * var(--u)) calc(14 * var(--u));
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: calc(20 * var(--u));
          text-transform: uppercase;
        }

        .infera-h1 {
          font-size: calc(36.25 * var(--u));
          font-weight: 410;
          line-height: 1.12;
          letter-spacing: 0.0018em;
          color: #fff;
          font-variation-settings: "opsz" 32;
          text-shadow: 0 calc(2 * var(--u)) calc(22 * var(--u)) rgba(0, 0, 0, .35);
          text-align: center;
        }

        /* COMPOSER CARD (Exact 708 x 143u geometry) */
        .infera-card {
          width: calc(708 * var(--u));
          height: calc(143 * var(--u));
          border-radius: calc(26 * var(--u));
          margin-right: calc(3 * var(--u));
          background: rgba(41, 41, 43, .955);
          backdrop-filter: blur(calc(26 * var(--u))) saturate(112%);
          -webkit-backdrop-filter: blur(calc(26 * var(--u))) saturate(112%);
          box-shadow: inset 0 0 0 1px rgba(214, 228, 255, .14), 0 calc(22 * var(--u)) calc(60 * var(--u)) rgba(0, 0, 0, .30);
          position: relative;
        }

        .infera-ph {
          position: absolute;
          left: calc(27 * var(--u));
          top: calc(33 * var(--u));
          right: calc(24 * var(--u));
          color: #9ca3af;
          font-size: calc(12 * var(--u));
          font-weight: 400;
          line-height: 1.35;
          letter-spacing: 0.007em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .infera-tools {
          position: absolute;
          left: calc(19 * var(--u));
          top: calc(92 * var(--u));
          height: calc(30 * var(--u));
          right: calc(-1 * var(--u));
        }

        .infera-chips {
          display: flex;
          align-items: center;
          gap: calc(6 * var(--u));
          height: 100%;
        }

        .infera-chip {
          height: calc(30 * var(--u));
          border-radius: calc(9 * var(--u));
          font-size: calc(9.8 * var(--u));
          font-weight: 500;
          color: #a1a1aa;
          line-height: 1;
          background: linear-gradient(180deg, rgba(255, 255, 255, .088) 0%, rgba(255, 255, 255, .050) 45%, rgba(255, 255, 255, .038) 100%);
          border: 1px solid rgba(255, 255, 255, .06);
          padding: 0 calc(12 * var(--u));
          display: inline-flex;
          align-items: center;
          gap: calc(5 * var(--u));
          cursor: pointer;
          transition: all .18s ease;
          white-space: nowrap;
        }

        .infera-chip:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, .15), rgba(255, 255, 255, .08));
          color: #f1f5f9;
        }

        .infera-chip.active {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
        }

        .infera-chip span {
          transform: translateY(calc(1 * var(--u)));
        }

        /* RIGHT CLUSTER */
        .infera-right {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .infera-right > * {
          position: absolute;
          pointer-events: auto;
        }

        .infera-model {
          left: calc(500 * var(--u));
          top: calc(15.5 * var(--u));
          font-size: calc(10.5 * var(--u));
          font-weight: 400;
          color: #9ca3af;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          gap: calc(6.2 * var(--u));
          cursor: pointer;
        }

        .infera-chev {
          width: calc(6.8 * var(--u));
        }

        .infera-attach {
          left: calc(599.15 * var(--u));
          top: calc(10.14 * var(--u));
          color: #9ca3af;
          cursor: pointer;
          transition: color .18s ease;
        }

        .infera-attach svg {
          width: calc(19.79 * var(--u));
          height: auto;
        }

        .infera-attach:hover {
          color: #fff;
        }

        .infera-send {
          left: calc(640 * var(--u));
          top: calc(2 * var(--u));
          width: calc(35 * var(--u));
          height: calc(35 * var(--u));
          border-radius: 50%;
          background: linear-gradient(163deg, #FBBC94 0%, #F49D70 46%, #E88654 100%);
          box-shadow: 0 calc(3 * var(--u)) calc(12 * var(--u)) rgba(210, 110, 60, .34);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: filter .18s ease, transform .1s ease;
        }

        .infera-send svg {
          width: calc(11.66 * var(--u));
          height: auto;
          color: #fff;
        }

        .infera-send:hover {
          filter: brightness(1.08);
        }

        .infera-send:active {
          transform: scale(.95);
        }

        /* PROOF FOOTER */
        footer.infera-proof {
          flex: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(24 * var(--vu));
        }

        .infera-proof-caption {
          font-size: calc(13 * var(--u));
          font-weight: 500;
          color: rgba(255, 255, 255, .85);
          text-shadow: 0 calc(1 * var(--u)) calc(12 * var(--u)) rgba(0, 0, 0, .35);
        }

        .infera-logos {
          display: flex;
          align-items: center;
          gap: calc(18 * var(--u));
          color: #94a3b8;
          font-size: calc(11.5 * var(--u));
          font-family: monospace;
          letter-spacing: 0.08em;
          font-weight: 600;
          text-shadow: 0 calc(1 * var(--u)) calc(8 * var(--u)) rgba(0, 0, 0, .30);
        }

        .infera-dot {
          color: rgba(255, 255, 255, 0.25);
        }

        /* ENTRANCE ANIMATIONS */
        @keyframes e-settle-down {
          from { opacity: 0; transform: translateY(calc(-5 * var(--u))); }
          to { opacity: 1; transform: none; }
        }
        @keyframes e-settle-up {
          from { opacity: 0; transform: translateY(calc(6 * var(--u))); }
          to { opacity: 1; transform: none; }
        }
        @keyframes e-mark {
          from { opacity: 0; transform: scale(.9); }
          to { opacity: 1; transform: none; }
        }
        @keyframes e-focus {
          from { opacity: 0; transform: translateY(calc(14 * var(--u))); filter: blur(calc(6 * var(--u))); }
          to { opacity: 1; transform: none; filter: blur(0); }
        }
        @keyframes e-panel {
          from { opacity: 0; transform: translateY(calc(18 * var(--u))) scale(.985); }
          to { opacity: 1; transform: none; }
        }
        @keyframes e-populate {
          from { opacity: 0; transform: translateY(calc(4 * var(--u))); }
          to { opacity: 1; transform: none; }
        }
        @keyframes e-send {
          from { opacity: 0; transform: scale(.82); }
          to { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: no-preference) {
          html.anim .infera-brand { animation: e-settle-down .58s var(--e-soft) .06s both; }
          html.anim .infera-mark { animation: e-mark .62s var(--e-primary) .06s both; }
          html.anim .infera-links a:nth-child(1) { animation: e-settle-down .50s var(--e-soft) .16s both; }
          html.anim .infera-links a:nth-child(2) { animation: e-settle-down .50s var(--e-soft) .21s both; }
          html.anim .infera-links a:nth-child(3) { animation: e-settle-down .50s var(--e-soft) .26s both; }
          html.anim .infera-links a:nth-child(4) { animation: e-settle-down .50s var(--e-soft) .31s both; }
          html.anim .infera-cta { animation: e-settle-down .55s var(--e-soft) .34s both; }
          html.anim .infera-hero-header { animation: e-focus 1.00s var(--e-primary) .30s both; }
          html.anim .infera-card { animation: e-panel .90s var(--e-primary) .62s both; }
          html.anim .infera-ph { animation: e-populate .50s var(--e-soft) .88s both; }
          html.anim .infera-chips { animation: e-populate .50s var(--e-soft) .94s both; }
          html.anim .infera-model { animation: e-populate .50s var(--e-soft) 1.00s both; }
          html.anim .infera-attach { animation: e-populate .50s var(--e-soft) 1.00s both; }
          html.anim .infera-send { animation: e-send .50s var(--e-primary) 1.00s both; }
          html.anim .infera-proof { animation: e-settle-up .55s var(--e-soft) 1.08s both; }
        }

        /* RESPONSIVE: TABLET */
        @media (min-width: 600px) and (max-width: 1180px) and (min-height: 600px) {
          :root { --u: 1px; }
          .infera-frame { padding: clamp(24px, 3.4vh, 44px) clamp(28px, 4.2vw, 60px) clamp(26px, 4.4vh, 56px); }
          .infera-nav { height: auto; }
          .infera-links { position: static; transform: none; gap: clamp(18px, 2.5vw, 36px); }
          .infera-links a { font-size: clamp(14px, 1.6vw, 17px); }
          .infera-cta { height: 38px; padding: 0 16px; font-size: 13px; align-self: center; margin-top: 0; }
          .infera-h1 { font-size: clamp(27px, 4.3vw, 42px); }
          .infera-card {
            width: min(100%, clamp(516px, 74vw, 760px));
            height: auto;
            margin-right: 0;
            padding: clamp(15px, 1.9vw, 24px);
            border-radius: clamp(17px, 2.1vw, 26px);
            display: flex;
            flex-direction: column;
            gap: clamp(20px, 3.2vh, 40px);
          }
          .infera-ph { position: static; white-space: normal; font-size: 12px; }
          .infera-tools {
            position: static;
            height: auto;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: clamp(10px, 1.4vw, 18px);
          }
          .infera-chips { gap: 6px; }
          .infera-chip { height: 30px; font-size: 11px; padding: 0 10px; }
          .infera-right {
            position: static;
            display: flex;
            align-items: center;
            margin-left: auto;
            inset: auto;
          }
          .infera-right > * { position: static; }
          .infera-attach { margin-left: clamp(10px, 1.4vw, 20px); }
          .infera-send { margin-left: clamp(10px, 1.3vw, 18px); width: 34px; height: 34px; }
        }

        /* RESPONSIVE: COMPACT / MOBILE */
        @media (max-width: 599px), (max-height: 599px) and (max-width: 1180px) {
          :root { --u: 1px; }
          .infera-frame { padding: 20px 16px 24px; }
          .infera-links, header.infera-nav .infera-cta { display: none; }
          .infera-burger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 11px;
            background: rgba(255, 255, 255, .10);
            border: 1px solid rgba(255, 255, 255, .14);
            cursor: pointer;
            color: #fff;
          }
          .infera-sheet {
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows 0.32s cubic-bezier(.4, 0, .2, 1);
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            z-index: 50;
          }
          #infera-menu:checked ~ .infera-sheet {
            grid-template-rows: 1fr;
          }
          .infera-sheet-inner { overflow: hidden; }
          .infera-sheet-panel {
            background: rgba(24, 24, 27, .92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, .12);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .infera-sheet-panel a { color: #fff; text-decoration: none; font-size: 14px; padding: 6px 0; }
          .infera-sheet-cta {
            height: 38px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            background: linear-gradient(180deg, #3d3d3f 0%, #1d1d20 100%);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.12);
          }
          .infera-h1 { font-size: clamp(26px, 7vw, 36px); }
          .infera-card {
            width: 100%;
            height: auto;
            margin-right: 0;
            padding: 16px;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .infera-ph { position: static; font-size: 11px; white-space: normal; }
          .infera-tools {
            position: static;
            height: auto;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .infera-chips { flex-wrap: wrap; gap: 6px; }
          .infera-chip { height: 28px; font-size: 10px; padding: 0 8px; }
          .infera-right {
            position: static;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            inset: auto;
          }
          .infera-right > * { position: static; }
          .infera-attach { margin-left: auto; }
          .infera-send { margin-left: 12px; width: 36px; height: 36px; }
          .infera-logos { flex-wrap: wrap; justify-content: center; gap: 8px; font-size: 10px; }
        }
      `}</style>
    </div>
  );
};
