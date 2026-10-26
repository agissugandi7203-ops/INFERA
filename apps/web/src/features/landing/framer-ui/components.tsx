import React from 'react';
import './tokens.css';
import './_responsive-runtime.css';

import LayoutIsland from './utils/LayoutIsland';
import ResponsiveWrapper from './utils/ResponsiveWrapper';
import FramerEffects from './utils/FramerEffects';
import useStripFramerStyles from './utils/useStripFramerStyles';

import RawButton from './Button.js';
import RawButtonIcon from './ButtonIcon.js';
import RawBadge from './Badge.js';
import RawAccordion from './Accordion.js';
import RawAlertCard from './AlertCard.js';
import RawOverviewCard from './OverviewCard.js';
import RawUseCaseCard from './UseCaseCard.js';
import RawFounderCard from './FounderCard.js';
import RawStatItem from './StatItem.js';
import RawStatLgCard from './StatLgCard.js';
import RawTestimonialItem from './TestimonialItem.js';
import RawClientLogo from './ClientLogo.js';
import RawIntegrationIcon from './IntegrationIcon.js';
import RawWorkflowSteps from './WorkflowSteps.js';
import RawPricingItem from './PricingItem.js';
import RawFaqsCta from './FaqsCta.js';
import RawListItem from './ListItem.js';
import RawPreTitle from './PreTitle.js';
import RawBeforeAfter from './BeforeAfter.js';
import RawFeatureBoxTitle from './FeatureBoxTitle.js';
import RawBlurgradientProd from './BlurgradientProd.js';
import RawSmoothscrollProd from './SmoothscrollProd.js';

export {
  LayoutIsland,
  ResponsiveWrapper,
  FramerEffects,
  useStripFramerStyles,
  RawButton,
  RawButtonIcon,
  RawBadge,
  RawAccordion,
  RawAlertCard,
  RawOverviewCard,
  RawUseCaseCard,
  RawFounderCard,
  RawStatItem,
  RawStatLgCard,
  RawTestimonialItem,
  RawClientLogo,
  RawIntegrationIcon,
  RawWorkflowSteps,
  RawPricingItem,
  RawFaqsCta,
  RawListItem,
  RawPreTitle,
  RawBeforeAfter,
  RawFeatureBoxTitle,
  RawBlurgradientProd,
  RawSmoothscrollProd,
};

// ============================================================================
// TYPED FRAMER UI KIT WRAPPERS (ISOLATED VIA LAYOUTISLAND)
// ============================================================================

