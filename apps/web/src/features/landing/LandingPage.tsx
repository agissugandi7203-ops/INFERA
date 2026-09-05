import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

interface LandingPageProps {
  userEmail: string | null;
  onOpenAuth: () => void;
}

const PROMPT_PLAYLIST = [
  'Analisis anomali klaim mustahil: pasien cuci darah di 2 faskes berbeda dalam waktu 1 jam...',
  'Investigasi dugaan fraud Impossible Travel: kartu peserta tercatat di 2 RS berjarak >200 km dalam 3 jam...',
  'Deteksi indikasi Doctor Shopping: kunjungan 5 faskes berbeda untuk keluhan serupa dalam 7 hari...',
  'Audit anomali resep PRB & klaim alkes: iterasi resep polifarmasi tanpa rekam medis pendukung...',
];

const CHIP_PROMPTS: Record<string, string> = {
  travel: 'Analisis dugaan fraud Impossible Travel: kartu peserta tercatat di 2 RS berjarak >200 km dalam 3 jam...',
  shopping: 'Investigasi indikasi Doctor Shopping: kunjungan 5 faskes berbeda untuk keluhan serupa dalam 7 hari...',
  prb: 'Audit anomali resep PRB & klaim alkes: iterasi resep polifarmasi tanpa rekam medis pendukung...',
};

