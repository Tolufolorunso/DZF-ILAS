# Fix: Multi-Period Circulation Trend & Full Horizon Breakdown

**Type:** Fix
**Status:** verified
**Branch:** fix/fix-multi-period-circulation-trend-and-history-breakdown

## The problem

When staff select a multi-month or multi-week time horizon (e.g. 3 Months or multi-week periods) on `/dashboard/circulations`, the Circulation Activity Trend appears to show figures for only one month, with other months appearing blank or missing expected checkouts/returns:
1. **Granularity override bug:** In `src/app/api/circulations/analytics/route.ts`, interval bucketing was driven solely by an arbitrary `diffDays <= 70` rule rather than respecting the user's explicit selection (`unit=months` vs. `unit=weeks`). As a result, selecting 1 or 2 months forced weekly intervals, selecting 12 weeks forced monthly intervals, and multi-month selections did not allow toggling between month-by-month and week-by-week distributions.
2. **Missing historical circulation data:** The analytics endpoint queried only the new `Library` collection (which currently contains only 1 recent record from Oct 5, 2026). Pre-existing historical circulation transactions are stored in `Cataloging.patronsCheckedOutHistory` (40 checkouts across 2024–2026, including May, June, and earlier months). Because these were not included, multi-month horizons (e.g. 3 or 6 months) returned 0 checkouts/returns for those months.
3. **Lack of sub-period granularity toggle in UI:** When viewing 3 or 6 months, staff had no option to toggle between monthly overview and all constituent weeks, making the trend view rigid and coarse.

## The fix

1. **Unify `Library` and `Cataloging.patronsCheckedOutHistory` Data Sources in `route.ts`:**
   - In `src/app/api/circulations/analytics/route.ts`, aggregate circulation transactions from both `Library` documents and `Cataloging.patronsCheckedOutHistory` records within the computed date horizon (`fromDate` to `toDate`).
   - Deduplicate overlapping loans based on `bookBarcode` and checkout timestamp.
   - Aggregate checkouts, returns, top books, Dewey Decimal categories, and patron demographics across all historical and live loan data.

2. **Explicit Horizon & Granularity Support in `route.ts`:**
   - Support `granularity` query parameter (`'month'` | `'week'` | `'day'`) alongside `unit` and `amount`.
   - When `unit === 'months'`:
     - If `granularity` is not explicitly set, default to `'month'` for `amount > 1` (or `'week'` for `amount === 1`).
     - Generate continuous, unbroken buckets for all months or weeks in the horizon.
   - When `unit === 'weeks'`:
     - If `amount > 1`, generate continuous weekly buckets for all weeks in the horizon (e.g., Week 1 through Week N).
     - If `amount === 1`, generate 7 daily buckets for every day of that week.
   - Accurately map loan checkouts and returns into their respective date buckets using normalized timestamps.

3. **Trend Granularity Controls & All-Period Rendering in `BorrowingStatisticsStudio.tsx`:**
   - In the Circulation Activity Trend card, add a Granularity toggle (`By Month` / `By Week`) when viewing multi-month horizons (e.g. 2, 3, 6 months, All Time).
   - Display all periods (months or weeks) clearly with distinct labels (e.g. "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026" or "Week 1", "Week 2"...), showing exact loan checkouts and returns.

## Build steps

- [x] 1. **Unify Loan Data Sources and Refactor Interval Bucketing in `src/app/api/circulations/analytics/route.ts`**
  - Incorporate `Cataloging.patronsCheckedOutHistory` transactions alongside `Library` loans, deduplicating records by barcode and date.
  - Implement explicit interval selection respecting `unit`, `amount`, and optional `granularity` parameter.
  - Ensure all months and weeks within the selected horizon are generated as continuous trend buckets with correct checkout and return counts.
  - *Done when:* `GET /api/circulations/analytics?unit=months&amount=3` returns data containing all months in the 3-month window with unified loan data from both collections, and `granularity=week` returns all constituent weeks.

- [x] 2. **Update `BorrowingStatisticsStudio.tsx` with Granularity Toggle & Full Trend Visibility**
  - Add `granularity` state (`'month'` | `'week'`) to `BorrowingStatisticsStudio.tsx`.
  - Add segmented granularity toggle button (e.g. "Monthly View" vs "Weekly View") to the Circulation Activity Trend card when multi-month presets/durations are selected.
  - Ensure every month and week in the horizon renders cleanly with comparative checkouts and returns bars.
  - *Done when:* Selecting 3 Months displays all months (and can toggle to show all weeks), correctly rendering checkouts and returns across all periods.

- [x] 3. **Verify Typecheck and Production Build**
  - Run `npx tsc --noEmit` to verify zero TypeScript errors.
  - Run `npm run build` to confirm successful compilation.
  - *Done when:* Both commands exit with code 0.

## Verify

1. Open `/dashboard/circulations` and click the **Borrowing Statistics** tab.
2. Select **3 Mos**: verify the trend displays all months in the 3-month window with their checkout and return metrics.
3. Toggle to **Weekly View**: verify all constituent weeks across the 3-month horizon are rendered.
4. Select **6 Mos** and **All Time**: verify historical loans (including 2025/2026 from cataloging records) appear in checkouts, returns, top books, and category distributions.

