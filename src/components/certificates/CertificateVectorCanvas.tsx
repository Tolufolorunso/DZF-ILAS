'use client';

import React, { forwardRef } from 'react';
import { CertificateTemplateType, ISignatory } from '@/lib/certificates/types';

export interface CertificateVectorCanvasProps {
  certificateCode?: string;
  templateType?: CertificateTemplateType;
  title: string;
  recipientName: string;
  recipientCohort?: string;
  recipientCategory?: string;
  awardDescription: string;
  issueDate?: string | Date;
  primarySignatory?: ISignatory;
  secondarySignatory?: ISignatory;
  goldSealText?: string;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Precision Landscape A4 Vector Certificate SVG Component.
 * Dimensions: 842.25 × 595.5 pt (ISO 216 Landscape A4: 297mm × 210mm).
 */
export const CertificateVectorCanvas = forwardRef<
  SVGSVGElement,
  CertificateVectorCanvasProps
>(function CertificateVectorCanvas(props, ref) {
  const {
    certificateCode = 'DZF-CERT-2026-XXXX',
    title = 'Certificate of Completion',
    recipientName = 'Recipient Full Name',
    recipientCohort,
    recipientCategory,
    awardDescription = 'For outstanding dedication, technical proficiency, and successful completion of the academic program at the Dzuels Educational Foundation.',
    issueDate = new Date(),
    primarySignatory = {
      name: 'Dr. T. Folorunso',
      title: 'Director, Dzuels Educational Foundation',
    },
    secondarySignatory = {
      name: 'Academy Lead',
      title: 'Lead Instructor / Head Librarian',
    },
    goldSealText = 'DZUELS EDUCATIONAL FOUNDATION • OFFICIAL SEAL • 2026',
    scale = 1,
    style,
    className,
  } = props;

  // Format issue date nicely
  const formattedDate = React.useMemo(() => {
    try {
      const d = typeof issueDate === 'string' ? new Date(issueDate) : issueDate;
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(d || new Date());
    } catch {
      return String(issueDate);
    }
  }, [issueDate]);

  // Wrap citation into 2 or 3 lines for elegant presentation
  const citationLines = React.useMemo(() => {
    const words = awardDescription.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > 68) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine) {
      lines.push(currentLine.trim());
    }
    return lines.slice(0, 4);
  }, [awardDescription]);

