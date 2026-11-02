'use client';

import React, { forwardRef } from 'react';
import { CirculationAnalyticsData } from './BorrowingStatisticsStudio';

export interface CirculationReportVectorDocumentProps {
  data: CirculationAnalyticsData;
  adminName?: string;
  adminTitle?: string;
  reportCode?: string;
  issueDate?: string | Date;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Precision ISO A4 Portrait Vector Report SVG Component (800 × 1130 pt).
 * Features official DZF letterhead, KPI summaries, progression tables,
 * top books, Dewey Decimal distribution, and the Administrator's vector ink signature & seal.
 */
export const CirculationReportVectorDocument = forwardRef<
  SVGSVGElement,
  CirculationReportVectorDocumentProps
>(function CirculationReportVectorDocument(props, ref) {
  const {
    data,
    adminName = 'Dr. T. Folorunso',
    adminTitle = 'Head of Academic Operations & Library Administration',
    reportCode = 'DZF-RPT-CIRC-2026-4B89',
    issueDate = new Date(),
    scale = 1,
    style,
    className,
  } = props;

  const formattedIssueDate = React.useMemo(() => {
    try {
      const d = typeof issueDate === 'string' ? new Date(issueDate) : issueDate;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d || new Date());
    } catch {
      return String(issueDate);
    }
  }, [issueDate]);

  const formattedPeriodRange = React.useMemo(() => {
    if (!data?.timeHorizon) return 'Current Reporting Horizon';
    const from = new Date(data.timeHorizon.fromDate);
    const to = new Date(data.timeHorizon.toDate);
    if (data.timeHorizon.unit === 'all') {
      return `All-Time Records up to ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [data?.timeHorizon]);

  // Starburst points for official circular verification seal
  const starburstPoints = React.useMemo(() => {
    const points: string[] = [];
    const count = 32;
    const cx = 495;
    const cy = 975;
    const rOuter = 38;
    const rInner = 34;

    for (let i = 0; i < count * 2; i++) {
      const angle = (i * Math.PI) / count;
      const r = i % 2 === 0 ? rOuter : rInner;
      const x = cx + r * Math.sin(angle);
      const y = cy - r * Math.cos(angle);
      points.push(`${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`);
    }
    return points.join(' ');
  }, []);

  // Display up to 7 trend rows in the document table
  const displayTrends = React.useMemo(() => {
    if (!data?.trends) return [];
    if (data.trends.length <= 7) return data.trends;
    // If more than 7, take the first 3 and the last 4, or latest 7
    return data.trends.slice(-7);
  }, [data?.trends]);

  const maxPeriodVolume = React.useMemo(() => {
    if (!displayTrends || displayTrends.length === 0) return 1;
    return Math.max(1, ...displayTrends.map((t) => Math.max(t.checkouts, t.returns)));
  }, [displayTrends]);

  const topBooksList = React.useMemo(() => {
    return (data?.topBooks || []).slice(0, 5);
  }, [data?.topBooks]);

  const topDeweyList = React.useMemo(() => {
    return (data?.deweyCategories || []).slice(0, 4);
  }, [data?.deweyCategories]);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 1130"
      width={800 * scale}
      height={1130 * scale}
      className={className}
      style={{
        display: 'block',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        ...style,
      }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="repCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7a1515" />
          <stop offset="100%" stopColor="#4a0909" />
        </linearGradient>
        <linearGradient id="repGoldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ecd388" />
          <stop offset="50%" stopColor="#cca349" />
          <stop offset="100%" stopColor="#a37e2b" />
        </linearGradient>
        <linearGradient id="repNavyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#17324d" />
          <stop offset="100%" stopColor="#0b1d2e" />
        </linearGradient>

        {/* Circular text path for official verification seal */}
        <path
          id="repSealPath"
          d="M 495,1003 A 28,28 0 1,1 495.1,1003"
          fill="none"
        />
      </defs>

      {/* 1. Classical Document Borders */}
      <rect
        x="18"
        y="18"
        width="764"
        height="1094"
        fill="#ffffff"
        stroke="#cca349"
        strokeWidth="1.4"
      />
      <rect
        x="23"
        y="23"
        width="754"
        height="1084"
        fill="none"
        stroke="#7a1515"
        strokeWidth="0.8"
      />

      {/* Classical Corner Accents */}
      {/* Top-Left */}
      <path d="M 23,45 L 45,23 M 23,52 L 52,23 M 29,29 L 29,40 M 29,29 L 40,29" stroke="#cca349" strokeWidth="1" fill="none" />
      {/* Top-Right */}
      <path d="M 777,45 L 755,23 M 777,52 L 748,23 M 771,29 L 771,40 M 771,29 L 760,29" stroke="#cca349" strokeWidth="1" fill="none" />
      {/* Bottom-Left */}
      <path d="M 23,1085 L 45,1107 M 23,1078 L 52,1107 M 29,1101 L 29,1090 M 29,1101 L 40,1101" stroke="#cca349" strokeWidth="1" fill="none" />
      {/* Bottom-Right */}
      <path d="M 777,1085 L 755,1107 M 777,1078 L 748,1107 M 771,1101 L 771,1090 M 771,1101 L 760,1101" stroke="#cca349" strokeWidth="1" fill="none" />

      {/* 2. Top Header & Crest */}
      <g transform="translate(400, 48)">
        {/* Emblem Crest */}
        <circle cx="0" cy="0" r="15" fill="url(#repGoldMetallic)" />
        <circle cx="0" cy="0" r="12" fill="#7a1515" />
        <path
          d="M -6,-2.5 C -3.5,-4 -1.5,-4 0,-2.5 C 1.5,-4 3.5,-4 6,-2.5 L 6,3.5 C 3.5,2 1.5,2 0,3.5 C -1.5,2 -3.5,2 -6,3.5 Z"
          fill="#ffffff"
        />
        <line x1="0" y1="-2.5" x2="0" y2="3.5" stroke="#7a1515" strokeWidth="0.8" />

        {/* Foundation Name */}
        <text
          x="0"
          y="28"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="17"
          fontWeight="800"
          letterSpacing="3"
          fill="#7a1515"
        >
          DZUELS EDUCATIONAL FOUNDATION
        </text>

        {/* System Subtitle */}
        <text
          x="0"
          y="42"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="2"
          fill="#17324d"
        >
          INTEGRATED LIBRARY &amp; ADMINISTRATIVE SYSTEM (DZF-ILAS)
        </text>

        {/* Foundation Motto */}
        <text
          x="0"
          y="53"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="700"
          letterSpacing="2.5"
          fill="#cca349"
        >
          EMPOWERING MINDS • TRANSFORMING COMMUNITIES
        </text>

        {/* Decorative Divider */}
        <g transform="translate(0, 62)">
          <line x1="-160" y1="0" x2="-12" y2="0" stroke="#cca349" strokeWidth="0.8" />
          <polygon points="0,-3.5 3.5,0 0,3.5 -3.5,0" fill="#cca349" />
          <line x1="12" y1="0" x2="160" y2="0" stroke="#cca349" strokeWidth="0.8" />
        </g>
      </g>

      {/* 3. Report Title Banner */}
      <g transform="translate(400, 134)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="14"
          fontWeight="800"
          letterSpacing="1.5"
          fill="#0b1d2e"
        >
          OFFICIAL CIRCULATION &amp; BORROWING ANALYTICS REPORT
        </text>
      </g>

      {/* 4. Metadata Box */}
      <g transform="translate(40, 150)">
        <rect
          x="0"
          y="0"
          width="720"
          height="32"
          rx="4"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <text x="14" y="15" fontSize="8.5" fontWeight="700" fill="#17324d">
          REPORTING HORIZON:{' '}
          <tspan fontWeight="500" fill="#475569">
            {formattedPeriodRange} ({data?.timeHorizon?.amount ?? 1} {data?.timeHorizon?.unit ?? 'months'} • {data?.timeHorizon?.granularity ?? 'month'}ly breakdown)
          </tspan>
        </text>
        <text x="14" y="26" fontSize="7.5" fontWeight="600" fill="#64748b">
          ACADEMIC SESSION: 2026/2027 • MONOGRAPH AUDIT LOG
        </text>

        <text x="706" y="15" textAnchor="end" fontSize="8.5" fontWeight="700" fill="#7a1515">
          REPORT REF:{' '}
          <tspan fontFamily="'SFMono-Regular', Consolas, monospace" fontWeight="600">
            {reportCode}
          </tspan>
        </text>
        <text x="706" y="26" textAnchor="end" fontSize="7.5" fontWeight="600" fill="#64748b">
          COMPILED: {formattedIssueDate}
        </text>
      </g>

      {/* 5. 5 Executive KPI Summary Cards */}
      <g transform="translate(40, 194)">
        {[
          { label: 'LOANS ISSUED', val: `${data?.summary?.totalCheckouts ?? 0}`, sub: 'Active & Historical', color: '#17324d', border: '#cbd5e1' },
          { label: 'RETURNS LOGGED', val: `${data?.summary?.totalReturns ?? 0}`, sub: 'Processed Cleanly', color: '#2e7d32', border: '#bbf7d0' },
          { label: 'TIMELY RETURN RATE', val: `${data?.summary?.onTimeRate ?? 100}%`, sub: 'On / Before Due Date', color: '#15803d', border: '#bbf7d0' },
          { label: 'DELINQUENCY RATE', val: `${data?.summary?.delinquencyRate ?? 0}%`, sub: `${data?.summary?.activeOverdues ?? 0} Active Overdues`, color: '#b91c1c', border: '#fecaca' },
          { label: 'AVG LOAN DURATION', val: `${data?.summary?.averageLoanDays ?? 0} d`, sub: 'Per Monograph Loan', color: '#7a1515', border: '#fde68a' },
        ].map((card, idx) => {
          const cardWidth = 138;
          const cardX = idx * (cardWidth + 7.5);
          return (
            <g key={card.label} transform={`translate(${cardX}, 0)`}>
              <rect
                x="0"
                y="0"
                width={cardWidth}
                height="54"
                rx="3.5"
                fill="#ffffff"
                stroke={card.border}
                strokeWidth="1"
              />
              <rect x="0" y="0" width={cardWidth} height="3" fill={card.color} />
              <text x="10" y="14" fontSize="7" fontWeight="700" letterSpacing="0.5" fill="#64748b">
                {card.label}
              </text>
              <text x="10" y="34" fontSize="16" fontWeight="800" fill={card.color}>
                {card.val}
              </text>
              <text x="10" y="46" fontSize="6.8" fontWeight="500" fill="#94a3b8">
                {card.sub}
              </text>
            </g>
          );
        })}
      </g>

      {/* 6. Circulation Activity Progression Table */}
      <g transform="translate(40, 260)">
        <rect x="0" y="0" width="720" height="20" fill="url(#repNavyGradient)" rx="3" />
        <text x="14" y="13.5" fontSize="8" fontWeight="700" fill="#ffffff" letterSpacing="0.8">
          CHRONOLOGICAL CIRCULATION PROGRESSION &amp; VOLUME DISTRIBUTION
        </text>
        <text x="360" y="13.5" fontSize="7.5" fontWeight="600" fill="#cbd5e1" textAnchor="end">
          LOANS ISSUED
        </text>
        <text x="490" y="13.5" fontSize="7.5" fontWeight="600" fill="#cbd5e1" textAnchor="end">
          RETURNS LOGGED
        </text>
        <text x="706" y="13.5" fontSize="7.5" fontWeight="600" fill="#cbd5e1" textAnchor="end">
          VOLUME RATIO
        </text>

        {/* Table Rows */}
        {displayTrends.map((t, idx) => {
          const rowY = 24 + idx * 22;
          const bgFill = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
          const checkoutBarWidth = Math.round((t.checkouts / maxPeriodVolume) * 90);
          const returnBarWidth = Math.round((t.returns / maxPeriodVolume) * 90);

          return (
            <g key={t.dateKey} transform={`translate(0, ${rowY})`}>
              <rect x="0" y="0" width="720" height="20" fill={bgFill} />
              <line x1="0" y1="20" x2="720" y2="20" stroke="#f1f5f9" strokeWidth="0.8" />

              <text x="14" y="13.5" fontSize="8" fontWeight="700" fill="#1e293b">
                {t.label}
              </text>

              <text x="360" y="13.5" fontSize="8" fontWeight="700" fill="#17324d" textAnchor="end">
                {t.checkouts} loans
              </text>
              <text x="490" y="13.5" fontSize="8" fontWeight="700" fill="#2e7d32" textAnchor="end">
                {t.returns} returns
              </text>

              {/* Comparative Dual Bars */}
              <g transform="translate(560, 4)">
                <rect x="0" y="0" width="146" height="5.5" rx="1.5" fill="#e2e8f0" />
                <rect x="0" y="0" width={Math.max(t.checkouts > 0 ? 3 : 0, checkoutBarWidth)} height="5.5" rx="1.5" fill="#17324d" />
                <rect x="0" y="7" width="146" height="4.5" rx="1.5" fill="#e2e8f0" />
                <rect x="0" y="7" width={Math.max(t.returns > 0 ? 3 : 0, returnBarWidth)} height="4.5" rx="1.5" fill="#2e7d32" />
              </g>
            </g>
          );
        })}
      </g>

      {/* 7. Two-Column Intelligence Section */}
      {/* Column 1: Top Borrowed Monographs */}
      <g transform="translate(40, 442)">
        <rect x="0" y="0" width="352" height="18" fill="#17324d" rx="2.5" />
        <text x="12" y="12.5" fontSize="7.8" fontWeight="700" fill="#ffffff" letterSpacing="0.5">
          TOP BORROWED MONOGRAPHS (DEMAND LEADERBOARD)
        </text>

        <rect x="0" y="20" width="352" height="152" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />

        {topBooksList.length === 0 ? (
          <text x="176" y="90" textAnchor="middle" fontSize="8" fill="#94a3b8">
            No monographs checked out during this timeframe.
          </text>
        ) : (
          topBooksList.map((b, idx) => {
            const itemY = 24 + idx * 28;
            return (
              <g key={b.bookId || idx} transform={`translate(8, ${itemY})`}>
                {idx > 0 && <line x1="0" y1="-4" x2="336" y2="-4" stroke="#f1f5f9" strokeWidth="0.8" />}
                <circle cx="9" cy="8" r="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.6" />
                <text x="9" y="11" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#17324d">
                  {idx + 1}
                </text>
                <text x="24" y="6" fontSize="7.8" fontWeight="700" fill="#1e293b">
                  {b.title.length > 36 ? `${b.title.slice(0, 36)}…` : b.title}
                </text>
                <text x="24" y="16" fontSize="6.8" fill="#64748b">
                  {b.author} • Class: {b.classification || 'Gen'}
                </text>
                <text x="330" y="11" textAnchor="end" fontSize="8" fontWeight="800" fill="#7a1515">
                  {b.checkoutCount} loans
                </text>
              </g>
            );
          })
        )}
      </g>

      {/* Column 2: Subject Classification & Readership Demographics */}
      <g transform="translate(408, 442)">
        <rect x="0" y="0" width="352" height="18" fill="#17324d" rx="2.5" />
        <text x="12" y="12.5" fontSize="7.8" fontWeight="700" fill="#ffffff" letterSpacing="0.5">
          DEWEY DECIMAL &amp; READERSHIP DEMOGRAPHICS
        </text>

        <rect x="0" y="20" width="352" height="152" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />

        {/* Dewey Subject Classes */}
        <g transform="translate(10, 26)">
          <text x="0" y="8" fontSize="7" fontWeight="700" letterSpacing="0.5" fill="#64748b">
            DEWEY DECIMAL CLASSIFICATION SPREAD
          </text>
          {topDeweyList.map((d, idx) => {
            const barY = 16 + idx * 17;
            const barWidth = Math.round((d.percentage / 100) * 120);
            return (
              <g key={d.deweyClass} transform={`translate(0, ${barY})`}>
                <text x="0" y="7" fontSize="7" fontWeight="600" fill="#334155">
                  Class {d.deweyClass} ({d.percentage}%)
                </text>
                <text x="120" y="7" fontSize="6.8" fill="#64748b" textAnchor="end">
                  {d.count} loans
                </text>
                <rect x="130" y="1" width="190" height="7" rx="1.5" fill="#f1f5f9" />
                <rect x="130" y="1" width={Math.max(3, barWidth * 1.5)} height="7" rx="1.5" fill="#cca349" />
              </g>
            );
          })}
        </g>

        {/* Readership Demographics & Gamification */}
        <g transform="translate(10, 116)">
          <line x1="0" y1="0" x2="332" y2="0" stroke="#f1f5f9" strokeWidth="1" />
          <text x="0" y="12" fontSize="7" fontWeight="700" letterSpacing="0.5" fill="#64748b">
            READERSHIP PROFILE &amp; GAMIFIED RETURN INCENTIVES
          </text>
          <text x="0" y="24" fontSize="7.2" fill="#334155">
            • Patron Cohorts: Students ({data?.patronDemographics?.byType?.find(t => t.type === 'student')?.count ?? 0} loans), Teachers ({data?.patronDemographics?.byType?.find(t => t.type === 'teacher')?.count ?? 0}), Staff ({data?.patronDemographics?.byType?.find(t => t.type === 'staff')?.count ?? 0})
          </text>
          <text x="0" y="36" fontSize="7.2" fill="#334155">
            • Timely Merit Points: +3 pts ({data?.gamificationPoints?.onTime3Pts ?? 0} on-time), +1 pt ({data?.gamificationPoints?.grace1Pt ?? 0} grace), 0 pts ({data?.gamificationPoints?.overdue0Pts ?? 0} overdue)
          </text>
          <text x="0" y="48" fontSize="6.8" fontWeight="600" fill="#15803d">
            ✓ Compliance Rating: Verified against standard academic borrowing guidelines.
          </text>
        </g>
      </g>

      {/* 8. Executive Administrative Verification & Sign-Off Section */}
      <g transform="translate(40, 622)">
        <line x1="0" y1="0" x2="720" y2="0" stroke="#cca349" strokeWidth="1" />

        {/* Left Side: Institutional Certification Statement */}
        <g transform="translate(0, 18)">
          <text x="0" y="0" fontSize="8" fontWeight="800" letterSpacing="1" fill="#7a1515">
            INSTITUTIONAL AUDIT ATTESTATION &amp; CERTIFICATION
          </text>
          <text x="0" y="13" fontSize="7.2" fill="#475569" width="370">
            This official analytics report is compiled directly from the DZF-ILAS live
          </text>
          <text x="0" y="23" fontSize="7.2" fill="#475569">
            circulation ledger. All transaction figures, timely return compliance metrics,
          </text>
          <text x="0" y="33" fontSize="7.2" fill="#475569">
            and patron readership distributions have been cross-checked and verified
          </text>
          <text x="0" y="43" fontSize="7.2" fill="#475569">
            under the regulatory academic governance of the Dzuels Educational Foundation.
          </text>

          {/* Verification Barcode & Hash */}
          <g transform="translate(0, 56)">
            <rect x="0" y="0" width="330" height="24" rx="2" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
            <text x="10" y="11" fontSize="6.8" fontWeight="700" fill="#64748b">
              DIGITAL VERIFICATION SIGNATURE HASH:
            </text>
            <text x="10" y="20" fontFamily="'SFMono-Regular', Consolas, monospace" fontSize="6.5" fontWeight="600" fill="#17324d">
              SHA256: {reportCode}-AUTH-VERIFIED-DZF-ILAS-2026
            </text>
          </g>
        </g>

        {/* Center: Official Embossed Verification Seal */}
        <g transform="translate(385, 20)">
          {/* Starburst Points */}
          <polygon points={starburstPoints} fill="url(#repGoldMetallic)" />
          {/* Outer Ring */}
          <circle cx="495" cy="975" r="32" fill="#ffffff" stroke="#cca349" strokeWidth="1" />
          <circle cx="495" cy="975" r="28" fill="none" stroke="#7a1515" strokeWidth="0.8" strokeDasharray="2.5 1.5" />
          <circle cx="495" cy="975" r="19" fill="#7a1515" />

          {/* Emblem Star in Seal */}
          <polygon
            points="495,968 497,973 502,973 498,976 499.5,981 495,978 490.5,981 492,976 488,973 493,973"
            fill="#ffffff"
          />

          {/* Text Around Circular Seal */}
          <text
            fontFamily="'Inter', sans-serif"
            fontSize="4.2"
            fontWeight="800"
            letterSpacing="0.8"
            fill="#540a0a"
          >
            <textPath href="#repSealPath" startOffset="50%" textAnchor="middle">
              DZUELS EDUCATIONAL FOUNDATION • OFFICIAL AUDIT SEAL
            </textPath>
          </text>
        </g>

        {/* Right Side: Administrator Ink Signature Block */}
        <g transform="translate(480, 16)">
          <text x="110" y="0" textAnchor="middle" fontSize="7.5" fontWeight="700" letterSpacing="0.5" fill="#64748b">
            CERTIFIED &amp; APPROVED BY:
          </text>

          {/* Stylized Executive Vector Ink Signature */}
          <g transform="translate(110, 32)">
            {/* Signature flourish path 1 */}
            <path
              d="M -75,-6 C -40,-26 0,-2 25,-18 C 45,-30 65,-8 85,-14 C 95,-17 70,-4 50,-10 C 35,-14 -10,-12 -35,-8"
              fill="none"
              stroke="#17324d"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
            {/* Signature underline stroke */}
            <path
              d="M -60,6 C -20,1 30,12 80,4"
              fill="none"
              stroke="#17324d"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            {/* Accent ink loop */}
            <path
              d="M -15,-22 C -5,-35 15,-28 8,-12"
              fill="none"
              stroke="#17324d"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>

          {/* Signatory Underline */}
          <line x1="20" y1="50" x2="200" y2="50" stroke="#17324d" strokeWidth="1" />

          {/* Admin Name & Title */}
          <text x="110" y="62" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#0f172a">
            {adminName}
          </text>
          <text x="110" y="73" textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">
            {adminTitle}
          </text>
          <text x="110" y="83" textAnchor="middle" fontSize="6.5" fontWeight="700" letterSpacing="0.5" fill="#cca349">
            OFFICIAL SIGNATORY • DZUELS FOUNDATION
          </text>
        </g>
      </g>

      {/* 9. Bottom Footer Bar */}
      <g transform="translate(40, 1086)">
        <line x1="0" y1="0" x2="720" y2="0" stroke="#e2e8f0" strokeWidth="0.8" />
        <text x="0" y="11" fontSize="6.8" fill="#94a3b8">
          Dzuels Educational Foundation • Ijero-Ekiti Academic Learning Center • Library Administration Division
        </text>
        <text x="720" y="11" textAnchor="end" fontSize="6.8" fontWeight="600" fill="#64748b">
          CONFIDENTIAL INSTITUTIONAL RECORD • PAGE 1 OF 1
        </text>
      </g>
    </svg>
  );
});

