# Feature: Xprinter XP-365B Thermal Barcode Studio & Date-Range Bulk Print Pipeline

**From build-plan:** feature 21
**Build attempt:** 1
**Branch:** feature/xprinter-xp-365b-thermal-barcode-studio-date-range-bulk-print-pipeline
**Status:** verified

## Goal

Standardize the 60mm × 40mm (6cm × 4cm) thermal label paper layout for Xprinter XP-365B label printers (Top: "Dzuels Foundation", Middle: Barcode, Bottom: "Name: <firstname>, <Surname>") with strict zero browser margins/headers/footers, and introduce a date-range bulk generation and continuous roll printing pipeline in the patron management dashboard.

## In scope

1. **Standardized 60mm × 40mm Thermal Label Layout (`src/components/patrons/ThermalBarcodeLabel.tsx`):**
   - Exact 3-zone layout:
     - **Top:** "Dzuels Foundation" (bold, centered text).
     - **Middle:** Code128 barcode SVG with human-readable barcode numbers.
     - **Bottom:** "Name: <firstname>, <Surname>" (e.g., `Name: Babatunde, Adeleke`).
   - High-contrast pure monochrome styling optimized for thermal heads (203 DPI) with zero pixel bleeding.
   - Updated `ThermalLabelData` interface supporting separate `firstname` and `surname` fields with backward-compatible `name` fallback.

2. **Zero Browser Margin / Header / Footer CSS (`src/components/patrons/ThermalPrintDialog.tsx`):**
   - Enforce `@page { size: 60mm 40mm; margin: 0mm !important; }` in print stylesheet.
   - Strip browser default headers (page URL, document title, date, page counter).
   - Ensure clean page breaks (`page-break-after: always; break-after: page;`) for continuous multi-label roll printing without blank label skips on Xprinter XP-365B.

3. **Date-Range Query API Support (`src/app/api/patrons/route.ts`):**
   - Support `startDate` and `endDate` query parameters.
   - Filter patrons registered within the range using `registeredDate` or `createdAt` (`$gte: startDate`, `$lte: endDate`).
   - Support `limit` up to 1,000 when queried for bulk printing.

4. **Date-Range Bulk Printing Studio Modal (`src/components/patrons/DateRangePrintModal.tsx`):**
   - Interactive date-range picker (Start Date, End Date) with quick preset buttons (Today, This Week, This Month, Custom).
   - Optional classification filter (All, Student, Teacher, Staff, Guest).
   - Live query trigger fetching all matched patrons within the selected range.
   - Results counter and preview list of patrons ready for printing.
   - Direct handoff into `ThermalPrintDialog` for continuous batch roll printing.

5. **Patron Dashboard Integration (`src/app/dashboard/patrons/PatronListClient.tsx`):**
   - Add "Print by Date Range" button in the page action header.
   - Update single and selected batch printing to use the standardized `Name: <firstname>, <Surname>` format.

## Out of scope

- Direct ESC/POS hardware USB raw socket communication (browser print dialog with zero-margin driver remains standard and cross-platform).
- Changes to monograph catalog labeling (which already uses 60×40mm Dewey Decimal format).
- Alterations to patron membership status, RBAC, or registration validation.

## Build loop

- Step review: `feature` (one review packet after all small implementation steps are complete).
- Checkpoint commits: `disabled`.

## Build steps

- [x] 1. **Update Thermal Label Format:** Redesign `src/components/patrons/ThermalBarcodeLabel.tsx` to match the exact 3-zone format: Top: "Dzuels Foundation", Middle: Barcode, Bottom: "Name: <firstname>, <Surname>".
      *Done when:* Rendered label displays "Dzuels Foundation" at the top, Code128 barcode at the center, and "Name: <firstname>, <Surname>" at the bottom with no extraneous subtitle lines.
- [x] 2. **Refine Print Styles for Xprinter XP-365B:** Update `src/components/patrons/ThermalPrintDialog.tsx` print CSS to guarantee `@page { size: 60mm 40mm; margin: 0mm !important; }`, suppress browser headers/footers, and maintain clean page breaks.
      *Done when:* Print preview renders exact 60×40mm boundaries without browser headers/footers or blank page skips.
- [x] 3. **Add Date-Range Filtering to Patrons API:** Update `src/app/api/patrons/route.ts` to accept `startDate` and `endDate` parameters and filter patrons accordingly.
      *Done when:* Querying `/api/patrons?startDate=...&endDate=...` returns patrons registered within that range.
- [x] 4. **Create Date-Range Bulk Print Studio Modal:** Build `src/components/patrons/DateRangePrintModal.tsx` with date-range selection, patron querying, result preview, and print handoff.
      *Done when:* Staff can select a date range (e.g., 2026-10-10 to 2026-12-20), view all matched patrons, and launch batch thermal printing.
- [x] 5. **Wire Date-Range Print Studio into Patron Dashboard:** Integrate `DateRangePrintModal` into `src/app/dashboard/patrons/PatronListClient.tsx` action slot and update all label generation handlers.
      *Done when:* "Print by Date Range" button is visible and operational on the patron dashboard, and batch label generation uses the new layout.
- [x] 6. **End-to-End Verification:** Run typecheck, lint, build, and automated verification scripts for date filtering and label format contracts.
      *Done when:* `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass with zero errors.

## Files / areas

- `src/components/patrons/ThermalBarcodeLabel.tsx`
- `src/components/patrons/ThermalPrintDialog.tsx`
- `src/app/api/patrons/route.ts`
- `src/components/patrons/DateRangePrintModal.tsx` (new)
- `src/app/dashboard/patrons/PatronListClient.tsx`
- `src/app/dashboard/patrons/register/PatronRegisterClient.tsx`

## Data / contracts

- **Date Range Query:**
  - `GET /api/patrons?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=1000`
  - Response: `{ success: true, patrons: IPatron[], pagination: { total: number } }`
- **Thermal Label Data Contract:**
  ```ts
  export interface ThermalLabelData {
    barcode: string;
    firstname?: string;
    surname?: string;
    name?: string; // Fallback
    patronType?: string;
    orgName?: string;
  }
  ```
- **Label Display Format:**
  - Top: `Dzuels Foundation`
  - Middle: Code128 Barcode + Numeric Barcode
  - Bottom: `Name: ${firstname || ''}, ${surname || ''}` (or `Name: ${name}`)

## Testing

- Verification script testing:
  - Date range filtering query logic on `/api/patrons`.
  - Thermal label text formatting helper (`formatThermalPatronName`).
- Full project verification:
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`

## Notes for the AI

- Browser `@page { margin: 0; }` is critical: any non-zero margin causes browsers to print page URLs and timestamps which ruin small 60×40mm thermal rolls.
- Ensure date parsing handles timezones safely (start date at 00:00:00.000, end date at 23:59:59.999).
- Keep `name` fallback in `ThermalLabelData` so any existing callers (e.g. from registration completion) do not break.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":6871,"specSha256":"7e4a11fd6375af2b6ce005a43c3a04fa05ea8647719383050c612282a55a1d0e","branch":"refs/heads/feature/xprinter-xp-365b-thermal-barcode-studio-date-range-bulk-print-pipeline","head":"454121f6ab617c616af78d9e5d6f3636b9079ec0","baseRef":"refs/heads/main","baseCommit":"454121f6ab617c616af78d9e5d6f3636b9079ec0","sourceTree":"715d4c8078c6a0e804e6384cacfae4f673fefbcb","absentOptional":[]} -->
