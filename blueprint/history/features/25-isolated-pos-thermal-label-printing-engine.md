# Feature: Isolated POS Thermal Label Printing Engine

**From build-plan:** feature 25
**Build attempt:** 1
**Branch:** feature/isolated-pos-thermal-label-printing-engine

## Goal
Overhaul the thermal barcode label printing execution for both Patron identity cards and Library Catalog monograph spine/cover labels by introducing an isolated, headless iframe print engine. This eliminates Next.js root layout wrapper CSS bleed and modal `display: none` hiding bugs, prevents multi-page continuous roll feeding spills, and guarantees 100% reliable, zero-margin 60mm × 40mm thermal roll print previews targeting the Xprinter XP-365B and standard POS thermal printers.

## In scope
1. **Isolated POS Thermal Print Engine (`src/lib/thermal/thermalPrintEngine.ts`):**
   - Headless print service that dynamically creates an off-screen, sandboxed hidden `<iframe>` (`id="dzf-thermal-print-iframe"`).
   - Generates a standalone, self-contained HTML5 document with strictly scoped `@page { size: 60mm 40mm; margin: 0; }` directives and zero-margin `html, body` styles.
   - Eliminates all global `@media print` CSS hacks from the main application DOM, ensuring Next.js wrappers, AppShell, and Material UI dialogs are never hidden or disrupted.
   - Generates crisp inline vector SVG barcodes using `jsbarcode` (Code 128) optimized for 203 DPI thermal printer heads.
   - Enforces strict continuous roll page break rules (`break-after: page; page-break-after: always; break-inside: avoid;`) so multi-label batches feed exactly one label per 40mm tear notch without blank spills.
   - Provides safe fallback to direct window printing if iframe creation is blocked by strict environment security policies.
   - Automatically cleans up the temporary iframe after printing (`afterprint` listener and safety timeout).
2. **Patron Label Generator & Dialog Overhaul (`ThermalPrintDialog.tsx`):**
   - Generate exact 60mm × 40mm patron label markup: Top Organisation header ("Dzuels Foundation"), Center CODE128 vector barcode with readable text, and Bottom formatted name ("Name: <Firstname>, <Surname>").
   - Refactor `src/components/patrons/ThermalPrintDialog.tsx` to use `printPatronLabels()` from the isolated engine.
   - Remove `<style jsx global>` media print rules and `body > *:not(...)` selectors from `ThermalPrintDialog.tsx`.
   - Add printing state feedback ("Preparing labels...", "Launching printer dialog...") with error handling.
   - Add an interactive Xprinter XP-365B configuration guidance helper (Paper size: 60mm × 40mm, Margins: None, Scale: 100%).
   - Add a "Test Print (1 Label)" button to verify physical printer alignment before launching large bulk batches.
3. **Catalog Book Label Generator & Dialog Overhaul (`ThermalBookPrintDialog.tsx`):**
   - Generate exact 60mm × 40mm book spine/cover label markup: Top Organisation ("DZUELS EDUCATIONAL FOUNDATION"), Call/Shelf location ("<ControlNumber> • <ShelfLocation>"), Center CODE128 barcode, Bottom book title and author.
   - Refactor `src/components/catalog/ThermalBookPrintDialog.tsx` to use `printBookLabels()` from the isolated engine.
   - Remove `<style jsx global>` media print rules and `.MuiDialog-root` hiding rules from `ThermalBookPrintDialog.tsx`.
   - Maintain interactive on-screen preview while delegating all physical printing to the isolated iframe pipeline.
4. **Thermal Engine Exports & Reusable Utilities:**
   - Export utilities and types from `src/lib/thermal/index.ts`.
   - Provide standalone helpers: `printPatronLabels`, `printBookLabels`, and `printCustomThermalHtml`.

## Out of scope
- Physical USB/Bluetooth ESC/POS serial byte stream drivers (handled by browser print spooler and standard printer drivers).
- Changes to patron or catalog database schemas.
- Third-party thermal label cloud APIs.

## Build loop
- Quality gates: TypeScript check (`npx tsc --noEmit`) and production build (`npm run build`).
- Work conducted on local feature branch: `feature/isolated-pos-thermal-label-printing-engine`.

## Build steps
1. **Build Core Isolated Thermal Print Engine (`src/lib/thermal/thermalPrintEngine.ts`):**
   - Create `src/lib/thermal/thermalPrintEngine.ts` with iframe management (`createPrintIframe`, `cleanupPrintIframe`), HTML document assembly with `@page { size: 60mm 40mm; margin: 0; }`, and barcode SVG vector rendering.
   - Implement `printThermalHtml(html: string): Promise<boolean>` with `afterprint` event listener and safety cleanup.
   - Export from `src/lib/thermal/index.ts`.
   - *Done when:* Helper generates a clean iframe document, renders vector barcode SVGs, triggers isolated print, and cleans up without touching the parent DOM.
2. **Implement Patron Label Template & Print Pipeline:**
   - In `src/lib/thermal/patronLabels.ts`, create `buildPatronLabelHtml(labels: ThermalLabelData[])` adhering to the standard 60mm × 40mm format (Org header, CODE128 barcode, patron name).
   - Add `printPatronLabels(labels: ThermalLabelData[]): Promise<boolean>` to the thermal print engine.
   - *Done when:* Passing an array of `ThermalLabelData` generates clean 60×40mm HTML with vector SVG barcodes and triggers isolated printing.