export const LandingPage: React.FC<LandingPageProps> = ({ userEmail, onOpenAuth }) => {
  const navigate = useNavigate();
  const lenisRef = useRef<Lenis | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState(PROMPT_PLAYLIST[0]);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // 1. Sticky Nav elevation listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Inisialisasi Lenis Smooth Scrolling khusus landing page
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

  // 3. Typewriter indicator effect (Animasi mengetik karakter demi karakter)
  useEffect(() => {
    let charIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      if (charIndex < currentPrompt.length) {
        setDisplayedText(currentPrompt.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 28);

    return () => clearInterval(typingInterval);
  }, [currentPrompt]);

  // 4. Rotasi otomatis prompt AI jika user tidak mengunci chip manual
  useEffect(() => {
    if (isTyping || activeChip) return;

    const timeout = setTimeout(() => {
      setCurrentPrompt((prev) => {
        const nextIdx = (PROMPT_PLAYLIST.indexOf(prev) + 1) % PROMPT_PLAYLIST.length;
        return PROMPT_PLAYLIST[nextIdx];
      });
    }, 4500);

    return () => clearTimeout(timeout);
  }, [isTyping, activeChip, currentPrompt]);

  // 5. Entrance micro-animation trigger
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
    if (CHIP_PROMPTS[key]) {
      setCurrentPrompt(CHIP_PROMPTS[key]);
    }
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
      {/* ── STICKY ELEGANT PILL NAVBAR ───────────────────────────────────── */}
      <header className={`infera-nav-wrapper ${isScrolled ? 'scrolled' : ''}`}>
        <div className="infera-nav-pill">
          <input type="checkbox" id="infera-menu" aria-label="Toggle navigation menu" />

          {/* BRAND */}
          <div className="infera-brand" onClick={() => scrollTo(0)} role="button" tabIndex={0} aria-label="INFERA Beranda">
            <img src="/infera-logo.png" alt="INFERA Logo" className="infera-brand-logo" />
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
          <button type="button" onClick={handleAction} className="infera-cta" aria-label="Masuk ke sistem INFERA">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="infera-cta-icon" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
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
        </div>
      </header>

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

            {/* COMPOSER CARD (Pixel-faithful desktop geometry, live prompt showcase) */}
            <div className="infera-card" role="region" aria-label="Simulasi prompt analisis AI">
              <div className="infera-ph">
                <div className="infera-typing-row">
                  <span className="infera-prompt-text">
                    {displayedText}
                    <span className={`infera-caret ${isTyping ? 'typing' : 'blinking'}`} aria-hidden="true" />
                  </span>
                </div>
              </div>

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
            </div>
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
                <img src="/infera-logo.png" alt="INFERA Logo" className="saas-footer__brand-logo" />
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
          justify-content: space-between;
          padding: calc(82 * var(--vu)) calc(225 * var(--u)) calc(var(--inset-bottom) * var(--vu));
          background: radial-gradient(circle at 50% 40%, rgba(10, 13, 18, 0.40) 0%, rgba(10, 13, 18, 0.85) 100%);
        }

        #infera-menu { display: none; }
        .infera-burger { display: none; }
        .infera-sheet { display: none; }

        /* ── STICKY FLOATING PILL NAVBAR ────────────────────────── */
        /* ── LIQUID GLASS FLOATING NAVBAR (AI CANVAS GLASS INSPIRED) ── */
        .infera-nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 90;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: calc(18 * var(--u)) calc(32 * var(--u));
          pointer-events: none;
          box-sizing: border-box;
        }

        .infera-nav-wrapper.scrolled {
          padding: calc(18 * var(--u)) calc(32 * var(--u));
        }

        .infera-nav-pill {
          pointer-events: auto;
          width: 100%;
          max-width: min(1320px, calc(1340 * var(--u)));
          height: calc(62 * var(--u));
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 0 calc(24 * var(--u));
          border-radius: calc(20 * var(--u));
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.10);
          backdrop-filter: blur(32px) saturate(190%) brightness(110%);
          -webkit-backdrop-filter: blur(32px) saturate(190%) brightness(110%);
          border: none;
          outline: none;
          box-shadow:
            0 18px 45px -10px rgba(0, 0, 0, 0.50),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.35),
            inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }

        .infera-nav-wrapper.scrolled .infera-nav-pill {
          background: rgba(255, 255, 255, 0.14);
          border: none;
          outline: none;
          box-shadow:
            0 22px 52px -10px rgba(0, 0, 0, 0.60),
            inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1px 1px 0 rgba(255, 255, 255, 0.10);
        }

        .infera-brand {
          display: inline-flex;
          align-items: center;
          gap: calc(14 * var(--u));
          text-decoration: none;
          color: #fff;
          cursor: pointer;
          user-select: none;
        }

        .infera-brand-logo {
          width: clamp(36px, calc(40 * var(--u)), 46px);
          height: clamp(36px, calc(40 * var(--u)), 46px);
          object-fit: contain;
          border-radius: calc(10 * var(--u));
          filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.55));
          transition: transform 0.25s ease, filter 0.25s ease;
        }

        .infera-brand:hover .infera-brand-logo {
          transform: scale(1.08);
          filter: drop-shadow(0 4px 14px rgba(255, 255, 255, 0.25));
        }

        .infera-brand-text {
          display: flex;
          align-items: center;
          gap: calc(10 * var(--u));
        }

        .infera-wordmark {
          font-family: 'Instrument Serif', Georgia, serif;
          font-style: italic;
          font-size: clamp(28px, calc(32 * var(--u)), 36px);
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 1;
          color: #ffffff;
          text-shadow: 0 2px 14px rgba(0, 0, 0, .45);
        }

        .infera-badge {
          font-family: 'Plus Jakarta Sans', Inter, sans-serif;
          font-size: clamp(12px, calc(13 * var(--u)), 14px);
          font-weight: 600;
          color: rgba(255, 255, 255, 0.78);
          border-left: 1.5px solid rgba(255, 255, 255, 0.25);
          padding-left: calc(10 * var(--u));
          line-height: 1;
          letter-spacing: 0.01em;
        }

        /* CENTER NAV LINKS — LIQUID PILLS */
        .infera-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: clamp(6px, calc(8 * var(--u)), 14px);
        }

        .infera-links a {
          font-family: 'Plus Jakarta Sans', Inter, -apple-system, sans-serif;
          font-size: clamp(14.5px, calc(15.5 * var(--u)), 17px);
          font-weight: 600;
          letter-spacing: -0.01em;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          padding: calc(8 * var(--u)) calc(16 * var(--u));
          border-radius: calc(12 * var(--u));
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          border: 1px solid transparent;
        }

        .infera-links a:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            0 4px 14px rgba(0, 0, 0, 0.25);
          transform: translateY(-1px);
        }

        .infera-links a:active {
          transform: translateY(0) scale(0.97);
          background: rgba(255, 255, 255, 0.16);
        }

        /* LOGIN CTA BUTTON */
        .infera-cta {
          height: clamp(42px, calc(46 * var(--u)), 50px);
          padding: 0 clamp(20px, calc(24 * var(--u)), 28px);
          border-radius: calc(14 * var(--u));
          font-family: 'Plus Jakarta Sans', Inter, sans-serif;
          font-size: clamp(14px, calc(15 * var(--u)), 16px);
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #ffffff;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.08) 100%);
          border: 1px solid rgba(255, 255, 255, 0.30);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.50),
            0 6px 22px rgba(0, 0, 0, 0.45);
          display: inline-flex;
          align-items: center;
          gap: calc(10 * var(--u));
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .infera-cta:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.14) 100%);
          border-color: rgba(255, 255, 255, 0.55);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.68),
            0 10px 30px rgba(0, 0, 0, 0.55);
          transform: translateY(-1.5px);
          color: #ffffff;
        }

        .infera-cta:active {
          transform: translateY(0) scale(0.98);
        }

        .infera-cta-icon {
          width: calc(15 * var(--u));
          height: calc(15 * var(--u));
          opacity: 0.92;
          transition: transform 0.2s ease;
        }

        .infera-cta:hover .infera-cta-icon {
          transform: translateX(2.5px);
          opacity: 1;
        }

        /* HERO MAIN */
        main.infera-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: calc(52 * var(--vu));
          padding-top: 0;
          padding-bottom: calc(12 * var(--vu));
        }

        .infera-hero-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(14 * var(--u));
          margin-top: calc(-36 * var(--vu));
          margin-bottom: calc(16 * var(--vu));
        }

        .infera-pill-label {
          font-family: 'Plus Jakarta Sans', Inter, sans-serif;
          font-size: clamp(12.5px, calc(14.5 * var(--u)), 16.5px);
          font-weight: 700;
          color: rgba(255, 255, 255, 0.90);
          letter-spacing: 0.28em;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          text-transform: uppercase;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
        }

        .infera-h1 {
          font-size: clamp(38px, calc(52 * var(--u)), 66px);
          font-weight: 400;
          line-height: 1.14;
          letter-spacing: -0.015em;
          color: #fff;
          text-shadow: 0 calc(2 * var(--u)) calc(24 * var(--u)) rgba(0, 0, 0, .45);
          text-align: center;
        }

        .infera-serif-italic {
          font-family: 'Instrument Serif', Georgia, serif;
          font-style: italic;
          font-weight: 400;
          letter-spacing: 0.01em;
          color: #f8fafc;
        }

        /* COMPOSER CARD (Enlarged prominent geometry) */
        .infera-card {
          width: min(860px, calc(820 * var(--u)));
          height: calc(168 * var(--u));
          min-height: 155px;
          border-radius: calc(26 * var(--u));
          margin-right: calc(3 * var(--u));
          background: rgba(38, 40, 46, 0.94);
          backdrop-filter: blur(calc(30 * var(--u))) saturate(120%);
          -webkit-backdrop-filter: blur(calc(30 * var(--u))) saturate(120%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .15), 0 calc(24 * var(--u)) calc(64 * var(--u)) rgba(0, 0, 0, .45);
          position: relative;
        }

        .infera-ph {
          position: absolute;
          left: calc(30 * var(--u));
          top: calc(30 * var(--u));
          right: calc(30 * var(--u));
          user-select: none;
        }

        .infera-typing-row {
          display: flex;
          align-items: center;
          gap: calc(10 * var(--u));
          width: 100%;
        }

        .infera-prompt-text {
          color: rgba(255, 255, 255, 0.95);
          font-family: 'Plus Jakarta Sans', Inter, sans-serif;
          font-size: clamp(14.5px, calc(16 * var(--u)), 18.5px);
          font-weight: 500;
          line-height: 1.4;
          letter-spacing: 0.005em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .infera-caret {
          display: inline-block;
          width: 2.5px;
          height: 1.15em;
          background: #ffffff;
          margin-left: 3px;
          vertical-align: -0.12em;
          flex-shrink: 0;
        }

        .infera-caret.typing {
          opacity: 1;
        }

        .infera-caret.blinking {
          animation: infera-blink 1s step-end infinite;
        }

        @keyframes infera-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .infera-tools {
          position: absolute;
          left: calc(24 * var(--u));
          right: calc(22 * var(--u));
          top: calc(106 * var(--u));
          height: calc(42 * var(--u));
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .infera-chips {
          display: flex;
          align-items: center;
          gap: calc(8 * var(--u));
          height: 100%;
        }

        .infera-chip {
          height: calc(36 * var(--u));
          border-radius: calc(10 * var(--u));
          font-size: clamp(11.5px, calc(12.5 * var(--u)), 14px);
          font-weight: 600;
          color: #cbd5e1;
          line-height: 1;
          background: linear-gradient(180deg, rgba(255, 255, 255, .10) 0%, rgba(255, 255, 255, .05) 100%);
          border: 1px solid rgba(255, 255, 255, .12);
          padding: 0 calc(14 * var(--u));
          display: inline-flex;
          align-items: center;
          gap: calc(7 * var(--u));
          cursor: pointer;
          transition: all .2s ease;
          white-space: nowrap;
        }

        .infera-chip:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, .18), rgba(255, 255, 255, .10));
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
        }

        .infera-chip.active {
          background: rgba(255, 255, 255, 0.20);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.35);
        }

        .infera-chip span {
          transform: translateY(calc(0.5 * var(--u)));
        }

        /* RIGHT CLUSTER */
        .infera-right {
          position: relative;
          display: flex;
          align-items: center;
          gap: calc(14 * var(--u));
          margin-left: auto;
          pointer-events: auto;
        }

        .infera-right > * {
          position: static;
          pointer-events: auto;
        }

        .infera-model {
          font-size: clamp(12px, calc(13 * var(--u)), 14.5px);
          font-weight: 500;
          color: #cbd5e1;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          gap: calc(6.5 * var(--u));
          cursor: pointer;
          transition: color .18s ease;
        }

        .infera-model:hover {
          color: #ffffff;
        }

        .infera-chev {
          width: calc(7.5 * var(--u));
        }

        .infera-attach {
          color: #cbd5e1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color .18s ease, transform .15s ease;
        }

        .infera-attach svg {
          width: calc(22 * var(--u));
          height: auto;
        }

        .infera-attach:hover {
          color: #fff;
          transform: scale(1.08);
        }

        .infera-send {
          width: calc(40 * var(--u));
          height: calc(40 * var(--u));
          border-radius: 50%;
          background: linear-gradient(163deg, #FBBC94 0%, #F49D70 46%, #E88654 100%);
          box-shadow: 0 calc(4 * var(--u)) calc(16 * var(--u)) rgba(210, 110, 60, .45);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: filter .18s ease, transform .1s ease;
        }

        .infera-send svg {
          width: calc(14 * var(--u));
          height: auto;
          color: #fff;
        }

        .infera-send:hover {
          filter: brightness(1.1);
          transform: scale(1.04);
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

        .saas-footer__brand-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 8px;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
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
          .infera-nav-wrapper,
          .infera-nav-wrapper.scrolled {
            padding: 16px 24px;
          }
          .infera-nav-pill,
          .infera-nav-wrapper.scrolled .infera-nav-pill {
            height: 58px;
            min-height: 58px;
            padding: 0 20px;
            border-radius: 18px;
          }
          .infera-links { position: static; transform: none; gap: clamp(18px, 2.5vw, 36px); }
          .infera-links a { font-size: clamp(13px, 1.5vw, 15px); }
          .infera-cta { height: 38px; padding: 0 16px; font-size: 13px; align-self: center; margin-top: 0; }
          main.infera-hero { gap: 28px; }
          .infera-hero-header { margin-top: 0; margin-bottom: 0; }
          .infera-h1 { font-size: clamp(27px, 4.3vw, 42px); }
          .infera-card {
            width: min(100%, clamp(516px, 74vw, 760px));
            height: auto;
            min-height: 155px;
            margin-right: 0;
            padding: clamp(15px, 1.9vw, 24px);
            border-radius: clamp(17px, 2.1vw, 26px);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: clamp(16px, 2.5vh, 28px);
          }
          .infera-ph {
            position: static;
            min-height: 52px;
            display: flex;
            align-items: flex-start;
          }
          .infera-typing-row {
            width: 100%;
            min-height: 52px;
            display: block;
          }
          .infera-prompt-text {
            white-space: normal;
            font-size: 13px;
            line-height: 1.45;
            display: inline;
          }
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
          .infera-hero-section {
            height: auto;
            min-height: 100dvh;
            overflow: visible;
          }
          .infera-frame {
            position: relative;
            min-height: 100dvh;
            padding: 82px 16px 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .infera-nav-wrapper,
          .infera-nav-wrapper.scrolled {
            padding: 12px 14px;
          }
          .infera-nav-pill,
          .infera-nav-wrapper.scrolled .infera-nav-pill {
            width: 100%;
            height: 52px;
            min-height: 52px;
            border-radius: 16px;
            padding: 0 16px;
          }
          .infera-links, .infera-nav-pill > .infera-cta { display: none; }
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
            background: rgba(24, 24, 27, .94);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, .12);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .infera-sheet-panel a { color: #fff; text-decoration: none; font-size: 14px; padding: 6px 0; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; }
          .infera-sheet-cta {
            height: 40px;
            border-radius: 999px;
            font-size: 13.5px;
            font-weight: 600;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.22);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.30);
          }
          main.infera-hero {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            padding: 8px 0;
            width: 100%;
          }
          .infera-hero-header {
            margin-top: 0;
            margin-bottom: 0;
            gap: 8px;
            text-align: center;
          }
          .infera-pill-label { font-size: 10.5px; letter-spacing: 0.18em; }
          .infera-h1 { font-size: clamp(26px, 7vw, 36px); line-height: 1.18; }
          .infera-card {
            width: 100%;
            height: auto;
            min-height: 205px;
            margin-right: 0;
            padding: 16px;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 14px;
            box-sizing: border-box;
          }
          .infera-ph {
            position: static;
            width: 100%;
            min-height: 60px;
            display: flex;
            align-items: flex-start;
          }
          .infera-typing-row {
            width: 100%;
            min-height: 60px;
            display: block;
          }
          .infera-prompt-text {
            white-space: normal;
            font-size: 13px;
            line-height: 1.45;
            display: inline;
            word-break: break-word;
          }
          .infera-tools {
            position: static;
            height: auto;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .infera-chips { flex-wrap: wrap; gap: 6px; }
          .infera-chip { height: 32px; font-size: 11px; padding: 0 10px; }
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
          .infera-proof {
            gap: 8px;
            padding-top: 10px;
          }
          .infera-proof-caption { font-size: 11px; }
          .infera-logos { flex-wrap: wrap; justify-content: center; gap: 8px; font-size: 10px; }
        }
      `}</style>
    </div>
  );
};
