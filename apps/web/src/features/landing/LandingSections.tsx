import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Button,
  ButtonIcon,
  Badge,
  PreTitle,
  ListItem,
  Accordion,
  StatItem,
  StatLgCard,
  OverviewCard,
  UseCaseCard,
  FounderCard,
  TestimonialItem,
  WorkflowSteps,
  AlertCard,
  BeforeAfter,
  PricingItem,
  FaqsCta,
  ClientLogo,
  IntegrationIcon,
  FeatureBoxTitle,
} from './framer-ui/components';
import {
  FRAMER_IMAGES,
  INFERA_CLIENT_LOGOS,
  FEATURE_SHIELD_BADGES,
  INFERA_OVERVIEW_CARDS,
  INFERA_SECURITY_CHECKLIST,
  INFERA_USE_CASES,
  INFERA_USE_CASE_BADGES,
  INFERA_INTEGRATION_ARC,
  INFERA_STATS_CARDS,
  INFERA_TESTIMONIALS,
  INFERA_FAQS,
} from './infera-assets';

export interface SectionActionProps {
  userEmail: string | null;
  onPrimaryAction: () => void;
  onScrollToSection: (selector: string) => void;
}

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';
const BODY_FONT = '"Inter Display", "Inter", sans-serif';

// ============================================================================
// 1. HERO SECTION (Matches 181634.png, 181701.png, 181707.png)
// ============================================================================
export const HeroSection: React.FC<SectionActionProps> = ({
  userEmail,
  onPrimaryAction,
  onScrollToSection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Scroll-linked transforms matching the 3 Hero screenshots (181634 -> 181701 -> 181707)
  const bgOpacity = useTransform(scrollYProgress, [0, 0.55, 0.85], [1, 0.75, 0]);
  const cloudLeftX = useTransform(scrollYProgress, [0, 0.7], [0, -240]);
  const cloudRightX = useTransform(scrollYProgress, [0, 0.7], [0, 240]);
  const cloudBottomY = useTransform(scrollYProgress, [0, 0.7], [0, 160]);
  const hillsY = useTransform(scrollYProgress, [0, 0.55], [0, 320]);
  const hillsScale = useTransform(scrollYProgress, [0, 0.55], [1, 1.12]);

  const titleOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.35], [0, -90]);

  const dashboardScale = useTransform(scrollYProgress, [0, 0.55], [0.66, 1]);
  const dashboardY = useTransform(scrollYProgress, [0, 0.55], [30, -210]);

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '185vh',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          minHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 145,
          paddingBottom: 60,
        }}
      >
        {/* Sky & Wildflower Meadow Background Layer */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: bgOpacity,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <img
            src={FRAMER_IMAGES.heroBgMeadow}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
          {/* Top & Bottom White Gradient Fades */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 150,
              background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 220,
              background: 'linear-gradient(0deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
            }}
          />
        </motion.div>

        {/* Parallax Clouds */}
        <motion.img
          src={FRAMER_IMAGES.heroCloudLeft}
          alt=""
          style={{
            position: 'absolute',
            top: 90,
            left: '-6%',
            width: 'clamp(280px, 38vw, 560px)',
            x: cloudLeftX,
            opacity: bgOpacity,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <motion.img
          src={FRAMER_IMAGES.heroCloudRight}
          alt=""
          style={{
            position: 'absolute',
            top: 80,
            right: '-6%',
            width: 'clamp(280px, 38vw, 560px)',
            x: cloudRightX,
            opacity: bgOpacity,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <motion.img
          src={FRAMER_IMAGES.heroCloudBottom}
          alt=""
          style={{
            position: 'absolute',
            bottom: 140,
            left: '28%',
            width: 'clamp(300px, 42vw, 620px)',
            y: cloudBottomY,
            opacity: bgOpacity,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Foreground V-Shaped Grass Hills */}
        <motion.div
          style={{
            position: 'absolute',
            left: '-2%',
            right: '-2%',
            bottom: -40,
            y: hillsY,
            scale: hillsScale,
            opacity: bgOpacity,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <img
            src={FRAMER_IMAGES.heroGrassHills}
            alt=""
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 140,
              background: 'linear-gradient(0deg, #ffffff 15%, rgba(255,255,255,0) 100%)',
            }}
          />
        </motion.div>

        {/* Hero Text, CTAs, and 3 ListItem Feature Pills */}
        <motion.div
          style={{
            position: 'relative',
            zIndex: 3,
            maxWidth: 1260,
            width: '100%',
            padding: '0 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            opacity: titleOpacity,
            y: titleY,
          }}
        >
          {/* H1 Display Title with Inline 3D AI Icon */}
          <h1
            style={{
              fontFamily: HEADING_FONT,
              fontSize: 'clamp(40px, 5.4vw, 76px)',
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#1d1d1d',
              margin: 0,
              maxWidth: 980,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '0 14px',
              }}
            >
              <span>Inteligensi</span>
              <motion.img
                src={FRAMER_IMAGES.heroTitleAiIcon}
                alt="AI Badge"
                initial={{ scale: 0.85, rotate: 4 }}
                animate={{ scale: 1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                style={{
                  width: 'clamp(48px, 5.2vw, 74px)',
                  height: 'clamp(48px, 5.2vw, 74px)',
                  objectFit: 'contain',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  filter: 'drop-shadow(0 12px 18px rgba(37, 99, 235, 0.25))',
                }}
              />
              <span>Risiko Klaim</span>
            </span>
            <br />
            <span>untuk Proteksi JKN Modern</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: BODY_FONT,
              fontSize: 'clamp(16px, 1.3vw, 18px)',
              fontWeight: 500,
              lineHeight: 1.4,
              color: '#4d585f',
              maxWidth: 610,
              marginTop: 22,
              marginBottom: 32,
            }}
          >
            Lacak, analisis, dan optimalkan pengawasan klaim JKN dengan wawasan berbasis AI
            real-time serta otomatisasi cerdas Permenkes No. 16 Tahun 2019.
          </p>

          {/* 2 CTA Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 38,
            }}
          >
            <ButtonIcon
              variant="Default"
              title={userEmail ? 'Buka Dashboard' : 'Mulai Sekarang'}
              onClick={onPrimaryAction}
            />
            <Button
              variant="Default"
              title="Jelajahi Fitur"
              onClick={() => onScrollToSection('#features')}
            />
          </div>

          {/* 3 ListItem Feature Pills with Vertical Dividers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 24,
            }}
          >
            <ListItem
              variant="Fit"
              icon={FRAMER_IMAGES.iconStarYellow}
              title="Wawasan Klaim Berbasis AI"
              color="rgb(29, 29, 29)"
            />
            <div style={{ width: 1, height: 20, backgroundColor: '#dde5ed' }} />
            <ListItem
              variant="Fit"
              icon={FRAMER_IMAGES.iconShieldGreen}
              title="Keamanan Setara Bank & UU PDP"
              color="rgb(29, 29, 29)"
            />
            <div style={{ width: 1, height: 20, backgroundColor: '#dde5ed' }} />
            <ListItem
              variant="Fit"
              icon={FRAMER_IMAGES.iconBoltRed}
              title="Pelacakan Klaim Real-Time"
              color="rgb(29, 29, 29)"
            />
          </div>
        </motion.div>

        {/* Scroll-Zoom Dashboard Mockup Card */}
        <motion.div
          style={{
            position: 'relative',
            zIndex: 4,
            width: '100%',
            maxWidth: 1160,
            padding: '0 24px',
            marginTop: 24,
            scale: dashboardScale,
            y: dashboardY,
            transformOrigin: 'center top',
          }}
        >
          <div
            onClick={onPrimaryAction}
            style={{
              cursor: 'pointer',
              padding: 10,
              borderRadius: 28,
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid #dde5ed',
              boxShadow: '0 32px 80px rgba(15, 23, 42, 0.16)',
              overflow: 'hidden',
            }}
          >
            <img
              src={FRAMER_IMAGES.heroDashboard}
              alt="INFERA Analytics Dashboard"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: 20,
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// 2. CLIENT LOGO TICKER SECTION (Matches 181731.png top)
// ============================================================================
export const ClientLogoSection: React.FC = () => {
  const repeatedLogos = [...INFERA_CLIENT_LOGOS, ...INFERA_CLIENT_LOGOS];

  return (
    <section
      style={{
        width: '100%',
        padding: '20px 0 0',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: '0 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
        }}
      >
        {/* PreTitle flanked by horizontal lines */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: '#dde5ed' }} />
          <PreTitle
            variant="Default"
            title="Dipercaya oleh ekosistem layanan kesehatan & audit modern"
          />
          <div style={{ flex: 1, height: 1, backgroundColor: '#dde5ed' }} />
        </div>

        {/* Infinite Marquee of 11 Official ClientLogo Components */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            padding: '10px 0',
          }}
        >
          {/* Left & Right White Fade Overlays */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 90,
              background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 90,
              background: 'linear-gradient(270deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 64,
              width: 'max-content',
            }}
          >
            {repeatedLogos.map((logoUrl, idx) => (
              <div
                key={idx}
                style={{
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClientLogo image={logoUrl} style={{ width: 115, height: 26 }} />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 3. COMPARISON BEFORE / AFTER SECTION (Matches 181731.png bottom & 181742.png)
// ============================================================================
export const BeforeAfterSection: React.FC = () => {
  const [mode, setMode] = useState<'Before' | 'After'>('Before');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 810);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const activeVariant = isMobile
    ? mode === 'Before'
      ? 'Before - Phone'
      : 'After - Phone'
    : mode;

  return (
    <section
      style={{
        width: '100%',
        padding: '170px 0 0',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '0 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 50,
        }}
      >
        <h2
          style={{
            fontFamily: HEADING_FONT,
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 600,
            lineHeight: 1.15,
            color: '#1d1d1d',
            textAlign: 'center',
            margin: 0,
            maxWidth: 540,
          }}
        >
          Mengapa verifikasi klaim lama tidak lagi cukup
        </h2>

        {/* BeforeAfter Component with Interactive Click Zones on its Built-In Tabs & Dial */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 750,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Left Tab Click Zone ("Before FintechX") */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Tampilkan kondisi sebelum INFERA"
            onClick={() => setMode('Before')}
            onKeyDown={(e) => e.key === 'Enter' && setMode('Before')}
            style={{
              position: 'absolute',
              top: 0,
              left: 40,
              width: 'calc(50% - 95px)',
              height: 90,
              zIndex: 10,
              cursor: 'pointer',
            }}
          />
          {/* Center 3D Rotary Dial Click Zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Alihkan Before dan After"
            onClick={() => setMode((prev) => (prev === 'Before' ? 'After' : 'Before'))}
            onKeyDown={(e) =>
              e.key === 'Enter' && setMode((prev) => (prev === 'Before' ? 'After' : 'Before'))
            }
            style={{
              position: 'absolute',
              top: 0,
              left: 'calc(50% - 55px)',
              width: 110,
              height: 95,
              zIndex: 10,
              cursor: 'pointer',
            }}
          />
          {/* Right Tab Click Zone ("After FintechX") */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Tampilkan kondisi sesudah INFERA"
            onClick={() => setMode('After')}
            onKeyDown={(e) => e.key === 'Enter' && setMode('After')}
            style={{
              position: 'absolute',
              top: 0,
              right: 40,
              width: 'calc(50% - 95px)',
              height: 90,
              zIndex: 10,
              cursor: 'pointer',
            }}
          />

          <BeforeAfter variant={activeVariant} style={{ width: '100%', maxWidth: 750 }} />
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 4. CORE FEATURES BENTO GRID SECTION (Matches 181750.png)
// ============================================================================
export const CoreFeaturesSection: React.FC<SectionActionProps> = ({ onPrimaryAction }) => {
  const [cycleIdx, setCycleIdx] = useState<0 | 1 | 2>(0);
  const variants: Array<'01' | '02' | '03'> = ['01', '02', '03'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCycleIdx((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const currentVariant = variants[cycleIdx];
  const repeatedBadges = [...FEATURE_SHIELD_BADGES, ...FEATURE_SHIELD_BADGES];

  return (
    <section
      id="features"
      style={{
        width: '100%',
        padding: '180px 0 0',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: '0 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 54,
        }}
      >
        {/* 2-Column Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 14,
              maxWidth: 540,
            }}
          >
            <PreTitle variant="Default" title="Fitur Utama" />
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
              Dibangun untuk verifikasi klaim yang lebih cerdas
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 20,
              maxWidth: 420,
            }}
          >
            <p
              style={{
                fontFamily: BODY_FONT,
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.4,
                color: '#4d585f',
                margin: 0,
              }}
            >
              Dirancang untuk menyederhanakan alur audit yang kompleks dan mengubah telemetri
              klaim menjadi keputusan yang jelas.
            </p>
            <ButtonIcon variant="Dark" title="Mulai Sekarang" onClick={onPrimaryAction} />
          </div>
        </div>

        {/* 5-Card Bento Grid matching 181750.png */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12"
          style={{
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {/* Left 2/3 Column (8 cols on lg) */}
          <div
            className="lg:col-span-8"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* Top 2 Sub-Cards */}
            <div
              className="grid grid-cols-1 md:grid-cols-2"
              style={{
                gap: 24,
              }}
            >
              {/* Card 1: Security Shield + White Badge Marquee */}
              <div
                style={{
                  backgroundColor: '#eef1f3',
                  borderRadius: 28,
                  padding: '32px 24px 26px',
                  minHeight: 380,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <h3
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 21,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    color: '#1d1d1d',
                    textAlign: 'center',
                    margin: 0,
                    maxWidth: 260,
                  }}
                >
                  Keamanan yang dapat Anda percaya
                </h3>

                <img
                  src={FRAMER_IMAGES.featureShieldSvg}
                  alt="Security Shield"
                  style={{
                    width: 240,
                    height: 'auto',
                    objectFit: 'contain',
                    margin: '10px 0',
                  }}
                />

                {/* Bottom Scrolling White Badges */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    overflow: 'hidden',
                    paddingTop: 6,
                  }}
                >
                  <motion.div
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: 'max-content',
                    }}
                  >
                    {repeatedBadges.map((badgeText, idx) => (
                      <Badge key={idx} variant="White" title={badgeText} />
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Card 2: Meadow Background + Glassmorphic Chart SVG */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: 28,
                  padding: '32px 24px',
                  minHeight: 380,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  backgroundColor: '#dde5ed',
                }}
              >
                <img
                  src={FRAMER_IMAGES.featureMeadowCardBg}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '55%',
                    background:
                      'linear-gradient(180deg, rgba(238,241,243,0.95) 0%, rgba(238,241,243,0) 100%)',
                    zIndex: 1,
                  }}
                />

                <h3
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    fontFamily: HEADING_FONT,
                    fontSize: 21,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    color: '#1d1d1d',
                    textAlign: 'center',
                    margin: 0,
                    maxWidth: 240,
                  }}
                >
                  Visibilitas klaim secara real-time
                </h3>

                <img
                  src={FRAMER_IMAGES.featureChartSvg}
                  alt="Real-time Chart"
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    width: 245,
                    height: 'auto',
                    objectFit: 'contain',
                    marginTop: 'auto',
                  }}
                />
              </div>
            </div>

            {/* Bottom Wide Card: Sky/Flowers BG + Tilted Cards SVG */}
            <div
              style={{
                position: 'relative',
                borderRadius: 28,
                padding: '38px 30px 0',
                minHeight: 385,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                overflow: 'hidden',
                backgroundColor: '#e6eef8',
              }}
            >
              <img
                src={FRAMER_IMAGES.featureSkyCardBg}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '65%',
                  background:
                    'linear-gradient(180deg, rgba(238,241,243,0.92) 0%, rgba(238,241,243,0) 100%)',
                  zIndex: 1,
                }}
              />

              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 8,
                  maxWidth: 460,
                }}
              >
                <h3
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 26,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: '#1d1d1d',
                    margin: 0,
                  }}
                >
                  Rekomendasi berbasis AI
                </h3>
                <p
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 15,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: '#4d585f',
                    margin: 0,
                  }}
                >
                  Dapatkan saran verifikasi yang dipersonalisasi sesuai dengan tujuan kepatuhan
                  dan profil risiko klaim Anda.
                </p>
              </div>

              <img
                src={FRAMER_IMAGES.featureTiltedCardsSvg}
                alt="AI Recommendations"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: 300,
                  height: 'auto',
                  objectFit: 'contain',
                  marginTop: 16,
                }}
              />
            </div>
          </div>

          {/* Right 1/3 Column (4 cols on lg) */}
          <div
            className="lg:col-span-4"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* Card 4: Tall Black Card with FeatureBoxTitle */}
            <div
              onClick={() => setCycleIdx((prev) => ((prev + 1) % 3) as 0 | 1 | 2)}
              style={{
                cursor: 'pointer',
                backgroundColor: '#000000',
                borderRadius: 28,
                padding: '34px 28px',
                minHeight: 430,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'center',
                overflow: 'hidden',
              }}
            >
              <h3
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 21,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  color: '#ffffff',
                  margin: 0,
                  maxWidth: 260,
                }}
              >
                Otomasi audit dengan aturan cerdas
              </h3>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <FeatureBoxTitle variant={currentVariant} />
              </div>

              <p
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: 'rgba(221, 229, 237, 0.72)',
                  margin: 0,
                  maxWidth: 290,
                }}
              >
                Kurangi upaya manual dengan aturan otomatis yang beradaptasi terhadap perubahan
                pola klaim.
              </p>
            </div>

            {/* Card 5: Bottom Gray Card with AlertCard + 3D Pink Bell */}
            <div
              onClick={() => setCycleIdx((prev) => ((prev + 1) % 3) as 0 | 1 | 2)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: '#eef1f3',
                borderRadius: 28,
                padding: '32px 24px 28px',
                minHeight: 335,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              <h3
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 21,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  color: '#1d1d1d',
                  textAlign: 'center',
                  margin: 0,
                  maxWidth: 230,
                  zIndex: 2,
                }}
              >
                Peringatan cerdas untuk hal yang krusial
              </h3>

              {/* Floating 3D Pink Bell */}
              <img
                src={FRAMER_IMAGES.featureBell3d}
                alt="3D Notification Bell"
                style={{
                  position: 'absolute',
                  top: 76,
                  right: 18,
                  width: 64,
                  height: 'auto',
                  zIndex: 3,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 8px 14px rgba(0, 0, 0, 0.14))',
                }}
              />

              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  marginTop: 'auto',
                }}
              >
                <AlertCard variant={currentVariant} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 5. PLATFORM OVERVIEW SECTION (Matches 181755.png)
