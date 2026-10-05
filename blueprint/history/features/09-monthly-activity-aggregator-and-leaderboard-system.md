# Feature: Monthly Activity Aggregator & Leaderboard System (Web & API)

**From build-plan:** feature 9
**Build attempt:** 1
**Branch:** feature/monthly-activity-aggregator-and-leaderboard-system
**Status:** verified

## Goal
Build the gamified monthly activity aggregator and leaderboard system for academic library patrons, featuring automated activity score rollups according to the DZF Foundation formula, patron rank tier badges (Champion, Runner-up, Third Place, Top 10), celebratory 3-step podium hero views, inactive patron outreach reports, and dual-mode REST APIs for web staff and Android mobile clients.

## Design reference
Follows Section 7.6 of `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md` (*Gamified Activity Leaderboard List*):
- **Hero / Podium Canvas:** Royal indigo-to-purple header backdrop (`linear-gradient(135deg, #17324d 0%, #0b1d2e 100%)`).
- **Podium Surface:** Celebratory 3-step stage with gold glow (`linear-gradient(135deg, #ffd700, #ffed4e)`), silver (`linear-gradient(135deg, #e2e8f0, #cbd5e1)`), and bronze (`linear-gradient(135deg, #fed7aa, #fdba74)`).
- **Champion Crown Ribbon:** `#1 Ranked Champion` floating banner with gradient `linear-gradient(135deg, #dc3545, #fd7e14)` and white text.
- **Top 3 Leaderboard Rows:** Golden highlighting with background `linear-gradient(135deg, #fff3cd, #ffeaa7)` and border `#ffc107`.
- **Rank Medallions / Badges:**
  - 1st Place: Gold Medal `🥇 Champion` (`#6f1111` brand maroon).
  - 2nd Place: Silver Medal `🥈 Runner-up` (`#4d6070` slate navy).
  - 3rd Place: Bronze Medal `🥉 Third Place` (`#cd7f32` bronze amber).
  - Top 10: Green Trophy `🏆 Top 10` (`#1b5e20` forest green).
  - Standard (11+): Scholastic Navy (`#17324d`).
- **Total Activity Score:** Highlighted in Vibrant Violet (`#6f42c1`).

## In scope
- **Activity Scoring Engine (`src/lib/activity/service.ts`):**
  - Canonical DZF Foundation Activity Score Formula:
    $$\text{ActivityScore} = (\text{booksCheckedOut} \times 10) + (\text{booksReturned} \times 15) + (\text{classesAttended} \times 20) + (\text{summariesApproved} \times 25) + (\text{totalPoints} \times 1)$$
  - Leaderboard Query (`getMonthlyLeaderboard`):
    - Month/year selection (e.g. `2026-03`, `2025-10`), defaulting to the current month.
    - Sorting by `{ activityScore: -1, totalPoints: -1 }`.
    - Category filtering: all patrons, students (by class), teachers, or guests.
    - Separation of Top 3 (podium) and paginated leaderboard list.
    - Server-side pagination with `limit` and `page`.
  - Recalculation & Re-ranking (`recalculateMonthlyRanks`):
    - Recomputes exact `activityScore` and assigns sequential ranks (1, 2, 3...) for all active patrons in a given month.
    - Strictly executed as an administrative action or event-driven process, **never** mutated during idempotent HTTP GET requests (adhering to Section 5.3 of specification).
  - Inactive Patrons Outreach Report (`getInactivePatrons`):
    - Detects registered patrons who have 0 activity (`activityScore === 0` or missing `MonthlyActivity`) for a selected month.
    - Filterable by student class/grade to support targeted librarian follow-up.
  - Patron Monthly History (`getPatronMonthlyHistory`):
    - Multi-month trend tracking for individual patrons showing points and ranking trajectory.
  - Monthly Statistics Summary (`getLeaderboardStats`):
    - Key metrics: Top Reader of the Month, Active Readers Count, Total Points Awarded, Books Circulated, and Summaries Approved.
- **REST API Endpoints:**
  - `GET /api/leaderboard`:
    - Public/staff endpoint returning `top3`, paginated `leaderboard`, `stats`, and pagination metadata.
    - Dual auth compatible (session cookie or Bearer token).
  - `GET /api/leaderboard/inactive`:
    - Staff endpoint returning registered patrons with zero activity for the chosen month.
  - `GET /api/leaderboard/patron/[id]`:
    - Historical monthly performance records for a specific patron.
  - `POST /api/leaderboard/recalculate`:
    - Protected staff endpoint (requires authenticated librarian or admin) to recalculate scores and ranks for a target month.
