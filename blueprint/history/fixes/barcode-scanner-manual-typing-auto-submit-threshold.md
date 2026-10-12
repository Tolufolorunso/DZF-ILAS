# Fix: Barcode Scanner Manual Typing Auto-Submit Threshold

**Type:** Fix
**Status:** verified
**Branch:** fix/barcode-scanner-manual-typing-auto-submit-threshold

## The problem

In `src/components/ui/DZFBarcodeInput.tsx`, the auto-submit handler triggers a debounce timer when `val.length >= 4` (with `debounceMs={120}` in `ScannerInterface.tsx`). Because all patron barcodes in DZF-ILAS are 8-digit numbers formatted as `YYYYNNNN` (e.g. `20230001`, `20260584`), when a librarian manually types on the keyboard without a physical scanner, the input detects the 4-digit year (e.g. `2023`), waits just 120ms (faster than normal human keystroke speed), and immediately auto-submits `"2023"`. This premature submission truncates the barcode at 4 digits, resulting in the error:
`Attendance Check-In Failed: Patron with barcode "2023" was not found in the directory. I can only type 4 digits`.

## The fix

1. In `src/components/ui/DZFBarcodeInput.tsx`:
   - Increase minimum auto-submit threshold from 4 to 8 characters (`minLength = 8` prop), ensuring codes with fewer than 8 characters are never auto-submitted by the timer.
   - Implement rapid keystroke detection: hardware barcode scanners emit characters with inter-key intervals < 50ms, whereas humans type with intervals > 80-150ms.
   - Allow human manual typing to proceed without premature timer interruption, submitting when `Enter` is pressed, when the `Submit` button is clicked, or after typing full 8+ character barcodes.
   - Preserve instant submission on `Enter` key press (`autoSubmitOnEnter = true`) and manual `Submit` button click.
2. In `src/components/attendance/ScannerInterface.tsx`:
   - Configure `minLength={8}` on `<DZFBarcodeInput />`.
   - Ensure feedback and input error handling guide the user when entering codes.

## Build steps

- [x] 1. **Update Barcode Input Auto-Submit Threshold & Keystroke Detection**
  - Update `src/components/ui/DZFBarcodeInput.tsx` with `minLength` prop (default 8) and prevent timer auto-submit for inputs under 8 characters.
  - Add rapid scanner vs manual typing interval detection so manual typists are never interrupted mid-entry.
  - Update `src/components/attendance/ScannerInterface.tsx` with `minLength={8}`.
  - `Done when`: Manual typing allows entering 8+ digits (e.g. `20230001`) without truncation at 4 digits; pressing Enter or clicking Submit correctly checks in the patron; `npx tsc --noEmit; npm run lint` passes with 0 errors.

## Verify

1. Navigate to `/dashboard/attendance`.
2. In the "High-Speed Barcode Scanner" input, slowly type an 8-digit barcode character by character (e.g. `20230001` or `20260584`).
3. Verify the form does NOT auto-submit at `"2023"` after 4 digits, and allows typing all 8 digits.
4. Press Enter or click Submit to confirm attendance is recorded for the complete 8-digit patron barcode.
