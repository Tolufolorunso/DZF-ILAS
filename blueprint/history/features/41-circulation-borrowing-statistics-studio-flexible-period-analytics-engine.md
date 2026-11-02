# Feature: Circulation Borrowing Statistics Studio & Flexible Period Analytics Engine

**From build-plan:** feature 41
**Build attempt:** 1
**Branch:** feature/circulation-borrowing-statistics-studio-flexible-period-analytics-engine
**Status:** verified

## Goal

Add a dedicated 5th tab ("Borrowing Statistics") to the Circulation workspace (`/dashboard/circulations`) providing comprehensive, multi-period borrowing intelligence. Staff can analyze book checkout patterns across unconstrained time horizons (arbitrary weeks, months, custom numeric durations like 1, 2, 3, 4, 5, 6, 7, 8, 9+, and standard presets) with full visibility into loan KPIs, volume trends, top borrowed monographs, patron demographics, Dewey Decimal subject distributions, and timely return gamification performance.

## In scope

1. **Flexible Circulation Analytics REST API (`GET /api/circulations/analytics`):**
   - Query parameters: `unit` (`'weeks'` | `'months'`), `amount` (numeric, e.g. 1–99), or optional `startDate` and `endDate` ISO strings.
   - Defaults: `unit=months`, `amount=1` (1 month window).
   - Dynamic boundary computation: calculates `fromDate` based on the specified duration up to the current date/time.
   - High-performance aggregation pipeline on `Library`, `Cataloging`, and `Patron` collections:
     - **Summary KPIs:** Total loans issued in period, total returns processed, on-time return count & rate (%), late returns, active overdues count & delinquency rate (%), and average loan duration (days).
     - **Volume Trends:** Adaptive chronological intervals (daily if window ≤ 14 days, weekly if window ≤ 60 days, monthly if window > 60 days) tracking loan checkout and return volume.
     - **Top Borrowed Books:** Top 10 monographs ranked by checkout count with title, author, Dewey Decimal class, borrow count in period, and current available shelf copies.
     - **Patron Demographic Distribution:** Borrowing volume segmented by patron type (student, teacher, staff, guest) and student grade levels (e.g. Primary 1–6, JSS 1–3, SS 1–3).
     - **Dewey Decimal Category Spread:** Borrowing volume categorized across the 10 standard Dewey Decimal 100-divisions (000–900).
     - **Gamification Incentive Spread:** Distribution of loan returns earning +3 points (on-time), +1 point (1–2 days grace), or 0 points (overdue).
   - Security: Protected by `getSessionUser` ensuring only authenticated staff can access the endpoint.
   - Robustness: Graceful fallback and zero-count payloads when no loans exist in the selected time range.

2. **Borrowing Statistics Studio Component (`src/components/circulations/BorrowingStatisticsStudio.tsx`):**
   - **Time Horizon Controls Toolbar:**
     - Quick preset chips: `1 Week`, `2 Weeks`, `1 Month`, `3 Months`, `6 Months`, `All Time`.
     - Unconstrained custom duration controls: Numeric count input (1, 2, 3, 4, 5, 6, 7, 8, 9, 12, etc.) + Unit selector (`Weeks` | `Months`).
     - Live refresh button with spinner state.
   - **KPI Metric Stat Cards (5 Cards):**
     - Total Borrowings (Navy accent)
     - Total Returns (Success accent)
     - Timely Return Rate % (Gold accent)
     - Active Delinquency Rate % (Maroon accent)
     - Average Loan Duration in days (Info accent)
   - **Chronological Trend Visualizer:**
     - Clean SVG / CSS bar indicators showing checkout volume and checkin velocity across chronological interval buckets.
   - **Two-Column Analytical Intelligence Grid:**
     - *Column 1:* Top Borrowed Books Leaderboard (numbered rank, title, author, Dewey badge, checkout count, and live shelf availability badge).
     - *Column 2:* Dewey Decimal Classification Distribution (proportional progress meters with percentage bars) + Gamified Point Awards breakdown (+3 / +1 / 0 points).
   - **Patron Demographic Breakdown Section:**
     - Visual distribution cards comparing Student vs. Teacher vs. Staff vs. Guest borrowing volume, plus student grade-level bar breakdown.
   - **States:**
     - Skeleton loading state matching card and table geometries during data fetching.
     - Clean empty state (`DZFEmptyState`) when zero loans occurred within the selected window.
     - Error state with alert banner and retry button.

3. **Circulation Client Tab Integration (`src/app/dashboard/circulations/CirculationClient.tsx`):**
   - Add 5th tab: `<Tab label="Borrowing Statistics" icon={<ActivityIcon size={18} />} iconPosition="start" />`.
   - Mount `<BorrowingStatisticsStudio />` under `tab === 4`.
   - Export `BorrowingStatisticsStudio` from `src/components/circulations/index.ts`.

## Out of scope

- Direct modifications to loan issuance, checkout limits, or return processing logic.
- External chart libraries (e.g. Chart.js, Recharts) requiring heavy third-party bundles; use clean, lightweight, native React/CSS/SVG components adhering to DZF design tokens.
- Modification of existing Desk Terminal, Active Loans, Circulation History, or Holds Queue tabs.

## Build loop

