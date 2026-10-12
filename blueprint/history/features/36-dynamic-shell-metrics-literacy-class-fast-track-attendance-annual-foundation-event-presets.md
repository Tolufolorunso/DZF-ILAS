# Feature: Dynamic Shell Metrics, Literacy Class Fast-Track Attendance & Annual Foundation Event Presets

**From build-plan:** feature 36  
**Build attempt:** 1  
**Branch:** feature/dynamic-shell-metrics-literacy-class-fast-track-attendance-annual-foundation-event-presets  
**Status:** verified  

---

## Goal

Eliminate hardcoded navigation badges in `AppShell` with dynamic real-time counts from the database; introduce a dedicated 1-click Literacy Class fast-track attendance desk on `/dashboard/attendance` with continuous barcode scanner autofocus and grade-band presets; and formalize the 13 annual Dzuels Foundation event presets across Calendar, Competition, Attendance, and Circulation workflows.

---

## In Scope

1. **Dynamic AppShell Navigation Badges:**
   - Dynamic real-time statistics queried from `/api/public/stats` on client mount.
   - Binds `Library Catalog` badge to live `books` count (formatted e.g. `1.2k` if ≥1,000, or exact integer).
   - Binds `Patron Directory` badge to live active `patrons` count.
   - Listens to window `dzf:realtime` events to refresh badge counts when records change.

2. **Dedicated Literacy Class Fast-Track Attendance Mode:**
   - One-click quick-activation studio directly within the attendance desk on `/dashboard/attendance`.
   - Pre-configured grade-band presets:
     - Early Elementary (Primary 1-3) [+5 pts]
     - Upper Elementary (Primary 4-6) [+5 pts]
     - Junior Secondary (JSS 1-3) [+5 pts]
     - Senior Secondary (SS 1-3) [+5 pts]
     - Adult / Remedial Literacy [+5 pts]
   - Persistent scanner autofocus: barcode input remains continuously focused after every scan or key event without mouse intervention.
   - Real-time session attendee counter tracking students scanned during the current quick session with 1-click reset.

3. **Annual Foundation Event Presets:**
   - `FoundationPreset` Mongoose model (`src/models/FoundationPreset.ts`) and system constants (`src/lib/constants/foundationEvents.ts`).
   - Cataloged all 13 official recurring foundation events:
     1. World Education Day (January)
     2. Spelling Bee - Elementary (February)
     3. Spelling Bee - High School (March)
     4. World Reading Book Day / Reading Competition (April)
     5. UN Day Of Boy Child (May)
     6. Career Week (June)
     7. Ijero Tech Day (June)
     8. UN Day Against Drug Abuse & Trafficking (June)
     9. World Literacy Day / Essay Competition (Aug-Sept)
     10. World Day of Charity (September)
     11. World Teacher Day (October)
     12. International Day Of the Girl Child (October)
     13. UN Human Right Day (Focus On Education) (December)
   - Exposes `GET /api/foundation-presets` route handler with auto-seeding and category/month filters.
   - Integrated presets into Calendar scheduling (`EventFormDialog`), Circulation checkout tagging (`ScannerTerminal`), and Attendance sessions (`ScannerInterface`).

---

## Out of Scope

- Full CRUD self-service UI for editing presets in the Admin Control Center (deferred to Feature 38).
- Automated SMS broadcast integration for calendar events.
- Biometric fingerprint scanner hardware integration.

---

## Completed Build Steps

1. [x] **Foundation Preset Model & System Constants**: Created `src/models/FoundationPreset.ts`, registered in `src/models/index.ts`, created `src/lib/constants/foundationEvents.ts` with 13 annual events and 5 grade bands, and created `/api/foundation-presets` route handler with automatic seeding.
2. [x] **Dynamic AppShell Badges**: Updated `src/components/layout/AppShell.tsx` to bind `Library Catalog` and `Patron Directory` badges dynamically to database statistics via `/api/public/stats` and react to `dzf:realtime` events.
3. [x] **Literacy Class Fast-Track Mode & Scanner Autofocus**: Built 1-click Literacy Class Fast-Track studio in `src/components/attendance/ScannerInterface.tsx` with grade-band pills (+5 pts), persistent autofocus retention, and live attendee counter.
4. [x] **Integration of Annual Presets across Calendar, Competition & Circulation**: Wired annual presets into `EventFormDialog` (autofill scheduling), `ScannerTerminal` (1-click event tagging chips), and `ScannerInterface` (annual event attendance).
5. [x] **End-to-End Verification**: Ran full TypeScript typecheck (`npx tsc --noEmit`) and ESLint (`npm run lint`), passing with 0 errors and 0 warnings.

---

## Verification Evidence

- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors, 0 warnings.
- Real-time reactivity: AppShell binds dynamic counts and auto-refreshes on `dzf:realtime`.
- Scanner autofocus: Persistent autofocus retention ensures seamless hardware barcode scans in the literacy desk without loss of focus.