// ============================================================================
export const PlatformOverviewSection: React.FC<SectionActionProps> = ({
  onPrimaryAction,
  onScrollToSection,
}) => {
  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        padding: '180px 0',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Full-Bleed Mountain Meadow Background */}
      <img
        src={FRAMER_IMAGES.overviewBgMeadow}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Top & Bottom White Gradient Fades */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 220,
          background: 'linear-gradient(0deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
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
          gap: 48,
        }}
      >
        {/* Centered Header Block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 680,
            gap: 16,
          }}
        >
          <PreTitle variant="Default" title="Ikhtisar Platform" />
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
            Dirancang untuk pengawasan klaim yang jelas dan percaya diri
          </h2>
          <p
            style={{
              fontFamily: BODY_FONT,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.4,
              color: '#4d585f',
              margin: 0,
              maxWidth: 580,
            }}
          >
            Tampilan terpadu yang menyatukan seluruh data klaim, wawasan risiko, dan performa
            pengawasan Anda dalam satu ruang kerja intuitif.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 14,
              marginTop: 12,
            }}
          >
            <ButtonIcon variant="Default" title="Mulai Sekarang" onClick={onPrimaryAction} />
            <Button
              variant="Dark"
              title="Pelajari Lebih Lanjut"
              onClick={() => onScrollToSection('#how-it-works')}
            />
          </div>
        </div>

        {/* Large Glass-Framed Dashboard Mockup */}
        <div
          onClick={onPrimaryAction}
          style={{
            cursor: 'pointer',
            width: '100%',
            padding: 10,
            borderRadius: 28,
            backgroundColor: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 28px 70px rgba(15, 23, 42, 0.14)',
          }}
        >
          <img
            src={FRAMER_IMAGES.overviewDashboard}
            alt="Ikhtisar Platform INFERA"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 20,
            }}
          />
        </div>

        {/* 3 OverviewCard Components */}
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            width: '100%',
            gap: 24,
          }}
        >
          {INFERA_OVERVIEW_CARDS.map((card, idx) => (
            <OverviewCard
              key={idx}
              variant="Desktop"
              icon={card.icon}
              content={card.content}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 6. HOW IT WORKS SECTION (Matches 181806.png top)
// ============================================================================
export const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      style={{
        width: '100%',
        padding: '0 0 180px',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: '0 30px',
        }}
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-12"
          style={{
            gap: 56,
            alignItems: 'stretch',
          }}
        >
          {/* Left Column: PreTitle + H2 + Description + 2 StatItems at Bottom */}
          <div
            className="lg:col-span-5"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 48,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <PreTitle variant="Default" title="Cara Kerja" />
              <h2
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 'clamp(32px, 3.8vw, 48px)',
                  fontWeight: 600,
                  lineHeight: 1.12,
                  color: '#1d1d1d',
                  margin: 0,
                }}
              >
                Cara lebih cerdas mengelola risiko dalam tiga langkah
              </h2>
              <p
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: '#4d585f',
                  margin: 0,
                }}
              >
                Dari menghubungkan aliran klaim hingga menerima wawasan berbasis AI, setiap
                langkah dirancang agar sederhana, aman, dan mudah dijalankan.
              </p>
            </div>

            {/* 2 StatItem Components side-by-side */}
            <div
              className="grid grid-cols-2"
              style={{
                gap: 24,
                paddingTop: 20,
              }}
            >
              <StatItem
                variant="Default"
                title="100%"
                description="Visibilitas penuh atas seluruh klaim yang terhubung"
              />
              <StatItem
                variant="Default"
                title="2 Menit"
                description="Rata-rata waktu konfigurasi untuk memulai"
              />
            </div>
          </div>

          {/* Right Column: Interactive WorkflowSteps Component */}
          <div
            className="lg:col-span-7"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WorkflowSteps
              variant="01"
              step1Title="Hubungkan ekosistem klaim Anda"
              step1Desc="Tautkan aliran SEP VClaim, P-Care FKTP, Apotek PRB, dan RME SATUSEHAT secara aman hanya dalam beberapa menit."
              step2Title="Analisis pola risiko secara real-time"
              step2Desc="Platform memproses data klaim Anda menggunakan 4 algoritma deterministik untuk menyoroti anomali, risiko, dan peluang mitigasi."
              step3Title="Ambil keputusan audit dengan percaya diri"
              step3Desc="Gunakan rekomendasi jelas berlandaskan Permenkes No. 16/2019 dan peringatan otomatis untuk melindungi Dana Jaminan Sosial."
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 7. SECURITY & COMPLIANCE SECTION (Matches 181806.png bottom)
// ============================================================================
export const SecuritySection: React.FC<SectionActionProps> = ({ onPrimaryAction }) => {
  return (
    <section
      style={{
        width: '100%',
        padding: '0',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: '0 30px',
        }}
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-12"
          style={{
            gap: 60,
            alignItems: 'center',
          }}
        >
          {/* Left Column: 3D Purple Cloud Shield + SOC2/ISO27001/GDPR Card */}
          <div className="lg:col-span-6">
            <div
              style={{
                backgroundColor: '#eef1f3',
                borderRadius: 30,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={FRAMER_IMAGES.securityCloudShield}
                alt="Keamanan & Kepatuhan SOC2 ISO27001 GDPR UU PDP"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* Right Column: PreTitle + H2 + Dark ButtonIcon + 4 ListItems */}
          <div
            className="lg:col-span-6"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 24,
            }}
          >
            <PreTitle variant="Default" title="Keamanan & Kepatuhan" />
            <h2
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 'clamp(32px, 3.8vw, 48px)',
                fontWeight: 600,
                lineHeight: 1.12,
                color: '#1d1d1d',
                margin: 0,
              }}
            >
              Dibangun dengan keamanan dan kepatuhan sebagai inti
            </h2>

            <ButtonIcon variant="Dark" title="Mulai Sekarang" onClick={onPrimaryAction} />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                width: '100%',
                marginTop: 8,
              }}
            >
              {INFERA_SECURITY_CHECKLIST.map((itemText, idx) => (
                <ListItem
                  key={idx}
                  variant="Default"
                  icon={FRAMER_IMAGES.iconChevronGreen}
                  title={itemText}
                  color="rgb(29, 29, 29)"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 8. USE CASES SECTION (Matches 181820.png)
// ============================================================================
export const UseCasesSection: React.FC = () => {
  const repeatedUseCases = [...INFERA_USE_CASES, ...INFERA_USE_CASES];

  return (
    <section
      style={{
        width: '100%',
        padding: '180px 0',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Centered Header */}
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto 50px',
          padding: '0 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
        }}
      >
        <PreTitle variant="Default" title="Skenario Penggunaan" />
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
          Dibangun untuk setiap jenis verifikator
        </h2>
      </div>

      {/* Horizontal Marquee Row of UseCaseCard Components */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          padding: '10px 0',
        }}
      >
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 42, ease: 'linear', repeat: Infinity }}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 26,
            width: 'max-content',
            paddingLeft: 30,
          }}
        >
          {repeatedUseCases.map((uc, idx) => (
            <div key={idx} style={{ flex: 'none', width: 380 }}>
              <UseCaseCard
                variant="Desktop"
                title={uc.title}
                description={uc.description}
                statsTitle={uc.statsTitle}
                statsDescription={uc.statsDescription}
                bgImage={uc.bgImage}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Row: 4 Badges on Left + FounderCard on Right */}
      <div
        style={{
          maxWidth: 1260,
          margin: '54px auto 0',
          padding: '0 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 30,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            maxWidth: 640,
          }}
        >
          {INFERA_USE_CASE_BADGES.map((badgeText, idx) => (
            <Badge key={idx} variant="Default" title={badgeText} />
          ))}
        </div>

        <FounderCard
          content="“Kami membangun platform ini untuk menghilangkan tebakan dalam audit klaim melalui wawasan cerdas.”"
          jobTitle="Arsitek Utama & Pendiri INFERA"
          avatar={FRAMER_IMAGES.founderAvatar}
        />
      </div>
    </section>
  );
};

