# Feature: Reading Competition Results & Live Scoring Engine (Web & API)

**From build-plan:** feature 11
**Build attempt:** 1
**Status:** verified
**Branch:** feature/reading-competition-results-and-live-scoring-engine

## Goal

Provide a robust competition session management and live scoring platform for the Dzuels Educational Foundation's multi-category student reading competitions. The system enables competition judges to evaluate student book summaries, enforce the Foundation's daily cap of 2 book check-ins per student per day in the `Africa/Lagos` timezone, record oral/written summary grades (0–100%) with teacher verification flags, and broadcast a real-time public leaderboard at `/competitions/reading/result` using the Foundation's Section 7.3.7 visual specifications.

## Design reference

Matches Section 7.3.7 of `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`:
- **Hero Dark Panel**: Deep navy gradient `linear-gradient(180deg, rgba(18, 52, 81, 0.95), rgba(29, 78, 109, 0.92))`
- **Live Indicator Pill**: Background `rgba(255, 184, 63, 0.16)`, Text `#8d5600`, with a pulsing amber status indicator
- **Category Spotlights & Tabs**:
  - Senior Secondary (`SS1-SS3`): Warm Gold gradient `linear-gradient(135deg, rgba(255, 226, 152, 0.72), rgba(255, 251, 233, 0.95))`
  - Junior Secondary (`JSS1-JSS3`): Teal / Cyan gradient `linear-gradient(135deg, rgba(148, 229, 223, 0.55), rgba(243, 255, 254, 0.95))`
  - Upper Primary (`P4-P6`): Peach / Coral gradient `linear-gradient(135deg, rgba(255, 185, 154, 0.55), rgba(255, 248, 243, 0.95))`
  - Lower Primary (`P1-P3`): Lavender / Violet gradient `linear-gradient(135deg, rgba(207, 193, 255, 0.45), rgba(251, 248, 255, 0.95))`
- **Rank Medallions**:
  - Rank 1 (Gold): Gradient `linear-gradient(135deg, #a56a00, #f3c44f)`
  - Rank 2 (Silver): Gradient `linear-gradient(135deg, #4d6070, #c1ccd8)`
  - Rank 3 (Bronze): Gradient `linear-gradient(135deg, #7e4f25, #d3915b)`
  - Rank 4+ (Standard): Solid `#17324d`, Text `#ffffff`
- **Typography & Theme**: Material UI v6 styled components utilizing existing font tokens (`Playfair Display`, `Outfit`, `Inter`).

## In scope

1. **Competition Domain & Service Layer (`src/lib/competitions/service.ts`)**:
   - Session discovery and active session configuration (persisted via `Competition` and `Library` collections).
   - Academic class level to competition category auto-mapper:
     - `SS1-3` (Senior Secondary: SS1, SS2, SS3)
     - `JSS1-3` (Junior Secondary: JSS1, JSS2, JSS3)
     - `P4-6` (Upper Primary: Primary 4, 5, 6 / Basic 4, 5, 6)
     - `P1-3` (Lower Primary: Primary 1, 2, 3 / Basic 1, 2, 3)
   - Enforcement of maximum **2 book check-ins per student per day** calculated in the `Africa/Lagos` timezone (`Intl.DateTimeFormat` UTC+1).
   - Competition checkout and judge evaluation/check-in processing.
   - Multi-tier ranking calculation:
     - 1st: `booksRead` (total evaluated books read) DESC
     - 2nd: `averageGrade` (mean score 0–100%) DESC
     - 3rd: `teacherVerifiedCount` (number of verified books) DESC
     - 4th: `totalGradePoints` DESC
   - Admin result publication gate (`isPublished: boolean`).

2. **Dual-Mode REST API Endpoints**:
   - `GET /api/competitions/results`: Public endpoint returning category leaderboards, top 3 podiums, category summary stats, and publication status.
   - `GET /api/competitions/session`: Returns active session metadata and current settings.
   - `POST /api/competitions/session`: Admin-only toggle for session activation and publication release.
   - `POST /api/competitions/checkout`: Authenticated staff route to checkout a competition book for a student.
   - `POST /api/competitions/checkin`: Authenticated judge route to evaluate a student reading summary (grade 0–100, feedback, teacher verification, with 2-book Lagos daily cap check).
   - `GET /api/competitions/entries`: Authenticated staff ledger of all competition evaluation records.
   - `PATCH /api/competitions/entries/[id]`: Authenticated staff route to update grades or verification on an existing record.