- **Web UI & Leaderboard Workspace (`/leaderboard`):**
  - **Header & Controls Bar:**
    - Month/Year selector dropdown (past 12 months + current month).
    - Category pill filter (All, Students, Teachers, Staff).
    - "Recalculate Scores" action button with confirmation dialog.
  - **Metric Stat Cards:**
    - Top Reader of the Month (Maroon with trophy).
    - Active Readers this Month (Scholastic Navy with users).
    - Total Points Generated (Academic Gold with star/sparkles).
    - Books Circulated (Emerald Green with book).
  - **Celebratory 3-Step Podium (`LeaderboardPodium.tsx`):**
    - 1st Place (Center / Tallest): Gold glow podium, Champion Crown Ribbon `#1 Ranked Champion`, avatar, name, barcode, class, total score, and point breakdown.
    - 2nd Place (Left / Medium): Silver podium, `🥈 Runner-up` badge, patron card.
    - 3rd Place (Right / Bronze): Bronze podium, `🥉 Third Place` badge, patron card.
    - Responsive layout (stacks gracefully on mobile screens).
  - **Main Content Tabs:**
    - Tab 1: **Leaderboard Rankings** (`LeaderboardTable.tsx`):
      - `DZFDataTable` with golden row highlighting for Top 3.
      - Columns: Rank, Patron (Passport photo, Name, Barcode, Class), Activity Score (`#6f42c1`), Total Points, Books (Out/In), Classes Attended, Book Summaries.
      - Search filter, pagination, and CSV export.
    - Tab 2: **Inactive Patrons (Outreach)** (`InactivePatronsTable.tsx`):
      - List of inactive patrons for librarian engagement.
      - Columns: Barcode, Name, Type, Class, Phone, Last Activity Date.
      - Class filters and CSV export.
- **AppShell Navigation Integration:**
  - Wire `analytics` item in `AppShell.tsx` to route to `/leaderboard`.
  - Active highlighting when viewing `/leaderboard`.

## Out of scope
- Automated Google Sheets sync for student cohorts (Feature 10).
- Reading competition live rubric scoring (Feature 11).
- PDF certificate generation (Feature 12).

## Build loop
- **Step review:** `feature` (one consolidated review packet after completing small implementation steps).
- **Checkpoint commits:** `disabled`.
- **Merge approval:** Stop for explicit approval before squash merging into `main`.

## Build steps
- [x] 1. **Activity Scoring Engine & Monthly Aggregation Service**
   - Create `src/lib/activity/service.ts`:
     - Implement formula: `activityScore = (booksCheckedOut * 10) + (booksReturned * 15) + (classesAttended * 20) + (summariesApproved * 25) + (totalPoints * 1)`.
     - Implement `getMonthlyLeaderboard(year, month, options)` with sorting `{ activityScore: -1, totalPoints: -1 }`, patron population, and top 3 extraction.
     - Implement `recalculateMonthlyRanks(year, month)` with bulk update operations and rank assignment.
     - Implement `getInactivePatrons(year, month, options)` with patron left-outer join / difference logic.
     - Implement `getLeaderboardStats(year, month)` with aggregation counters.
     - Implement `getPatronMonthlyHistory(patronId)` for patron progression.
   - *Done when:* Domain service calculates exact scores matching formula, sorts and ranks top patrons, and identifies inactive patrons with unit verification.

- [x] 2. **Dual-Mode Leaderboard REST API Endpoints**
   - Implement `src/app/api/leaderboard/route.ts` (`GET /api/leaderboard`).
   - Implement `src/app/api/leaderboard/inactive/route.ts` (`GET /api/leaderboard/inactive`).
   - Implement `src/app/api/leaderboard/patron/[id]/route.ts` (`GET /api/leaderboard/patron/[id]`).
   - Implement `src/app/api/leaderboard/recalculate/route.ts` (`POST /api/leaderboard/recalculate` with staff auth guard).
   - *Done when:* Endpoints return standardized JSON responses, support query filtering, enforce authentication on recalculate, and strictly avoid database mutation on GET.

- [x] 3. **Celebratory 3-Step Podium & Rank Badge Components**
   - Implement `src/components/leaderboard/LeaderboardPodium.tsx` with gold, silver, and bronze pedestals, `#1 Ranked Champion` crown ribbon, patron passport avatars, and scores.
   - Implement `src/components/leaderboard/PatronRankCard.tsx` with rank badges (`🥇 Champion`, `🥈 Runner-up`, `🥉 Third Place`, `🏆 Top 10`, `#17324d` standard).
   - *Done when:* Podium renders top 3 with golden celebratory accents, avatars, scores, and responsive mobile-stacked layout.

- [x] 4. **Leaderboard Table & Inactive Patrons Outreach Tab Components**
   - Implement `src/components/leaderboard/LeaderboardTable.tsx` using `DZFDataTable`, Top 3 golden row highlights, activity breakdown pills, and CSV export.
   - Implement `src/components/leaderboard/InactivePatronsTable.tsx` using `DZFDataTable`, class/grade filters, contact phone, and CSV export.
   - *Done when:* Leaderboard table renders top reader rows with medals, and inactive patrons table displays outreach candidates with filters and CSV export.