- `workflow.stepReview`: `"feature"` (one review packet after all small implementation steps).
- `workflow.checkpointCommits`: `"disabled"` (no intermediate step commits).
- Verify command: `npx tsc --noEmit && npm run build` after all steps complete.

## Build steps

- [x] 1. **Build the Flexible Circulation Analytics REST API (`src/app/api/circulations/analytics/route.ts`)**
  - Implement `GET /api/circulations/analytics` parsing `unit` (`'weeks'` | `'months'`), `amount` (number, default 1), and optional `startDate` / `endDate`.
  - Calculate date boundaries dynamically to cover the requested horizon.
  - Implement MongoDB aggregation queries on `Library`, `Cataloging`, and `Patron` collections for KPIs, trends, top books, patron demographics, Dewey categories, and gamification points.
  - Wrap in authenticated session guard (`getSessionUser`) and structured JSON envelope.
  - *Done when:* Calling `GET /api/circulations/analytics?unit=months&amount=1` returns status 200 with complete summary KPIs, trends, top books, demographics, and Dewey classification spread.

- [x] 2. **Build the Borrowing Statistics Studio Component (`src/components/circulations/BorrowingStatisticsStudio.tsx`)**
  - Create the studio UI featuring the Time Horizon Toolbar (quick presets + numeric count input + unit picker), 5 KPI summary cards, chronological trend visualizer, top borrowed books leaderboard, Dewey subject breakdown, patron demographic cards, and gamification analysis.
  - Implement full loading skeleton, empty state, and error handling with retry capability.
  - Export the component in `src/components/circulations/index.ts`.
  - *Done when:* The component renders all metric sections, handles preset and custom duration changes, fetches from `/api/circulations/analytics`, and displays skeletons while loading.

- [x] 3. **Integrate 5th Tab in `CirculationClient.tsx` (`/dashboard/circulations`)**
  - Update `src/app/dashboard/circulations/CirculationClient.tsx` to add the 5th tab: "Borrowing Statistics" with `ActivityIcon`.
  - Render `<BorrowingStatisticsStudio />` when `tab === 4`.
  - *Done when:* Visiting `/dashboard/circulations` displays 5 tabs, clicking "Borrowing Statistics" switches to the studio view, and all existing 4 tabs continue functioning without regression.

- [x] 4. **End-to-End Verification & Production Build Validation**
  - Run typecheck (`npx tsc --noEmit`) to verify zero TypeScript errors.
  - Run full production build (`npm run build`) to ensure clean compilation and serverless route generation on Next.js 16.
  - *Done when:* Both `npx tsc --noEmit` and `npm run build` exit with code 0.

## Files / areas

- `src/app/api/circulations/analytics/route.ts` - New analytics REST endpoint
- `src/components/circulations/BorrowingStatisticsStudio.tsx` - New analytics studio component
- `src/components/circulations/index.ts` - Export new studio component
- `src/app/dashboard/circulations/CirculationClient.tsx` - 5th tab integration and view mounting

## Data / contracts

- **Query Parameters:**
  ```typescript
  interface AnalyticsQueryParams {
    unit?: 'weeks' | 'months';
    amount?: number;
    startDate?: string;
    endDate?: string;
  }
  ```
- **API Response Payload:**
  ```typescript
  interface CirculationAnalyticsResponse {
    success: boolean;
    data: {
      timeHorizon: {
        unit: 'weeks' | 'months';
        amount: number;
        fromDate: string;
        toDate: string;
      };
      summary: {
        totalCheckouts: number;
        totalReturns: number;
        onTimeReturns: number;
        lateReturns: number;
        onTimeRate: number; // percentage e.g. 92.5
        activeOverdues: number;
        delinquencyRate: number; // percentage
        averageLoanDays: number; // e.g. 4.2
      };
      trends: Array<{
        dateKey: string;
        label: string;
        checkouts: number;
        returns: number;
      }>;
      topBooks: Array<{
        bookId: string;
        title: string;
        author: string;
        barcode: string;
        classification: string;
        checkoutCount: number;
        copiesAvailable: number;
        copiesTotal: number;
      }>;
      patronDemographics: {
        byType: Array<{ type: string; label: string; count: number; percentage: number }>;
        byGradeLevel: Array<{ classGrade: string; count: number }>;
      };
      deweyCategories: Array<{
        deweyClass: string;
        label: string;
        count: number;
        percentage: number;
      }>;
      gamificationPoints: {
        onTime3Pts: number;
        grace1Pt: number;
        overdue0Pts: number;
      };
    };
    error?: string;
  }
  ```

## Testing

- Typecheck: `npx tsc --noEmit`
- Production Build: `npm run build`
- Manual API probe: verify `GET /api/circulations/analytics` responds with valid 200 payload for varying `unit` and `amount` queries.

## Notes for the AI

- Maintain DZF brand palette tokens from `src/theme/colors.ts`: Maroon (`#6f1111`), Scholastic Navy (`#17324d`), Academic Gold (`#cca349`), Slate surfaces, and status colors.
- Follow the Next.js 16 serverless database singleton pattern (`await connectDB()`) in the route handler.
- Do not import external charting packages; use semantic HTML/SVG bars, linear progress meters, and structured cards for clean, lightweight visualization.
- Ensure all numbers are guarded against division by zero (e.g. when `totalCheckouts === 0`, return rate and delinquency rate default to `0`).
