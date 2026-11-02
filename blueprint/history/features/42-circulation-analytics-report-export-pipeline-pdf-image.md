# Feature 42: Circulation Analytics Report Export Pipeline (PDF & High-Resolution Image with Admin Signature)

**Type:** Feature
**Status:** verified
**Branch:** feature/42-circulation-analytics-report-export-pipeline-pdf-image
**Build attempt:** 1

## Description

Add official report export capabilities to `/dashboard/circulations` (Borrowing Statistics tab), enabling library staff and administrators to download comprehensive circulation statistics as an official institutional document in both print-ready A4 PDF and crisp PNG image format, complete with official Dzuels Educational Foundation letterhead, reporting horizon metadata, KPI summary cards, borrowing trend tables, top books leaderboard, executive verification seal, and administrative vector ink signature.

## Why

Librarians and foundation executives frequently need to present circulation numbers, readership metrics, and collection demand to board members, school principals, and academic sponsors. Previously, statistics could only be viewed on-screen. This feature allows staff to generate and download authenticated, boardroom-ready reports in one click with the official signature of the administrator and institutional seal.

## Scope & Design Requirements

1. **Official Report Layout & Canvas (`CirculationReportDocument.tsx`):**
   - Formal Dzuels Educational Foundation header with academic crest, title, and institutional motto.
   - Report Metadata: Time Horizon (e.g. "Last 3 Months", "All Time", "2 Weeks"), exact date range, generation timestamp, and unique serial code (`DZF-RPT-CIRC-YYYY-XXXX`).
   - Executive KPI Snapshot: Total Loans Issued, Returns Processed, On-Time Return Rate, Delinquency Rate, and Average Loan Duration.
   - Circulation Activity Progression Table: chronological breakdown of checkouts and returns for every month/week in the horizon.
   - Top Borrowed Monographs Leaderboard and Dewey Decimal subject distribution.
   - Executive Signatory Block:
     - Stylized executive vector ink signature graphic.
     - Official circular administrative verification seal stamp: `DZUELS EDUCATIONAL FOUNDATION • LIBRARY ADMINISTRATION • OFFICIAL REPORT`.
     - Administrator Printed Name and Designation (derived from logged-in session user).
     - Official issuance date and verification serial code.

2. **Dual-Format Export Pipeline (`reportExport.ts`):**
   - **Download as PDF:** Dedicated print preview / PDF generation using isolated print styling (`@media print`, `@page { size: A4 portrait; margin: 12mm; }`), producing a clean, multipage-safe vector PDF document without navigation chrome.
   - **Download as Image (PNG):** Direct high-resolution (300 DPI / 2x scale) rasterization via HTML5 Canvas and blob download (`circulation-report-<horizon>.png`).

3. **Export Modal in Studio UI (`CirculationExportModal.tsx`):**
   - "Export Report" button in `BorrowingStatisticsStudio.tsx` toolbar.
   - Modal with report preview, signatory customization fields (Admin Name, Role Title), and dual download buttons (`Download PDF` & `Download PNG Image`).

## Build steps

- [x] 1. **Build `CirculationReportDocument` Component with Executive Signatory & Seal**
  - Create `src/components/circulations/CirculationReportDocument.tsx` containing official DZF letterhead, KPI summaries, trend table, top books, Dewey classes, stylized vector ink signature, and gold/crimson verification seal.
  - *Done when:* The component renders a print-perfect, executive-grade circulation report.

- [x] 2. **Build Dual Export Engine (`src/lib/circulations/reportExport.ts`)**
  - Implement `exportReportAsPng` (canvas rasterization at 2x resolution) and `triggerPrintReport` (isolated A4 print pipeline).
  - *Done when:* Both PNG and print-to-PDF functions work reliably in browser.

- [x] 3. **Build `CirculationExportModal.tsx` & Integrate with `BorrowingStatisticsStudio.tsx`**
  - Add "Export Report" button with download icon to the Borrowing Statistics toolbar.
  - Implement `CirculationExportModal` dialog featuring live report preview, signatory name/title editing, and download buttons.
  - *Done when:* Clicking "Export Report" opens modal with current filtered analytics and exports valid PDF and PNG with admin signature.

- [x] 4. **Verify Typecheck and Production Build**
  - Run `npx tsc --noEmit` to verify zero TypeScript errors.
  - Run `npm run build` to confirm successful compilation.
  - *Done when:* Both commands exit with code 0.

## Verify

1. Open `/dashboard/circulations` and click the **Borrowing Statistics** tab.
2. Select **3 Mos** and click **Export Report**.
3. Verify the modal opens with the official DZF report preview, showing the 3-month metrics and executive signature block.
4. Click **Download PNG Image**: confirm a high-resolution PNG image downloads cleanly.
5. Click **Download PDF**: confirm browser print dialog opens with A4 formatted report, official letterhead, tables, seal, and admin signature.