- [x] 5. **Leaderboard Workspace Page (`/leaderboard`) & AppShell Navigation**
   - Build `src/app/leaderboard/page.tsx` and `src/app/leaderboard/LeaderboardClient.tsx` featuring month selector, stat cards, podium hero, and dual tabs.
   - Update `src/components/layout/AppShell.tsx` to map `analytics` nav item to `/leaderboard` and highlight active route.
   - *Done when:* Navigating to `/leaderboard` renders the complete gamified workspace with real MongoDB data, month switching updates all panels, and AppShell highlights the nav item.

- [x] 6. **End-to-End Verification & Production Build**
   - Run type safety: `npx tsc --noEmit`.
   - Run linter: `npm run lint`.
   - Run production compilation: `npm run build`.
   - Execute integration test verifying formula scoring, leaderboard queries, inactive patrons detection, and recalculation mutation.
   - *Done when:* All checks exit with 0 errors and all routes compile cleanly.

## Files / areas
- `src/lib/activity/service.ts` - Core scoring formula engine, rank assignment, leaderboard aggregation, inactive patron detection, and monthly stats.
- `src/app/api/leaderboard/route.ts` - Public/staff paginated leaderboard and top 3 query endpoint.
- `src/app/api/leaderboard/inactive/route.ts` - Inactive patrons outreach endpoint.
- `src/app/api/leaderboard/patron/[id]/route.ts` - Single patron multi-month performance history endpoint.
- `src/app/api/leaderboard/recalculate/route.ts` - Protected score recalculation and rank re-assignment endpoint.
- `src/components/leaderboard/LeaderboardPodium.tsx` - Celebratory 3-step gold/silver/bronze podium component with champion crown ribbon.
- `src/components/leaderboard/PatronRankCard.tsx` - Rank tier medallion badges (Champion, Runner-up, Third Place, Top 10).
- `src/components/leaderboard/LeaderboardTable.tsx` - Filterable leaderboard table with golden Top 3 highlighting and CSV export.
- `src/components/leaderboard/InactivePatronsTable.tsx` - Inactive patron outreach ledger with class filters and CSV export.
- `src/app/leaderboard/page.tsx` & `src/app/leaderboard/LeaderboardClient.tsx` - Full `/leaderboard` workspace page.
- `src/components/layout/AppShell.tsx` - Navigation mapping and active highlight for `/leaderboard`.

## Data / contracts
- **Activity Score Formula:**
  `activityScore = (booksCheckedOut * 10) + (booksReturned * 15) + (classesAttended * 20) + (summariesApproved * 25) + (totalPoints * 1)`.
- **Rank Tiers:**
  - Rank 1: Gold Medal `🥇 Champion` (`#6f1111` brand primary).
  - Rank 2: Silver Medal `🥈 Runner-up` (`#4d6070` slate navy).
  - Rank 3: Bronze Medal `🥉 Third Place` (`#cd7f32` bronze amber).
  - Rank 4-10: Green Trophy `🏆 Top 10` (`#1b5e20` forest green).
  - Rank 11+: Standard Rank Badge (`#17324d` scholastic navy).
- **Idempotency Rule:**
  - GET `/api/leaderboard` is 100% read-only; it queries indexed `MonthlyActivity` and sorts by `{ activityScore: -1, totalPoints: -1 }`.
  - Recalculations and rank mutations require explicit `POST /api/leaderboard/recalculate` with staff JWT.

## Testing
- Integration test script: `scratch/test-leaderboard-e2e.mjs`.
  - Verifies exact score calculation against formula (103 for sample 1, 25 for sample 2, 97 for sample 3).
  - Verifies leaderboard sorting and top 3 extraction.
  - Verifies inactive patrons query.
  - Verifies recalculate endpoint auth guard and update results.
- Typecheck: `npx tsc --noEmit`.
- Lint: `npm run lint`.
- Build: `npm run build`.

## Notes for the AI
- Adhere strictly to Section 5.3 of `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`: never perform database mutations or re-ranking inside GET handlers.
- Reuse `DZFDataTable` with `columns`, `data`, `pageSize`, `keyExtractor`, and `exportFilename`.
- Reuse `DZFStatCard` with standard semantic colors (`'maroon' | 'navy' | 'gold' | 'success' | 'warning'`).
- Ensure all dates and month strings follow format `YYYY-MM` (e.g. `2026-03`).
- In Material UI v9, ensure dialogs use `slotProps={{ paper: { sx: ... } }}` and inputs use `slotProps={{ inputLabel: { shrink: true } }}`.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":13057,"specSha256":"cf90af9f3e8b3fb8d784fd62277d1a33e3a4ec132e761ec1fa63ae6ddcb3b347","branch":"refs/heads/feature/monthly-activity-aggregator-and-leaderboard-system","head":"0d70810781bbdf84a6905064c434c4cb7adedaae","baseRef":"refs/heads/main","baseCommit":"0d70810781bbdf84a6905064c434c4cb7adedaae","sourceTree":"c515e42bedbeaf62a9cc4ae0803f91c5ee9f3ed5","absentOptional":[]} -->