  // Starburst points for the embossed gold seal medallion
  const starburstPoints = React.useMemo(() => {
    const points: string[] = [];
    const count = 36;
    const cx = 421.125;
    const cy = 472;
    const rOuter = 46;
    const rInner = 41;

    for (let i = 0; i < count * 2; i++) {
      const angle = (i * Math.PI) / count;
      const r = i % 2 === 0 ? rOuter : rInner;
      const x = cx + r * Math.sin(angle);
      const y = cy - r * Math.cos(angle);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 842.25 595.5"
      width={842.25 * scale}
      height={595.5 * scale}
      className={className}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        ...style,
      }}
    >
      <defs>
        {/* Parchment background gradient */}
        <linearGradient id="dzfParchment" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#fbfaf8" />
          <stop offset="100%" stopColor="#f7f4ee" />
        </linearGradient>

        {/* Gold foil metallic gradient */}
        <linearGradient id="dzfGoldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cca349" />
          <stop offset="35%" stopColor="#f7dd93" />
          <stop offset="65%" stopColor="#cca349" />
          <stop offset="100%" stopColor="#9e7b2d" />
        </linearGradient>

        {/* Soft gold fill gradient */}
        <linearGradient id="dzfGoldSoft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="100%" stopColor="#fdf4cf" />
        </linearGradient>

        {/* Deep Crimson gradient */}
        <linearGradient id="dzfCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#981b1b" />
          <stop offset="60%" stopColor="#7a1515" />
          <stop offset="100%" stopColor="#540a0a" />
        </linearGradient>

        {/* Subtle drop shadow filter for seal */}
        <filter id="dzfSealShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#540a0a" floodOpacity="0.25" />
        </filter>

        {/* Circular text path for embossed gold seal */}
        <path
          id="dzfSealPathUpper"
          d="M 388,472 A 33,33 0 1,1 454,472 A 33,33 0 1,1 388,472"
        />
      </defs>

      {/* 1. Base Canvas & Parchment Surface */}
      <rect x="0" y="0" width="842.25" height="595.5" fill="url(#dzfParchment)" />

      {/* 2. Classical Ornate Border Framework */}
      {/* Outer fine border */}
      <rect
        x="18"
        y="18"
        width="806.25"
        height="559.5"
        rx="2"
        fill="none"
        stroke="#e4ddd5"
        strokeWidth="3.5"
      />
      {/* Middle dark crimson accent border */}
      <rect
        x="24.5"
        y="24.5"
        width="793.25"
        height="546.5"
        fill="none"
        stroke="#7a1515"
        strokeWidth="1.2"
        strokeDasharray="6 3"
      />
      {/* Inner hairline gold border */}
      <rect
        x="30"
        y="30"
        width="782.25"
        height="535.5"
        fill="none"
        stroke="#cca349"
        strokeWidth="0.8"
      />

      {/* Corner Rosettes / Classical Ornaments */}
      {/* Top-Left Corner */}
      <g transform="translate(30, 30)">
        <path d="M 0,0 L 28,0 C 28,14 14,28 0,28 Z" fill="#7a1515" opacity="0.9" />
        <circle cx="8" cy="8" r="3.5" fill="#cca349" />
        <path d="M 0,38 L 38,0" stroke="#cca349" strokeWidth="1.2" />
      </g>
      {/* Top-Right Corner */}
      <g transform="translate(812.25, 30)">
        <path d="M 0,0 L -28,0 C -28,14 -14,28 0,28 Z" fill="#7a1515" opacity="0.9" />
        <circle cx="-8" cy="8" r="3.5" fill="#cca349" />
        <path d="M 0,38 L -38,0" stroke="#cca349" strokeWidth="1.2" />
      </g>
      {/* Bottom-Left Corner */}
      <g transform="translate(30, 565.5)">
        <path d="M 0,0 L 28,0 C 28,-14 14,-28 0,-28 Z" fill="#7a1515" opacity="0.9" />
        <circle cx="8" cy="-8" r="3.5" fill="#cca349" />
        <path d="M 0,-38 L 38,0" stroke="#cca349" strokeWidth="1.2" />
      </g>
      {/* Bottom-Right Corner */}
      <g transform="translate(812.25, 565.5)">
        <path d="M 0,0 L -28,0 C -28,-14 -14,-28 0,-28 Z" fill="#7a1515" opacity="0.9" />
        <circle cx="-8" cy="-8" r="3.5" fill="#cca349" />
        <path d="M 0,-38 L -38,0" stroke="#cca349" strokeWidth="1.2" />
      </g>

      {/* 3. Centered Watermark Initial ("D") */}
      <text
        x="421.125"
        y="350"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="290"
        fontWeight="800"
        fill="#7a1515"
        opacity="0.045"
        style={{ userSelect: 'none' }}
      >
        D
      </text>

      {/* 4. Top Header & Foundation Crest */}
      <g transform="translate(421.125, 58)">
        {/* Foundation Open Book & Laurel Emblem */}
        <g transform="translate(0, 0)">
          {/* Central crest emblem */}
          <circle cx="0" cy="0" r="16" fill="url(#dzfGoldMetallic)" />
          <circle cx="0" cy="0" r="13" fill="#7a1515" />
          {/* Stylized open book icon in crest */}
          <path
            d="M -7,-3 C -4,-5 -2,-5 0,-3 C 2,-5 4,-5 7,-3 L 7,4 C 4,2 2,2 0,4 C -2,2 -4,2 -7,4 Z"
            fill="#ffffff"
          />
          <line x1="0" y1="-3" x2="0" y2="4" stroke="#7a1515" strokeWidth="0.8" />
        </g>

        {/* Foundation Name Header */}
        <text
          x="0"
          y="34"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="21"
          fontWeight="800"
          letterSpacing="4"
          fill="#7a1515"
        >
          DZUELS EDUCATIONAL FOUNDATION
        </text>

        {/* Foundation Motto */}
        <text
          x="0"
          y="49"
          textAnchor="middle"
          fontFamily="'Inter', -apple-system, sans-serif"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="3"
          fill="#1d4670"
        >
          EMPOWERING MINDS • TRANSFORMING COMMUNITIES
        </text>

        {/* Classical decorative horizontal separator with diamond */}
        <g transform="translate(0, 60)">
          <line x1="-160" y1="0" x2="-14" y2="0" stroke="#cca349" strokeWidth="1" />
          <polygon points="0,-4 4,0 0,4 -4,0" fill="#cca349" />
          <circle cx="-7" cy="0" r="1.5" fill="#7a1515" />
          <circle cx="7" cy="0" r="1.5" fill="#7a1515" />
          <line x1="14" y1="0" x2="160" y2="0" stroke="#cca349" strokeWidth="1" />
        </g>
      </g>

      {/* 5. Award Presentation Kicker */}
      <text
        x="421.125"
        y="148"
        textAnchor="middle"
        fontFamily="'Outfit', 'Inter', sans-serif"
        fontSize="10"
        fontWeight="800"
        letterSpacing="4.5"
        fill="#cca349"
      >
        THIS IS PROUDLY PRESENTED TO
      </text>

      {/* 6. Recipient Name Header */}
      <g transform="translate(421.125, 198)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="32"
          fontWeight="800"
          fontStyle="italic"
          fill="#2b2b2b"
        >
          {recipientName}
        </text>
        {/* Decorative flourish underline */}
        <path
          d="M -180,12 C -80,18 80,18 180,12 C 90,14 -90,14 -180,12 Z"
          fill="#cca349"
          opacity="0.8"
        />
        <circle cx="0" cy="13" r="2.5" fill="#7a1515" />
      </g>

      {/* 7. Award Title Banner */}
      <g transform="translate(421.125, 244)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="22"
          fontWeight="800"
          letterSpacing="1.8"
          fill="#7a1515"
        >
          {title}
        </text>

        {/* Optional Cohort / Category Subtitle */}
        {(recipientCohort || recipientCategory) && (
          <text
            x="0"
            y="17"
            textAnchor="middle"
            fontFamily="'Inter', sans-serif"
            fontSize="10"
            fontWeight="600"
            letterSpacing="1.5"
            fill="#1d4670"
          >
            {[
              recipientCohort ? `COHORT: ${recipientCohort}` : null,
              recipientCategory ? `CATEGORY: ${recipientCategory}` : null,
            ]
              .filter(Boolean)
              .join(' • ')}
          </text>
        )}
      </g>

      {/* 8. Award Citation Description */}
      <g transform="translate(421.125, 292)">
        {citationLines.map((line, idx) => (
          <text
            key={idx}
            x="0"
            y={idx * 16}
            textAnchor="middle"
            fontFamily="'Inter', -apple-system, sans-serif"
            fontSize="11"
            fontWeight="400"
            fill="#374151"
            letterSpacing="0.2"
          >
            {line}
          </text>
        ))}
      </g>

      {/* 9. Classical Signatories & Central Gold Foil Seal */}

      {/* Primary Signatory (Left) */}
      <g transform="translate(180, 482)">
        {/* Stylized vector ink signature stroke */}
        <path
          d="M -50,-16 C -20,-32 10,-8 -10,-12 C -25,-16 5,-36 30,-14 C 40,-6 65,-22 80,-14"
          fill="none"
          stroke="#1d4670"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        {/* Signatory line */}
        <line x1="-80" y1="0" x2="80" y2="0" stroke="#1d4670" strokeWidth="1" />
        <text
          x="0"
          y="15"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="11.5"
          fontWeight="700"
          fill="#1f2937"
        >
          {primarySignatory.name}
        </text>
        <text
          x="0"
          y="28"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontSize="9"
          fontWeight="500"
          fill="#6b7280"
        >
          {primarySignatory.title}
        </text>
      </g>

      {/* Secondary Signatory (Right) */}
      <g transform="translate(662.25, 482)">
        {/* Stylized vector ink signature stroke */}
        <path
          d="M -45,-14 C -15,-28 15,-10 -5,-14 C -18,-18 12,-34 35,-12 C 45,-4 70,-18 85,-12"
          fill="none"
          stroke="#1d4670"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        {/* Signatory line */}
        <line x1="-80" y1="0" x2="80" y2="0" stroke="#1d4670" strokeWidth="1" />
        <text
          x="0"
          y="15"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="11.5"
          fontWeight="700"
          fill="#1f2937"
        >
          {secondarySignatory.name}
        </text>
        <text
          x="0"
          y="28"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontSize="9"
          fontWeight="500"
          fill="#6b7280"
        >
          {secondarySignatory.title}
        </text>
      </g>

      {/* Center Embossed Gold Foil Seal Medallion */}
      <g transform="translate(421.125, 472)" filter="url(#dzfSealShadow)">
        {/* Draped Ribbon Tails */}
        <path
          d="M -16,28 L -24,68 L -14,62 L -4,68 L -4,32 Z"
          fill="url(#dzfCrimson)"
        />
        <path
          d="M 4,32 L 4,68 L 14,62 L 24,68 L 16,28 Z"
          fill="url(#dzfCrimson)"
        />

        {/* Starburst outer border */}
        <polygon points={starburstPoints} fill="url(#dzfGoldMetallic)" />

        {/* Outer and inner concentric rings */}
        <circle cx="0" cy="0" r="39" fill="url(#dzfGoldSoft)" stroke="#cca349" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="34" fill="none" stroke="#7a1515" strokeWidth="0.8" strokeDasharray="3 1.5" />
        <circle cx="0" cy="0" r="23" fill="url(#dzfGoldMetallic)" />
        <circle cx="0" cy="0" r="21" fill="#7a1515" />

        {/* Center seal star */}
        <polygon
          points="0,-9 2.5,-3 8.5,-3 3.8,1 5.5,7 0,3.5 -5.5,7 -3.8,1 -8.5,-3 -2.5,-3"
          fill="#ffffff"
        />

        {/* Circular text around medallion */}
        <text
          fontFamily="'Inter', sans-serif"
          fontSize="5.2"
          fontWeight="800"
          letterSpacing="1.2"
          fill="#540a0a"
        >
          <textPath href="#dzfSealPathUpper" startOffset="50%" textAnchor="middle">
            {goldSealText.slice(0, 48)}
          </textPath>
        </text>
      </g>

      {/* 10. Verification Footer & Identification */}
      <g transform="translate(421.125, 548)">
        {/* Certificate serial code */}
        <text
          x="-350"
          y="0"
          textAnchor="start"
          fontFamily="'SFMono-Regular', Consolas, monospace"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="1"
          fill="#7a1515"
        >
          SERIAL: {certificateCode}
        </text>

        {/* Verification URL notice */}
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontSize="8"
          fontWeight="500"
          letterSpacing="0.8"
          fill="#6b7280"
        >
          OFFICIAL RECORD • VERIFY ONLINE AT DZUELS.ORG/VERIFY
        </text>

        {/* Issue Date */}
        <text
          x="350"
          y="0"
          textAnchor="end"
          fontFamily="'Inter', sans-serif"
          fontSize="8.5"
          fontWeight="600"
          fill="#4b5563"
        >
          ISSUED: {formattedDate}
        </text>
      </g>
    </svg>
  );
});

export default CertificateVectorCanvas;