3. **Public Scoreboard Display (`/competitions/reading/result`)**:
   - Zero-authentication view accessible to students, parents, and public visitors.
   - Hero dark panel with pulsing live indicator.
   - Category switcher tabs across the 4 school categories.
   - Top 3 podium highlight cards with metallic medallion treatments.
   - Full ranked leaderboard table showing: Rank, Student Name, Barcode, Books Read, Average Grade, Verified Count, and Total Points.
   - 60-second automatic polling toggle + instant manual refresh button.
   - Pending publication banner when results have not yet been released by Foundation administrators.

4. **Staff Competition Desk (`/competitions/reading`)**:
   - Authenticated workspace for librarians, judges, and administrators.
   - High-speed patron barcode and book lookup with auto-populated class and category.
   - Evaluation entry form: grade slider/number input (0–100%), summary text, judge feedback notes, and teacher verification toggle.
   - Real-time daily limit warning (notifying staff if the student already has 1 or 2 check-ins today in Lagos time).
   - Session ledger table with search, category filtering, and edit actions.
   - Admin control panel to toggle public result publication.

5. **AppShell Integration & Route Permissions**:
   - Add 'Reading Competition' link under MANAGEMENT in `src/components/layout/AppShell.tsx`.
   - Update `src/middleware.ts` to allow `/competitions/reading/result` and `/api/competitions/results` through public paths.

## Out of scope

- Certificate PDF/vector generation (reserved for Feature 12: Certificate Studio & Vector Export Pipeline).
- Direct external website embedded widget (handled via Feature 14 Public Statistics).
- Student self-registration for competitions (all entrants are registered patrons).

## Build loop

- `workflow.stepReview: "feature"` (one review packet after all build steps are complete).
- `workflow.checkpointCommits: "disabled"`.

## Build steps

- [x] 1. **Competition Service Layer & Lagos 2-Book Rule** - Create `src/lib/competitions/service.ts` with session helpers, category detector, 2-book daily cap validator in `Africa/Lagos`, entry checkout/checkin logic, judge grading, and category leaderboard aggregator.
  - *Done when:* Typecheck passes with zero errors, category mapper resolves classes (SS, JSS, Primary), and daily limit calculator enforces the 2-book Lagos boundary.
- [x] 2. **Dual-Mode Competition REST API & Public Endpoints** - Implement `src/app/api/competitions/results/route.ts`, `session/route.ts`, `checkout/route.ts`, `checkin/route.ts`, `entries/route.ts`, and `entries/[id]/route.ts`. Update `src/middleware.ts` to declare public competition routes.
  - *Done when:* Public API serves aggregated category leaderboard data, judge evaluation endpoint enforces validation rules (0-100 grade, daily limit), and non-public endpoints enforce role authentication.
- [x] 3. **Public Leaderboard & Broadcast Display Page** - Build `/competitions/reading/result` (`page.tsx` and `ResultClient.tsx`) with Section 7.3.7 Hero Dark Panel, live indicator pill, 4 category tabs, top 3 podium with Gold/Silver/Bronze medallions, full ranked table, auto-refresh, and unpublished state card.
  - *Done when:* Visiting `/competitions/reading/result` unauthenticated loads the live competition leaderboard, switches between categories cleanly, and displays podium ranks with correct color tokens.
- [x] 4. **Staff Competition Desk & Evaluation Workspace** - Build `/competitions/reading` (`page.tsx` and `ReadingCompetitionDesk.tsx`) featuring patron/book barcode entry, auto-category resolution, evaluation grading form (0-100, feedback, teacher verify), daily limit alert, session ledger table, and admin publication toggle. Update `AppShell.tsx` navigation.
  - *Done when:* Staff can evaluate a student reading submission, observe the 2-book Lagos limit on a third attempt, view session entries in the ledger, and toggle publication state.
- [x] 5. **Full System Verification & Build Validation** - Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
  - *Done when:* Typecheck, linter, and production Next.js build pass cleanly with zero errors.

## Files / areas

- `src/lib/competitions/service.ts` - Core competition business logic, Lagos timezone calculations, category resolver, grading engine, and leaderboard aggregator.
- `src/lib/competitions/types.ts` - Shared TypeScript interfaces for competition sessions, categories, leaderboard entries, and evaluation payloads.
- `src/app/api/competitions/results/route.ts` - Public REST API for live competition results and category leaderboards.
- `src/app/api/competitions/session/route.ts` - REST API for competition session status and publication toggle.
- `src/app/api/competitions/checkout/route.ts` - REST API for competition book checkouts.
- `src/app/api/competitions/checkin/route.ts` - REST API for judge book check-ins, grading, and teacher verification.
- `src/app/api/competitions/entries/route.ts` - REST API for querying session evaluation records.
- `src/app/api/competitions/entries/[id]/route.ts` - REST API for updating single evaluation entries.
- `src/app/competitions/reading/result/page.tsx` - Server entry point for public live leaderboard scoreboard.
- `src/app/competitions/reading/result/ResultClient.tsx` - Client component rendering Section 7.3.7 dark hero panel, live indicator pill, category tabs, and podium cards.
- `src/app/competitions/reading/page.tsx` - Server entry point for staff competition desk.
- `src/app/competitions/reading/ReadingCompetitionDesk.tsx` - Interactive client workspace for judges and librarians.
- `src/components/layout/AppShell.tsx` - Sidebar navigation link under MANAGEMENT.
- `src/middleware.ts` - Whitelist public routes `/competitions/reading/result` and `/api/competitions/results`.