export function Button({
  variant = 'Default',
  title = 'Mulai Audit Klaim',
  link,
  newTab = false,
  onClick,
  style,
  className,
  ...rest
}: {
  variant?: 'Default' | 'Dark' | 'SM' | 'Default - Phone' | 'Dark - Phone' | string;
  title?: string;
  link?: string;
  newTab?: boolean;
  onClick?: (...args: any[]) => any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawButton as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        ziCnPH11n={title}
        gayKxTIvB={link}
        uYcQ8rJi0={newTab}
        uo_mEDBYl={onClick}
        style={style}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function ButtonIcon({
  variant = 'Default',
  title = 'Buka Dashboard INFERA',
  icon,
  link,
  newTab = false,
  onClick,
  style,
  className,
  ...rest
}: {
  variant?:
    | 'Default'
    | 'Dark'
    | 'Nav Button'
    | 'Right Icon'
    | 'Default - Phone'
    | 'Dark - Phone'
    | 'Nav Button - Phone'
    | 'Right Icon - Phone'
    | string;
  title?: string;
  icon?: any;
  link?: string;
  newTab?: boolean;
  onClick?: (...args: any[]) => any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawButtonIcon as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        ziCnPH11n={title}
        SjeXzLrTu={icon}
        gayKxTIvB={link}
        uYcQ8rJi0={newTab}
        uo_mEDBYl={onClick}
        style={style}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function Badge({
  variant = 'Default',
  title = 'Skor Risiko Real-Time',
  titleColor,
  style,
  className,
  ...rest
}: {
  variant?: 'Default' | 'SM' | 'White' | string;
  title?: string;
  titleColor?: string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawBadge as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        h3thwb3uh={title}
        rhGiDGRBu={titleColor}
        style={style}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function PreTitle({
  variant = 'Default',
  title = 'INFERA • BPJS Kesehatan',
  style,
  className,
  ...rest
}: {
  variant?: 'Default' | 'White' | 'Dark' | string;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawPreTitle as any;
  return (
    <LayoutIsland>
      <Raw variant={variant} BSyxhptbW={title} style={style} className={className} {...rest} />
    </LayoutIsland>
  );
}

export function ListItem({
  variant = 'Default',
  title = 'Deteksi Anomali Klaim Real-Time',
  icon,
  color,
  style,
  className,
  ...rest
}: {
  variant?: 'Default' | 'Fit' | 'LG' | string;
  title?: string;
  icon?: any;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawListItem as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        GmSs_KKEi={title}
        XMCDOSojK={icon}
        uoP_rcx83={color}
        style={style}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function Accordion({
  variant = 'Close',
  question = 'Bagaimana INFERA mendeteksi kecurangan peserta JKN?',
  answer = 'INFERA menganalisis telemetri klaim SEP VClaim dan RME SATUSEHAT menggunakan 4 algoritma deterministik dan Hybrid RAG regulasi.',
  style,
  className,
  ...rest
}: {
  variant?: 'Close' | 'Open' | 'White Close' | 'White Open' | string;
  question?: string;
  answer?: string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawAccordion as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        Cem09IVM0={question}
        NV3c2dGIv={answer}
        style={{ width: '100%', ...style }}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function StatItem({
  variant = 'Default',
  title = '100%',
  description = 'Akurasi Grounding Regulasi JKN',
  titleColor,
  descriptionColor,
  style,
  className,
  ...rest
}: {
  variant?: 'Default' | 'SM' | string;
  title?: string;
  description?: string;
  titleColor?: string;
  descriptionColor?: string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawStatItem as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        E3Uhffy5v={title}
        MhtrAXupB={description}
        dISwWaRCD={titleColor}
        JJcauvw8J={descriptionColor}
        style={style}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function StatLgCard({
  variant = 'Default',
  preTitle = 'Peserta Diaudit',
  title = '42.180+',
  description = 'Pemantauan berkelanjutan klaim FKTP & FKRTL di seluruh Indonesia.',
  icon,
  style,
  className,
  ...rest
}: {
  variant?: 'Default' | 'Dark' | 'Primary' | 'White' | string;
  preTitle?: string;
  title?: string;
  description?: string;
  icon?: any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawStatLgCard as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        V1x3EoHFX={preTitle}
        NDcYsg5oi={title}
        t_H7Fx64z={description}
        XZfwo1a6Z={icon}
        style={{ width: 280, height: 280, ...style }}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function OverviewCard({
  variant = 'Desktop',
  content = 'Satukan data SEP VClaim, P-Care, PRB Apotek, dan RME SATUSEHAT dalam satu tampilan terintegrasi.',
  icon,
  style,
  className,
  ...rest
}: {
  variant?: 'Desktop' | 'Tablet' | 'Phone' | string;
  content?: string;
  icon?: any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawOverviewCard as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        RRYAQG22b={content}
        EzLGQv3FE={icon}
        style={{ width: '100%', ...style }}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function UseCaseCard({
  variant = 'Desktop',
  title = 'Tim Pencegahan Kecurangan (PK-JKN)',
  description = 'Identifikasi dini pola Doctor Shopping, Impossible Travel, dan indikasi jual-beli obat PRB sebelum klaim dibayarkan.',
  statsTitle = '10x Lebih Cepat',
  statsDescription = 'Investigasi Kasus Anomali Klaim',
  bgImage,
  style,
  className,
  ...rest
}: {
  variant?: 'Desktop' | 'Phone' | string;
  title?: string;
  description?: string;
  statsTitle?: string;
  statsDescription?: string;
  bgImage?: any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawUseCaseCard as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        i8U_p183z={title}
        goAKBmqwK={description}
        srxxxv2SK={statsTitle}
        pef4eIOYP={statsDescription}
        yZD2OHuAO={bgImage}
        style={{ width: 380, minHeight: 420, ...style }}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function FounderCard({
  content = '"Kami membangun INFERA untuk menghentikan kebocoran Dana Jaminan Sosial melalui deteksi kecurangan peserta berbasis bukti matematis dan kepatuhan regulasi."',
  jobTitle = 'Principal Architect — INFERA Health Risk Intelligence',
  avatar,
  style,
  className,
  ...rest
}: {
  content?: string;
  jobTitle?: string;
  avatar?: any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawFounderCard as any;
  return (
    <LayoutIsland>
      <Raw
        vnUC1BXtk={content}
        CMopBckjJ={jobTitle}
        mpFsFmNXl={avatar}
        style={{ maxWidth: 460, width: '100%', ...style }}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function TestimonialItem({
  variant = 'Desktop',
  name = 'dr. Hendra Wijaya, M.Kes, AAAK',
  jobTitle = 'Ketua Tim PK-JKN & Auditor Medis Klaim',
  content = 'INFERA memangkas waktu verifikasi klaim mencurigakan dari hitungan minggu menjadi kurang dari 30 milidetik lengkap dengan rujukan pasal Permenkes No. 16 Tahun 2019.',
  avatar,
  star,
  padding,
  style,
  className,
  ...rest
}: {
  variant?: 'Desktop' | 'Phone' | string;
  name?: string;
  jobTitle?: string;
  content?: string;
  avatar?: any;
  star?: any;
  padding?: string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawTestimonialItem as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        ltvSVWkDz={name}
        vG_YeqZ3L={jobTitle}
        njvQGMtNX={content}
        c_6S1GWN5={avatar}
        G8YyrnVaW={star}
        lP_2UgiNa={padding}
        style={{ width: 380, minHeight: 280, ...style }}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function WorkflowSteps({
  variant = '01',
  step1Title = 'Ingesti Telemetri SEP VClaim & SATUSEHAT',
  step1Desc = 'Hubungkan aliran klaim FKTP, FKRTL, Apotek PRB, dan RME SATUSEHAT secara terenkripsi.',
  step1Image,
  step2Title = 'Evaluasi 4 Algoritma Matematis & Hybrid RAG',
  step2Desc = 'Mesin deterministik menghitung Haversine Velocity, Doctor Shopping, PRB, & Discordance Klinis dalam < 30ms.',
  step2Image,
  step3Title = 'Mitigasi & Keputusan Verifikator PK-JKN',
  step3Desc = 'Eksekusi penangguhan klaim atau surat klarifikasi dengan dasar hukum Permenkes No. 16/2019.',
  step3Image,
  style,
  className,
  ...rest
}: {
  variant?: '01' | '02' | '03' | '01 - Phone' | '02 - Phone' | '03 - Phone' | string;
  step1Title?: string;
  step1Desc?: string;
  step1Image?: any;
  step2Title?: string;
  step2Desc?: string;
  step2Image?: any;
  step3Title?: string;
  step3Desc?: string;
  step3Image?: any;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}) {
  const Raw = RawWorkflowSteps as any;
  return (
    <LayoutIsland>
      <Raw
        variant={variant}
        ZQ4sDRdMd={step1Title}
        EISrLVa3P={step1Desc}
        uBpkNBsH_={step1Image}
        R7vsr7Eeu={step2Title}
        MY8r9rZB6={step2Desc}
        R3JTbJYVh={step2Image}
        BvPCACdvF={step3Title}
        r5DkSureW={step3Desc}
        gLEnwvWoT={step3Image}
        style={style}
        className={className}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function AlertCard({
  variant = '01',
  style,
  ...rest
}: {
  variant?: '01' | '02' | '03' | string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawAlertCard as any;
  return (
    <LayoutIsland>
      <Raw variant={variant} style={{ width: 280, ...style }} {...rest} />
    </LayoutIsland>
  );
}

export function BeforeAfter({
  variant = 'Before',
  style,
  ...rest
}: {
  variant?: 'Before' | 'After' | 'Before - Phone' | 'After - Phone' | string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawBeforeAfter as any;
  return (
    <LayoutIsland>
      <Raw variant={variant} style={{ width: '100%', maxWidth: 1200, ...style }} {...rest} />
    </LayoutIsland>
  );
}

export function PricingItem({
  variant = 'Default',
  style,
  ...rest
}: {
  variant?: 'Default' | 'Yearly' | 'Default - Tablet' | 'Yearly - Tablet' | 'Default - Phone' | 'Yearly - Phone' | string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawPricingItem as any;
  return (
    <LayoutIsland>
      <Raw variant={variant} style={style} {...rest} />
    </LayoutIsland>
  );
}

export function FaqsCta({
  variant = 'Desktop',
  style,
  ...rest
}: {
  variant?: 'Desktop' | 'Phone' | string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawFaqsCta as any;
  return (
    <LayoutIsland>
      <Raw variant={variant} style={style} {...rest} />
    </LayoutIsland>
  );
}

export function ClientLogo({
  image,
  style,
  ...rest
}: {
  image?: any;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawClientLogo as any;
  return (
    <LayoutIsland>
      <Raw
        zDJH8fw1b={image}
        style={{ width: 104, height: 24, ...style }}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function IntegrationIcon({
  icon,
  image,
  style,
  ...rest
}: {
  icon?: any;
  image?: any;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawIntegrationIcon as any;
  return (
    <LayoutIsland>
      <Raw
        z6AwEa6gl={icon ?? image}
        style={{ width: 80, height: 80, borderRadius: '50%', ...style }}
        {...rest}
      />
    </LayoutIsland>
  );
}

export function FeatureBoxTitle({
  variant = '01',
  style,
  ...rest
}: {
  variant?: '01' | '02' | '03' | string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawFeatureBoxTitle as any;
  return (
    <LayoutIsland>
      <Raw variant={variant} style={{ width: 280, ...style }} {...rest} />
    </LayoutIsland>
  );
}

export function BlurgradientProd(props: {
  blur?: number;
  borderRadius?: string;
  direction?: 'toBottom' | 'toTop' | 'toLeft' | 'toRight' | string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const Raw = RawBlurgradientProd as any;
  return <Raw {...props} />;
}

export function SmoothscrollProd(props: {
  intensity?: number;
  [key: string]: any;
}) {
  const Raw = RawSmoothscrollProd as any;
  return <Raw {...props} />;
}