// ============================================================================
// 9. INTEGRATIONS SECTION (Matches 181825.png)
// ============================================================================
export const IntegrationsSection: React.FC<SectionActionProps> = ({ onPrimaryAction }) => {
  return (
    <section
      style={{
        width: '100%',
        padding: '0',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: '0 30px',
        }}
      >
        {/* Rounded #eef1f3 Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#eef1f3',
            borderRadius: 30,
            padding: '76px 30px 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 720,
          }}
        >
          {/* Centered Header Block */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: 640,
              gap: 16,
            }}
          >
            <PreTitle variant="White" title="Integrasi" />
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
              Terhubung mulus dengan ekosistem klaim Anda
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
              Sinkronkan data secara aman dari fasilitas kesehatan, sistem klaim, dan layanan
              rekam medis untuk menjaga seluruh telemetri tetap mutakhir.
            </p>
            <div style={{ marginTop: 8 }}>
              <ButtonIcon variant="Default" title="Mulai Sekarang" onClick={onPrimaryAction} />
            </div>
          </div>

          {/* Semi-Circular Arc of 8 IntegrationIcon Components + Central 3D Sphere */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: 820,
              height: 410,
              marginTop: 24,
            }}
          >
            {INFERA_INTEGRATION_ARC.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.45 }}
                style={{
                  position: 'absolute',
                  left: item.left,
                  top: item.top,
                  transform: `rotate(${item.rotate}deg)`,
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                  borderRadius: '50%',
                }}
              >
                <IntegrationIcon icon={item.icon} />
              </motion.div>
            ))}

            {/* Central Dark 3D Sphere */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: -35,
                transform: 'translateX(-50%)',
                width: 350,
                height: 350,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <img
                src={FRAMER_IMAGES.integrationCenterSphere}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              <p
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: BODY_FONT,
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: '#ffffff',
                  maxWidth: 185,
                  margin: '0 0 24px',
                }}
              >
                100+ integrasi tersedia dan terus bertambah
              </p>
            </div>
          </div>

          {/* Bottom Green Hills Foreground */}
          <img
            src={FRAMER_IMAGES.integrationHills}
            alt=""
            style={{
              position: 'absolute',
              left: -10,
              right: -10,
              bottom: -65,
              width: 'calc(100% + 20px)',
              height: 'auto',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 10. PLATFORM STATS SECTION (Matches 181832.png)
// ============================================================================
export const PlatformStatsSection: React.FC = () => {
  return (
    <section
      style={{
        width: '100%',
        padding: '160px 0 0',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: '0 30px',
          position: 'relative',
        }}
      >
        {/* Top Row: Left Card (Default) & Right Card (Dark) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <StatLgCard {...INFERA_STATS_CARDS[0]} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginTop: 48 }}
          >
            <StatLgCard {...INFERA_STATS_CARDS[1]} />
          </motion.div>
        </div>

        {/* Center Title Block */}
        <div
          style={{
            maxWidth: 660,
            margin: '36px auto 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 16,
          }}
        >
          <PreTitle variant="Default" title="Statistik Platform" />
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
            Performa terukur dalam skala nyata
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
            Sekilas tentang bagaimana platform kami mendukung keputusan klaim yang lebih cerdas
            melalui keandalan dan wawasan real-time.
          </p>
        </div>

        {/* Bottom Row: 3 Staggered StatLgCard Components */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginTop: 48 }}
          >
            <StatLgCard {...INFERA_STATS_CARDS[2]} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <StatLgCard {...INFERA_STATS_CARDS[3]} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginTop: 84 }}
          >
            <StatLgCard {...INFERA_STATS_CARDS[4]} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 11. TESTIMONIALS SECTION (Matches 181837.png)
// ============================================================================
export const TestimonialsSection: React.FC<SectionActionProps> = ({ onPrimaryAction }) => {
  const repeatedTestimonials = [...INFERA_TESTIMONIALS, ...INFERA_TESTIMONIALS];

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        padding: '180px 0',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Full-Bleed Mountain Meadow Background */}
      <img
        src={FRAMER_IMAGES.testimonialsBgMeadow}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Top & Bottom White Gradient Fades */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 180,
          background: 'linear-gradient(0deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 2-Column Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1260,
          margin: '0 auto 56px',
          padding: '0 30px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 30,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <PreTitle variant="Default" title="Testimoni" />
          <h2
            style={{
              fontFamily: HEADING_FONT,
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 600,
              lineHeight: 1.12,
              color: '#1d1d1d',
              margin: 0,
              maxWidth: 520,
            }}
          >
            Dipercaya oleh auditor & verifikator modern
          </h2>

          {/* 3 ListItem Feature Pills with Vertical Dividers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 22,
              marginTop: 8,
            }}
          >
            <ListItem
              variant="Fit"
              icon={FRAMER_IMAGES.iconStarYellow}
              title="4.9 / 5 Peringkat Rata-Rata"
              color="rgb(29, 29, 29)"
            />
            <div style={{ width: 1, height: 20, backgroundColor: '#dde5ed' }} />
            <ListItem
              variant="Fit"
              icon={FRAMER_IMAGES.iconChatGreen}
              title="Ulasan Pengguna Terverifikasi"
              color="rgb(29, 29, 29)"
            />
            <div style={{ width: 1, height: 20, backgroundColor: '#dde5ed' }} />
            <ListItem
              variant="Fit"
              icon={FRAMER_IMAGES.iconThumbBlue}
              title="98% Kepuasan Verifikator"
              color="rgb(29, 29, 29)"
            />
          </div>
        </div>

        <ButtonIcon variant="Dark" title="Mulai Sekarang" onClick={onPrimaryAction} />
      </div>

      {/* Horizontal Marquee of TestimonialItem Components */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          overflow: 'hidden',
          padding: '10px 0',
        }}
      >
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 24,
            width: 'max-content',
            paddingLeft: 30,
          }}
        >
          {repeatedTestimonials.map((item, idx) => (
            <div key={idx} style={{ flex: 'none', width: 380 }}>
              <TestimonialItem
                variant="Desktop"
                name={item.name}
                jobTitle={item.jobTitle}
                content={item.content}
                avatar={item.avatar}
                star={FRAMER_IMAGES.ratingFiveStars}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// 12. SUBSCRIPTION PLANS / PRICING SECTION (Matches 181848.png)
// ============================================================================
export const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      style={{
        width: '100%',
        padding: '0 0 180px',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '0 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 50,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 14,
            maxWidth: 560,
          }}
        >
          <PreTitle variant="Default" title="Skema Berlangganan" />
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
            Skema fleksibel untuk setiap kebutuhan pengawasan
          </h2>
        </div>

        <div style={{ width: '100%' }}>
          <PricingItem variant="Default" style={{ width: '100%' }} />
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 13. FAQS SECTION (Matches 181858.png)
// ============================================================================
export const FaqSection: React.FC<SectionActionProps> = ({ onPrimaryAction }) => {
  return (
    <section
      id="faq"
      style={{
        width: '100%',
        padding: '0 0 100px',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: '0 30px',
        }}
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-12"
          style={{
            gap: 56,
            alignItems: 'start',
          }}
        >
          {/* Left Column: H2 + Description + FaqsCta */}
          <div
            className="lg:col-span-5"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 20,
            }}
          >
            <h2
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 'clamp(32px, 3.8vw, 48px)',
                fontWeight: 600,
                lineHeight: 1.12,
                color: '#1d1d1d',
                margin: 0,
              }}
            >
              Pertanyaan yang sering diajukan
            </h2>
            <p
              style={{
                fontFamily: BODY_FONT,
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.4,
                color: '#4d585f',
                margin: 0,
                maxWidth: 380,
              }}
            >
              Jawaban cepat untuk membantu Anda memahami cara kerja platform kami.
            </p>

            <div
              onClick={onPrimaryAction}
              style={{
                width: '100%',
                marginTop: 12,
                cursor: 'pointer',
              }}
            >
              <FaqsCta variant="Desktop" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Right Column: 5 Accordion Components */}
          <div
            className="lg:col-span-7"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
            }}
          >
            {INFERA_FAQS.map((faq, idx) => (
              <Accordion
                key={idx}
                variant={faq.variant}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
