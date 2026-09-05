import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

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
  const lenisRef = useRef<Lenis | null>(null);
  const [promptText, setPromptText] = useState(
    'Analisis anomali klaim mustahil: pasien cuci darah di 2 faskes berbeda dalam waktu 1 jam...'
  );
  const [activeChip, setActiveChip] = useState<string | null>(null);

  // 1. Inisialisasi Lenis Smooth Scrolling khusus landing page
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      infinite: false,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    document.documentElement.classList.add('lenis-landing');

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove('lenis-landing');
    };
  }, []);

  // 2. Entrance micro-animation trigger
  useEffect(() => {
    document.documentElement.classList.add('anim');
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('anim');
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  // Helper smooth scroll ke elemen ID atau posisi pixel
  const scrollTo = (target: string | number) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        duration: 1.2,
        offset: -30,
      });
    } else {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleChipClick = (key: string) => {
    setActiveChip(key);
    setPromptText(CHIP_PROMPTS[key] || promptText);
  };

  const handleFooterChipClick = (key: string) => {
    handleChipClick(key);
    scrollTo(0);
  };

  const handleAction = () => {
    if (userEmail) {
      navigate('/dashboard');
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="infera-page-wrap" id="hero">
      {/* ── 1. HERO SECTION (FULL VIEWPORT) ─────────────────────────────────── */}
      <section className="infera-hero-section">
        {/* ATMOSPHERIC BACKGROUND VIDEO */}
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

            {/* CENTER NAV */}
            <nav className="infera-links">
              <a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo(0); }}>Ringkasan</a>
              <a href="#modus" onClick={(e) => { e.preventDefault(); scrollTo('#modus'); }}>Modus Fraud</a>
              <a href="#regulations" onClick={(e) => { e.preventDefault(); scrollTo('#regulations'); }}>Regulasi JKN</a>
              <a href="#audit" onClick={(e) => { e.preventDefault(); scrollTo('#audit'); }}>Audit AI</a>
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
                  <a href="#hero" onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('infera-menu') as HTMLInputElement | null;
                    if (el) el.checked = false;
                    scrollTo(0);
                  }}>Ringkasan</a>
                  <a href="#modus" onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('infera-menu') as HTMLInputElement | null;
                    if (el) el.checked = false;
                    scrollTo('#modus');
                  }}>Modus Fraud</a>
                  <a href="#regulations" onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('infera-menu') as HTMLInputElement | null;
                    if (el) el.checked = false;
                    scrollTo('#regulations');
                  }}>Regulasi JKN</a>
                  <a href="#audit" onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('infera-menu') as HTMLInputElement | null;
                    if (el) el.checked = false;
                    scrollTo('#audit');
                  }}>Audit AI</a>
                  <button type="button" onClick={handleAction} className="infera-sheet-cta">
                    {userEmail ? 'Buka Dashboard' : 'Masuk Sistem'}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* HERO CENTER */}
          <main className="infera-hero">
            <div className="infera-hero-header">
              <div className="infera-pill-label">
                INTELLIGENT FRAUD &amp; RISK ANALYSIS AGENT
              </div>
              <h1 className="infera-h1">
                Deteksi Anomali Klaim.{' '}
                <span className="infera-serif-italic">Cegah Fraud Seketika.</span>
              </h1>
            </div>

            {/* COMPOSER CARD (Pixel-faithful desktop geometry) */}
            <form className="infera-card" onSubmit={(e) => { e.preventDefault(); handleAction(); }}>
              <p className="infera-ph">{promptText}</p>

              <div className="infera-tools">
                {/* CHIPS */}
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

                {/* RIGHT CLUSTER */}
                <div className="infera-right">
                  {/* MODEL */}
                  <div className="infera-model" title="Model AI Aktif: Vera (Nitro 120B)">
                    <span>Vera 120B</span>
                    <svg className="infera-chev" viewBox="0 0 7 4" fill="none" aria-hidden="true">
                      <path d="M1 1L3.5 3L6 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* ATTACH */}
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

                  {/* SEND */}
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

          {/* HERO QUICK PROOF */}
          <div className="infera-proof">
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
          </div>

          {/* SMOOTH SCROLL CUE */}
          <div className="infera-scroll-cue-wrap">
            <button
              type="button"
              onClick={() => scrollTo('#footer')}
              className="infera-scroll-cue"
              aria-label="Scroll untuk eksplorasi ekosistem INFERA"
            >
              <span className="infera-mouse-icon">
                <span className="infera-mouse-wheel"></span>
              </span>
              <span className="infera-scroll-cue-text">Scroll untuk eksplorasi</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. SAAS FOOTER (INSPIRED BY @itfest / PROMOVA) ────────────────────── */}
      <footer className="saas-footer" id="footer">
        <div className="saas-footer__container">
          {/* Top Section: Brand + Navigation Columns */}
          <div className="saas-footer__top">
            {/* Left: Brand info */}
            <div className="saas-footer__brand-col">
              <a href="#hero" className="saas-footer__brand" aria-label="INFERA home" onClick={(e) => { e.preventDefault(); scrollTo(0); }}>
                <svg width="32" height="32" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                  <circle cx="17" cy="17" r="17" fill="#007a3d" />
                  <circle cx="17" cy="17" r="8.6" fill="#FFFFFF" />
                  <circle cx="17" cy="17" r="3.7" fill="#040407" />
                </svg>
                <span className="saas-footer__brand-title">INFERA</span>
              </a>
              <p className="saas-footer__tagline">
                Intelligent Fraud &amp; Risk Analysis Agent khusus integritas klaim BPJS Kesehatan. Deteksi Dini. Bukti Akurat. Perlindungan Dana Umat.
              </p>
            </div>

            {/* Right: Columns Grid */}
            <div className="saas-footer__nav-groups">
              {/* Modus Risiko */}
              <div className="saas-footer__group" id="modus">
                <h4 className="saas-footer__group-title">Modus Risiko</h4>
                <ul className="saas-footer__links">
                  <li><a href="#hero" onClick={(e) => { e.preventDefault(); handleFooterChipClick('travel'); }} className="saas-footer__link">Impossible Travel</a></li>
                  <li><a href="#hero" onClick={(e) => { e.preventDefault(); handleFooterChipClick('shopping'); }} className="saas-footer__link">Doctor Shopping (DSI)</a></li>
                  <li><a href="#hero" onClick={(e) => { e.preventDefault(); handleFooterChipClick('prb'); }} className="saas-footer__link">Resep PRB &amp; Alkes</a></li>
                  <li><a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo(0); }} className="saas-footer__link">Identitas Ganda</a></li>
                </ul>
              </div>

              {/* Fitur Sistem */}
              <div className="saas-footer__group" id="audit">
                <h4 className="saas-footer__group-title">Fitur Sistem</h4>
                <ul className="saas-footer__links">
                  <li><a href="#dashboard" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Voice AI Assistant (Vera)</a></li>
                  <li><a href="#audit" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Laporan Audit Forensik</a></li>
                  <li><a href="#stream" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Aliran Transaksi Klaim</a></li>
                  <li><a href="#cases" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Studi Kasus Pembuktian</a></li>
                </ul>
              </div>

              {/* Informasi & Regulasi */}
              <div className="saas-footer__group" id="regulations">
                <h4 className="saas-footer__group-title">Platform</h4>
                <ul className="saas-footer__links">
                  <li><a href="#regulations" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Regulasi Anti-Fraud</a></li>
                  <li><a href="#bpjs" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Portal BPJS Kesehatan</a></li>
                  <li><a href="#security" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Keamanan &amp; Privasi</a></li>
                  <li><a href="#contact" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__link">Hubungi Tim Verifikator</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Middle: Centerpiece Typographic Watermark */}
          <div className="saas-footer__watermark-wrap">
            <div className="saas-footer__watermark-text" aria-hidden="true">
              INFERA
            </div>
          </div>

          {/* Bottom: Copyright + Legal Links + Socials */}
          <div className="saas-footer__bottom">
            <div className="saas-footer__legal">
              <span className="saas-footer__copy">© INFERA {new Date().getFullYear()} — HealthAthon BPJS Kesehatan</span>
              <a href="#terms" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__legal-link">Ketentuan Layanan</a>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__legal-link">Kebijakan Privasi</a>
              <a href="#data" onClick={(e) => { e.preventDefault(); handleAction(); }} className="saas-footer__legal-link">Kontrol Keamanan Data</a>
            </div>

            <div className="saas-footer__socials">
              {/* Back to Top */}
              <button
                type="button"
                onClick={() => scrollTo(0)}
                className="saas-footer__top-btn"
                title="Kembali ke atas"
                aria-label="Kembali ke bagian atas"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
                <span>Ke Atas</span>
              </button>

              {/* X / Twitter */}
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="saas-footer__social" aria-label="X / Twitter">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="saas-footer__social" aria-label="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="saas-footer__social" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a href="https://github.com/agissugandi7203-ops/Healthkathon" target="_blank" rel="noreferrer" className="saas-footer__social" aria-label="GitHub">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── STYLES ───────────────────────────────────────────────────────────── */}
      <style>{`
        .infera-page-wrap {
          width: 100%;
          min-height: 100vh;
          background: #040407;
          color: #fff;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow-x: hidden;
        }

        .infera-hero-section {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 680px;
          overflow: hidden;
          background: #0a0d12;
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
          --inset-bottom: 90;
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
            --inset-bottom: 70;
          }
        }

        .infera-frame {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          padding: calc(var(--inset-top) * var(--vu)) calc(225 * var(--u)) calc(var(--inset-bottom) * var(--vu));
          background: radial-gradient(circle at 50% 40%, rgba(10, 13, 18, 0.40) 0%, rgba(10, 13, 18, 0.85) 100%);
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
          font-family: 'Instrument Serif', Georgia, serif;
          font-style: italic;
          font-size: calc(24 * var(--u));
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1;
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
          font-size: calc(17 * var(--u));
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

        /* HERO MAIN */
        main.infera-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: calc(42 * var(--vu));
          padding-bottom: calc(4 * var(--vu));
        }

        .infera-hero-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(12 * var(--u));
        }

        .infera-pill-label {
          font-size: calc(11 * var(--u));
          font-family: monospace;
          font-weight: 600;
          color: #cbd5e1;
          letter-spacing: 0.06em;
          padding: calc(4 * var(--u)) calc(14 * var(--u));
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: calc(20 * var(--u));
          text-transform: uppercase;
        }

        .infera-h1 {
          font-size: calc(38 * var(--u));
          font-weight: 400;
          line-height: 1.12;
          letter-spacing: -0.01em;
          color: #fff;
          text-shadow: 0 calc(2 * var(--u)) calc(22 * var(--u)) rgba(0, 0, 0, .35);
          text-align: center;
        }

        .infera-serif-italic {
          font-family: 'Instrument Serif', Georgia, serif;
          font-style: italic;
          font-weight: 400;
          letter-spacing: 0.01em;
          color: #f1f5f9;
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

        /* HERO PROOF */
        .infera-proof {
          flex: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(20 * var(--vu));
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

        /* LENIS SMOOTH SCROLLING (KHUSUS LANDING PAGE) */
        html.lenis-landing {
          height: auto;
        }

        html.lenis-landing,
        html.lenis-landing body {
          scroll-behavior: auto !important;
        }

        .lenis.lenis-smooth {
          scroll-behavior: auto !important;
        }

        .lenis.lenis-smooth [data-lenis-prevent] {
          overscroll-behavior: contain;
        }

        .lenis.lenis-stopped {
          overflow: hidden;
        }

        /* SMOOTH SCROLL CUE */
        .infera-scroll-cue-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: calc(12 * var(--u));
          z-index: 10;
        }

        .infera-scroll-cue {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 999px;
          padding: 6px 14px 6px 10px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .infera-scroll-cue:hover {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.22);
          color: #ffffff;
          transform: translateY(2px);
        }

        .infera-mouse-icon {
          width: 14px;
          height: 20px;
          border: 1.5px solid rgba(255, 255, 255, 0.55);
          border-radius: 8px;
          display: flex;
          justify-content: center;
          padding-top: 3px;
        }

        .infera-mouse-wheel {
          width: 2px;
          height: 4px;
          background-color: #ffffff;
          border-radius: 2px;
          animation: infera-wheel-anim 1.6s infinite ease-in-out;
        }

        @keyframes infera-wheel-anim {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(6px); }
        }

        /* BACK TO TOP BUTTON */
        .saas-footer__top-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 5px 12px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .saas-footer__top-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        /* ── 3. SAAS FOOTER STYLES (INSPIRED BY @itfest / PROMOVA) ─────────── */
        .saas-footer {
          position: relative;
          z-index: 10;
          background: #040407;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          padding: 5rem 1.5rem 3rem;
          overflow: hidden;
        }

        .saas-footer__container {
          max-width: 1180px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        .saas-footer__top {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 3.5rem;
        }

        @media (min-width: 900px) {
          .saas-footer__top {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        .saas-footer__brand-col {
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .saas-footer__brand {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #ffffff;
        }

        .saas-footer__brand-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 2.1rem;
          font-style: italic;
          letter-spacing: -0.01em;
          color: #ffffff;
          line-height: 1;
        }

        .saas-footer__tagline {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.60);
          line-height: 1.7;
        }

        .saas-footer__nav-groups {
          display: flex;
          flex-wrap: wrap;
          gap: 3rem 5rem;
        }

        @media (min-width: 1024px) {
          .saas-footer__nav-groups {
            gap: 3rem 6.5rem;
          }
        }

        .saas-footer__group {
          display: flex;
          flex-direction: column;
          min-width: 140px;
        }

        .saas-footer__group-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 1.45rem;
          font-style: italic;
          font-weight: 400;
          letter-spacing: 0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .saas-footer__links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
          padding: 0;
          margin: 0;
        }

        .saas-footer__link {
          color: rgba(255, 255, 255, 0.60);
          font-size: 0.95rem;
          font-weight: 400;
          letter-spacing: -0.01em;
          text-decoration: none;
          transition: color 0.25s ease, transform 0.25s ease;
          display: inline-block;
        }

        .saas-footer__link:hover {
          color: #ffffff;
          transform: translateX(4px);
        }

        /* WATERMARK CENTERPIECE */
        .saas-footer__watermark-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1.5rem 0 0;
          user-select: none;
        }

        .saas-footer__watermark-text {
          font-family: 'Instrument Serif', Georgia, serif;
          font-style: italic;
          font-size: clamp(4rem, 15vw, 13rem);
          font-weight: 400;
          letter-spacing: 0.12em;
          text-align: center;
          line-height: 0.85;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.01) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 30px rgba(255, 255, 255, 0.03));
          transition: filter 0.3s ease;
        }

        .saas-footer__watermark-text:hover {
          filter: drop-shadow(0 4px 30px rgba(255, 255, 255, 0.08));
        }

        /* BOTTOM LEGAL & SOCIAL */
        .saas-footer__bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 1.75rem;
        }

        @media (min-width: 640px) {
          .saas-footer__bottom {
            flex-direction: row;
          }
        }

        .saas-footer__legal {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.40);
        }

        .saas-footer__copy {
          color: rgba(255, 255, 255, 0.40);
        }

        .saas-footer__legal-link {
          color: rgba(255, 255, 255, 0.40);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .saas-footer__legal-link:hover {
          color: rgba(255, 255, 255, 0.85);
        }

        .saas-footer__socials {
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }

        .saas-footer__social {
          color: rgba(255, 255, 255, 0.40);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease, transform 0.2s ease;
          text-decoration: none;
        }

        .saas-footer__social:hover {
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* ANIMATIONS */
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