## Data / contracts

- **School Category Codes**:
  - Senior Secondary: `'SS1-3'`
  - Junior Secondary: `'JSS1-3'`
  - Upper Primary: `'P4-6'`
  - Lower Primary: `'P1-3'`
- **Daily Cap Rule**: Maximum 2 check-ins with status `'checked_in'` per patron per calendar day calculated between `00:00:00.000` and `23:59:59.999` in `Africa/Lagos` timezone (`+01:00`).
- **Grade Scale**: Number from `0` to `100` inclusive.
- **Teacher Verification**: Boolean `teacherVerified`, with optional `teacherVerifiedBy` staff name string.
- **Ranking Formula**:
  - Primary sort: `booksRead` (count of evaluated books) DESC
  - Tie-breaker 1: `averageGrade` (0–100) DESC
  - Tie-breaker 2: `teacherVerifiedCount` DESC
  - Tie-breaker 3: `totalGradePoints` DESC
  - Tie-breaker 4: `patronName` ASC
- **Leaderboard API Contract (`GET /api/competitions/results?sessionKey=...&category=...`)**:
  ```json
  {
    "success": true,
    "data": {
      "sessionKey": "reading-competition-2026",
      "sessionTitle": "Reading Competition 2026",
      "isPublished": true,
      "publishedAt": "2026-10-05T18:00:00.000Z",
      "selectedCategory": "SS1-3",
      "categories": [
        { "code": "SS1-3", "label": "Senior Secondary (SS1-SS3)", "count": 12 },
        { "code": "JSS1-3", "label": "Junior Secondary (JSS1-JSS3)", "count": 18 },
        { "code": "P4-6", "label": "Upper Primary (P4-P6)", "count": 24 },
        { "code": "P1-3", "label": "Lower Primary (P1-P3)", "count": 15 }
      ],
      "leaderboard": [
        {
          "rank": 1,
          "patronId": "...",
          "patronBarcode": "20230001",
          "patronName": "Ayegbokiki, Itunu",
          "category": "SS1-3",
          "booksRead": 8,
          "averageGrade": 88.5,
          "teacherVerifiedCount": 7,
          "totalGradePoints": 708
        }
      ],
      "podium": [
        { "rank": 1, "patronName": "...", "booksRead": 8, "averageGrade": 88.5 },
        { "rank": 2, "patronName": "...", "booksRead": 7, "averageGrade": 85.0 },
        { "rank": 3, "patronName": "...", "booksRead": 6, "averageGrade": 82.0 }
      ],
      "stats": {
        "totalParticipants": 69,
        "totalBooksEvaluated": 184,
        "overallAverageGrade": 79.4,
        "verifiedRate": 91.2
      }
    }
  }
  ```

## Testing

- Typecheck baseline: `npx tsc --noEmit`
- Linter baseline: `npm run lint`
- Production build: `npm run build`
- Functional verification:
  - Verify Lagos day boundary calculation: start/end of day matches `Africa/Lagos` (+01:00) regardless of server local time.
  - Verify category auto-detection logic for sample student class levels (`SS2`, `JSS 1`, `Primary 5`, `Basic 2`).
  - Verify that a 3rd checkin attempt on the same Lagos day for the same student returns HTTP 400 with a descriptive daily limit error.
  - Verify that unauthenticated requests to `/competitions/reading/result` load without 401 redirect, while `/competitions/reading` requires staff authentication.

## Notes for the AI

- Use Material UI components (`Box`, `Typography`, `Card`, `Table`, `Tabs`, `Tab`, `Button`, `Chip`, `CircularProgress`, etc.) and theme tokens. Avoid Tailwind CSS.
- Ensure all dates stored in MongoDB are UTC Dates, but the daily limit check strictly compares against the start and end of day in `Africa/Lagos`.
- Avoid placeholder data; query active MongoDB `Competition` and `Library` records.
- For public scoreboard display, provide an engaging, premium broadcast presentation matching the Section 7.3.7 color tokens.
