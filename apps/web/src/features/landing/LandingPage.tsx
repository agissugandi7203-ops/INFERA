import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonIcon,
  Badge,
  BlurgradientProd,
  SmoothscrollProd,
  FramerEffects,
} from './framer-ui/components';
import {
  HeroSection,
  ClientLogoSection,
  BeforeAfterSection,
  CoreFeaturesSection,
  PlatformOverviewSection,
  HowItWorksSection,
  SecuritySection,
  UseCasesSection,
  IntegrationsSection,
  PlatformStatsSection,
  TestimonialsSection,
  PricingSection,
  FaqSection,
} from './LandingSections';
import { FRAMER_IMAGES } from './infera-assets';

interface LandingPageProps {
  userEmail: string | null;
  onOpenAuth: () => void;
}

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';
const BODY_FONT = '"Inter Display", "Inter", sans-serif';

export const LandingPage: React.FC<LandingPageProps> = ({ userEmail, onOpenAuth }) => {
  const navigate = useNavigate();

  const handlePrimaryAction = useCallback(() => {
    if (userEmail) {
      navigate('/dashboard');
    } else {
      onOpenAuth();
    }
  }, [userEmail, navigate, onOpenAuth]);

  const handleScrollToSection = useCallback((selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#ffffff',
        color: '#1d1d1d',
        fontFamily: BODY_FONT,
        overflowX: ' clip' as any,
      }}
    >
      {/* Framer WAAPI Appear/Loop Effects */}
      <FramerEffects />

      {/* Framer Momentum Smooth Scrolling (Matches FintechX Video Feel) */}
      <SmoothscrollProd intensity={50} />

      {/* Top Fixed Blur Gradient (Framer BlurgradientProd) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 96,
          zIndex: 40,
          pointerEvents: 'none',
        }}
      >
        <BlurgradientProd
          blur={10}
          borderRadius="0px"
          direction="toBottom"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Sticky Pill Navbar (Matches 181634.png) */}
      <header
        style={{
          position: 'fixed',
          top: 20,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 20px',
          pointerEvents: 'none',
        }}
      >
        <nav
          aria-label="Navigasi Utama"
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 760,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 100,
            padding: '8px 10px 8px 22px',
            border: '1px solid rgba(221, 229, 237, 0.85)',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Brand Logo */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              textDecoration: 'none',
              color: '#1d1d1d',
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2b7fff 0%, #1d4ed8 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              ✦
            </span>
            <span
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#1d1d1d',
              }}
            >
              INFERA
            </span>
          </a>

          {/* Center Anchor Links */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: 28,
            }}
          >
            {[
              { label: 'Beranda', href: '#top' },
              { label: 'Fitur', href: '#features' },
              { label: 'Cara Kerja', href: '#how-it-works' },
              { label: 'Skema', href: '#pricing' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.href === '#top') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    handleScrollToSection(item.href);
                  }
                }}
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#1d1d1d',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Action ButtonIcon */}
          <ButtonIcon
            variant="Nav Button"
            title={userEmail ? 'Buka Dashboard' : 'Mulai Sekarang'}
            onClick={handlePrimaryAction}
          />
        </nav>
      </header>

      {/* Main Content — 13 Reference Sections */}
      <div id="top">
        <HeroSection
          userEmail={userEmail}
          onPrimaryAction={handlePrimaryAction}
          onScrollToSection={handleScrollToSection}
        />
        <ClientLogoSection />
        <BeforeAfterSection />
        <CoreFeaturesSection
          userEmail={userEmail}
          onPrimaryAction={handlePrimaryAction}
          onScrollToSection={handleScrollToSection}
        />
        <PlatformOverviewSection
          userEmail={userEmail}
          onPrimaryAction={handlePrimaryAction}
          onScrollToSection={handleScrollToSection}
        />
        <HowItWorksSection />
        <SecuritySection
          userEmail={userEmail}
          onPrimaryAction={handlePrimaryAction}
          onScrollToSection={handleScrollToSection}
        />
        <UseCasesSection />
        <IntegrationsSection
          userEmail={userEmail}
          onPrimaryAction={handlePrimaryAction}
          onScrollToSection={handleScrollToSection}
        />
        <PlatformStatsSection />
        <TestimonialsSection
          userEmail={userEmail}
          onPrimaryAction={handlePrimaryAction}
          onScrollToSection={handleScrollToSection}
        />
        <PricingSection />
        <FaqSection
          userEmail={userEmail}
          onPrimaryAction={handlePrimaryAction}
          onScrollToSection={handleScrollToSection}
        />
      </div>

      {/* Footer CTA & Floating White Footer Card (Matches 181902.png) */}
      <footer
        style={{
          position: 'relative',
          width: '100%',
          padding: '140px 0 100px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Full-Bleed Sunrise Wildflower Meadow Background */}
        <img
          src={FRAMER_IMAGES.footerBgMeadow}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center bottom',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        {/* Top White Fade Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 240,
            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 1260,
            margin: '0 auto',
            padding: '0 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 72,
          }}
        >
          {/* Top Centered CTA Block */}
          <div
            style={{
              maxWidth: 620,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 18,
            }}
          >
            <h2
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 600,
                lineHeight: 1.12,
                color: '#1d1d1d',
                margin: 0,
              }}
            >
              Ambil kendali penuh atas masa depan JKN Anda
            </h2>
            <p
              style={{
                fontFamily: BODY_FONT,
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.4,
                color: '#4d585f',
                margin: 0,
                maxWidth: 540,
              }}
            >
              Bergabunglah dengan verifikator yang menggunakan wawasan AI dan otomatisasi untuk
              melacak, mengelola, dan melindungi Dana Jaminan Sosial dengan percaya diri.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 14,
                marginTop: 10,
              }}
            >
              <ButtonIcon
                variant="Default"
                title={userEmail ? 'Buka Dashboard' : 'Mulai Sekarang'}
                onClick={handlePrimaryAction}
              />
              <Button
                variant="Default"
                title="Hubungi Tim Kami"
                onClick={handlePrimaryAction}
              />
            </div>
          </div>

          {/* Floating White Footer Card */}
          <div
            style={{
              width: '100%',
              maxWidth: 1000,
              backgroundColor: '#ffffff',
              borderRadius: 26,
              padding: 'clamp(28px, 4.5vw, 50px)',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.1)',
            }}
          >
            {/* Top 4-Column Grid */}
            <div
              className="grid grid-cols-1 md:grid-cols-12"
              style={{
                gap: 36,
              }}
            >
              {/* Brand Column (5 cols) */}
              <div
                className="md:col-span-5"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #2b7fff 0%, #1d4ed8 100%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: 15,
                    }}
                  >
                    ✦
                  </span>
                  <span
                    style={{
                      fontFamily: HEADING_FONT,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#1d1d1d',
                    }}
                  >
                    INFERA
                  </span>
                </div>

                <p
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 15,
                    fontWeight: 500,
                    lineHeight: 1.45,
                    color: '#4d585f',
                    margin: 0,
                    maxWidth: 280,
                  }}
                >
                  Kelola, lacak, dan optimalkan pengawasan klaim JKN Anda dengan wawasan
                  bertenaga AI.
                </p>

                {/* Dark Email Pill Button */}
                <a
                  href="mailto:infera@bpjs-kesehatan.go.id"
                  style={{
                    marginTop: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#1d1d1d',
                    color: '#ffffff',
                    borderRadius: 100,
                    padding: '6px 18px 6px 6px',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: '#2b7fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 14,
                    }}
                  >
                    ✉
                  </span>
                  <span>infera@bpjs-kesehatan.go.id</span>
                </a>
              </div>

              {/* Quick Links Column */}
              <div
                className="md:col-span-2"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1d1d1d',
                    marginBottom: 4,
                  }}
                >
                  Tautan Cepat
                </span>
                {[
                  { label: 'Beranda', href: '#top' },
                  { label: 'Fitur', href: '#features' },
                  { label: 'Cara Kerja', href: '#how-it-works' },
                  { label: 'Skema', href: '#pricing' },
                  { label: 'FAQ', href: '#faq' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (link.href === '#top') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        handleScrollToSection(link.href);
                      }
                    }}
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: '#4d585f',
                      textDecoration: 'none',
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Pages Column */}
              <div
                className="md:col-span-3"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1d1d1d',
                    marginBottom: 4,
                  }}
                >
                  Modul Platform
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 500,
                      color: '#4d585f',
                      fontFamily: BODY_FONT,
                    }}
                  >
                    Dasbor Analitik
                  </button>
                  <Badge variant="SM" title="New" />
                </div>
                {['Audit Klaim SEP', 'Deteksi Risiko NIK', 'Farmasi & Alkes PRB', 'Regulasi JKN'].map(
                  (label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={handlePrimaryAction}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 500,
                        color: '#4d585f',
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>

              {/* Support Column */}
              <div
                className="md:col-span-2"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1d1d1d',
                    marginBottom: 4,
                  }}
                >
                  Kepatuhan
                </span>
                {['Permenkes 16/2019', 'UU PDP No. 27/2022', 'Standar FHIR R4', 'Kebijakan Privasi'].map(
                  (item) => (
                    <span
                      key={item}
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: '#4d585f',
                      }}
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Horizontal Divider */}
            <div
              style={{
                width: '100%',
                height: 1,
                backgroundColor: '#dde5ed',
                margin: '36px 0 24px',
              }}
            />

            {/* Bottom Copyright & 4 Social Icons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#4d585f',
                }}
              >
                © 2026 INFERA — HealthAthon BPJS Kesehatan. Seluruh hak cipta dilindungi.
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {[
                  { icon: FRAMER_IMAGES.socialFacebook, label: 'Facebook' },
                  { icon: FRAMER_IMAGES.socialInstagram, label: 'Instagram' },
                  { icon: FRAMER_IMAGES.socialTwitterX, label: 'X' },
                  { icon: FRAMER_IMAGES.socialDribbble, label: 'Web' },
                ].map((soc) => (
                  <a
                    key={soc.label}
                    href="#top"
                    aria-label={soc.label}
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#eef1f3',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={soc.icon}
                      alt={soc.label}
                      style={{ width: 16, height: 16, objectFit: 'contain' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