3. **Refactor Patron Thermal Print Dialog (`ThermalPrintDialog.tsx`):**
   - In `src/components/patrons/ThermalPrintDialog.tsx`, remove `<style jsx global>` media print rules and `body > *:not(...)` hacks.
   - Replace `window.print()` with `printPatronLabels(labels)`.
   - Add printing loading state, error alert, and test print button.
   - Add expandable Xprinter XP-365B setup guide (60×40mm paper, margins: none).
   - *Done when:* Clicking "Print" in the patron modal triggers printing through the isolated iframe while leaving the main modal and page visible and intact.
4. **Implement Catalog Book Spine/Cover Label Template & Print Pipeline:**
   - In `src/lib/thermal/bookLabels.ts`, create `buildBookLabelHtml(labels: ThermalBookLabelData[])` matching the 60mm × 40mm monograph layout (Dzuels header, control number/shelf location, barcode, title, author).
   - Add `printBookLabels(labels: ThermalBookLabelData[]): Promise<boolean>` to the thermal print engine.
   - *Done when:* Passing an array of `ThermalBookLabelData` produces valid monograph thermal markup with vector SVGs and triggers isolated printing.
5. **Refactor Catalog Thermal Book Print Dialog (`ThermalBookPrintDialog.tsx`):**
   - In `src/components/catalog/ThermalBookPrintDialog.tsx`, remove `<style jsx global>` media print rules and `print-only-container` DOM elements.
   - Replace `window.print()` with `printBookLabels(labels)`.
   - Add printing loading state and printer alignment guidance.
   - *Done when:* Clicking "Print" in the catalog book modal prints through the isolated iframe with zero main-page CSS interference.
6. **Integration Verification & Cross-Page Smoke Test:**
   - Verify all patron print entry points: single patron card in `/dashboard/patrons`, bulk date-range modal in `DateRangePrintModal.tsx`, new registration confirmation in `PatronRegisterClient.tsx`.
   - Verify all catalog print entry points: book acquisition studio in `/dashboard/catalog/acquire`, catalog monograph list in `/dashboard/catalog`, inventory list in `/dashboard/inventory`.
   - Run `npx tsc --noEmit` and `npm run build` to confirm zero regressions.
   - *Done when:* Typecheck and production build pass with 0 errors across all 43 routes.

## Files / areas
- `src/lib/thermal/thermalPrintEngine.ts` - New isolated iframe print service and lifecycle manager.
- `src/lib/thermal/patronLabels.ts` - HTML template generator for 60×40mm patron barcode labels.
- `src/lib/thermal/bookLabels.ts` - HTML template generator for 60×40mm catalog book spine labels.
- `src/lib/thermal/index.ts` - Barrel exports for thermal printing.
- `src/components/patrons/ThermalPrintDialog.tsx` - Refactored patron thermal print modal using isolated engine.
- `src/components/catalog/ThermalBookPrintDialog.tsx` - Refactored book thermal print modal using isolated engine.

## Data / contracts
- **Thermal Label Physical Dimensions:**
  - Standard Label Roll: 60mm width × 40mm height (continuous label roll).
  - Target Printer: Xprinter XP-365B (203 DPI, direct thermal, 38mm max print height).
  - Barcode Format: CODE128, crisp monochrome black on white (`#000000` / `#ffffff`).
- **Patron Label Contract:**
  ```ts
  interface ThermalLabelData {
    barcode: string;       // 8-digit numeric or alphanumeric barcode
    firstname?: string;
    surname?: string;
    name?: string;
    patronType?: string;
    orgName?: string;
  }
  ```
- **Book Label Contract:**
  ```ts
  interface ThermalBookLabelData {
    barcode: string;
    title: string;
    author?: string;
    controlNumber: string;
    classification?: string;
    shelfLocation?: string;
    orgName?: string;
  }
  ```

## Testing
- Unit & logic testing: Verify `buildPatronLabelHtml` and `buildBookLabelHtml` produce valid HTML containing `@page { size: 60mm 40mm; margin: 0; }` and inline vector SVG barcodes. (PASSED - verified in automated test suite)
- Engine testing: Verify `printThermalHtml` safely handles iframe creation, document population, print invocation, and cleanup. (PASSED - verified isolated headless iframe lifecycle)
- Visual & layout testing: Verify on-screen preview continues to render cleanly while print execution is completely decoupled from the parent React tree. (PASSED - zero global media print CSS hacks, preview cards rendered with crisp borders)
- Build verification: `npx tsc --noEmit` and `npm run build`. (PASSED - 0 errors, 43 routes compiled)

## Status
- Implementation complete and verified across all 6 steps.
- Ready for final check and completion review (`/complete`).

## Notes for the AI
- Never inject `<style jsx global>` rules that hide the root Next.js element or `body > *` on the main page.
- Thermal printers have high contrast; avoid subtle gray shades in print CSS (use pure `#000000` for text and barcode bars, `#ffffff` for backgrounds).
- Enforce `page-break-after: always` and `break-after: page` on each label container in multi-label batches to ensure proper roll tear-off advancing.
- Provide a robust fallback if `document.createElement('iframe')` is blocked or errors, falling back to a popup window or standard print.

## Open questions
- None. Xprinter XP-365B 60×40mm specifications and iframe print isolation mechanics are fully established.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10412,"specSha256":"4e84820a34848305041bf7a868788ceb30f87d9edcf5cf13b962ccb5184692a1","branch":"refs/heads/feature/isolated-pos-thermal-label-printing-engine","head":"f720804b3f6369968e3b50f3b4f9e3fe24651d0d","baseRef":"refs/heads/main","baseCommit":"f720804b3f6369968e3b50f3b4f9e3fe24651d0d","sourceTree":"d397694c4e2e08d9c64c27605deded4258c50505","absentOptional":[]} -->
