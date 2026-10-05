# Feature: Book Summary Moderation & Gamification Scoring (Web & API)

**From build-plan:** feature 7
**Build attempt:** 1
**Branch:** feature/book-summary-moderation-and-gamification-scoring
**Status:** verified

## Goal
Build the student book summary moderation queue, submission pipeline, librarian feedback scoring system (+2 to +10 points), and atomic multi-collection gamification point crediting across Patron and MonthlyActivity records, with dual-mode REST APIs and an interactive staff review workspace.

## In scope
- **Data Model & Gamification Points Engine:**
  - Utilize `BookSummary` schema (`patronId`, `patronBarcode`, `patronName`, `bookId`, `bookTitle`, `bookBarcode`, `summary`, `keyLearnings`, `rating`, `status`, `points`, `feedback`, `reviewedBy`, `reviewDate`).
  - Strict submission validation:
    1. Patron exists, `active === true`, and not deleted.
    2. Book exists in catalog.
    3. Compound uniqueness: Only one summary per patron per book (`{ patronBarcode, bookBarcode }`).
    4. Minimum length: Summary text must be at least 100 characters.
    5. Star rating: 1 to 5 integer.
  - Initial submission status: `status = 'pending'`.
  - Atomic multi-collection scoring on review approval:
    1. Update `BookSummary`: `status = 'approved'`, `points = pointsAwarded` (integer between 2 and 10), `feedback`, `reviewDate = now`, `reviewedBy = staffUser._id / name`.
    2. Atomically increment `Patron.points` by `pointsAwarded`.
    3. Atomically upsert `MonthlyActivity` for current year/month:
       - Increment `summariesApproved` by 1.
       - Increment `pointsFromSummaries` by `pointsAwarded`.
       - Increment `totalPoints` by `pointsAwarded`.
       - Increment `activityScore` by `pointsAwarded`.
  - Review rejection flow:
    1. Require feedback explaining rejection reason (e.g. insufficient substance, plagiarism, illegible).
    2. Update `BookSummary`: `status = 'rejected'`, `points = 0`, `feedback`, `reviewDate = now`, `reviewedBy = staffUser`.
- **REST API Endpoints:**
  - `GET /api/summaries` - Filterable, paginated audit list of summaries (`status`, `search`, `page`, `limit`).
  - `POST /api/summaries` - Submit book summary on behalf of patron or from companion app.
  - `GET /api/summaries/queue` - Active moderation queue of pending submissions with borrower and catalog metadata.
  - `GET /api/summaries/stats` - Live metrics: Total pending, approved, rejected, and total gamification points awarded.
  - `GET /api/summaries/[id]` - Retrieve full details of a specific summary.
  - `POST /api/summaries/[id]/review` - Moderate summary with approval (scoring 2–10 pts + feedback) or rejection (feedback mandatory).
- **Web UI & Moderation Workspace (`/summaries`):**
  - **Metric Stat Cards:**
    - Pending Review (with attention amber highlight).
    - Approved Summaries (emerald green).
    - Rejected Summaries (slate / muted).
    - Total Points Awarded (academic gold with trophy icon).
  - **Moderation Queue Tab:**
    - Visual queue of pending submissions with student name, class, book title, submission timestamp.
    - Interactive Review Modal / Drawer:
      - Student Passport Card: Passport photo, full name, barcode, school class, current total points.
      - Book Information Card: Cover thumbnail, title, author, barcode, Dewey class.
      - Summary Content Reader: Student's rating (1–5 stars), key learnings, full summary text with character count.
      - Gamification Point Selector: Quick score presets (+2 Basic, +5 Good, +8 Great, +10 Exceptional) + custom 2–10 point slider/input.
      - Librarian Feedback field.
      - Action buttons: **Approve & Award Points** (primary green) and **Reject with Feedback** (danger red).
  - **All Summaries History Tab:**
    - Filterable table using `DZFDataTable` with status filter tabs (`all`, `approved`, `pending`, `rejected`), search by student/book, points pill, and reviewer information.
  - **Manual Summary Entry Modal:**
    - Allows librarians to register student-written paper summaries directly into the digital queue.
  - **Navigation Integration:**
    - Active navigation badge for `summaries` in `AppShell` with dynamic pending count.

## Out of scope
- Barcode attendance scanning for daily visitors and digital academy classes (Feature 8).
- Monthly leaderboard podium view and champion tier calculations (Feature 9).
- Cohort academy rosters and Google Sheets synchronization (Feature 10).
- Student self-service web portal (patrons submit through staff terminal or companion mobile client).

## Build loop
- **Step review:** `feature` (one consolidated review packet after completing small implementation steps).
- **Checkpoint commits:** `disabled`.
- **Merge approval:** Stop for explicit approval before squash merging into `main`.

## Build steps
- [x] 1. **Book Summary Domain Service & Multi-Collection Gamification Engine**
   - Implement `src/lib/summaries/service.ts` encapsulating submission validation, pending queue queries, approval point crediting, rejection handling, and atomic updates to `BookSummary`, `Patron`, and `MonthlyActivity`.
   - *Done when:* Calling review approval updates summary to approved, increments patron points, and updates monthly activity counters atomically.

- [x] 2. **Summaries REST API Endpoints**
   - Implement `GET /api/summaries`, `POST /api/summaries`, `GET /api/summaries/queue`, `GET /api/summaries/stats`, `GET /api/summaries/[id]`, and `POST /api/summaries/[id]/review`.
   - Enforce staff authentication (`librarian`, `admin`, `ict`) and mobile bearer token compatibility.
   - *Done when:* `GET /api/summaries/stats` returns accurate counts and `POST /api/summaries/[id]/review` validates point ranges (2–10) with 200 OK.

- [x] 3. **Interactive Moderation Queue & Review Modal Component**
   - Implement `src/components/summaries/ModerationQueue.tsx` with card-based pending queue, passport photo card, book details, full text viewer, gamification point score picker (+2 to +10), and 1-click approve/reject actions.
   - Implement `src/components/summaries/SubmitSummaryModal.tsx` for staff entry of paper summaries.
   - *Done when:* Clicking a pending submission opens the review modal, and approving awards points and removes the item from the queue without full page reload.

- [x] 4. **Summary History & Audit Ledger Table**
   - Implement `src/components/summaries/SummaryHistoryTable.tsx` using `DZFDataTable`, `DZFBadge`, status filter tabs (`All`, `Approved`, `Pending`, `Rejected`), and search input.
   - *Done when:* Table renders live `dzuelsDB.booksummaries` records with real-time status and points display.

- [x] 5. **Summaries Workspace Page (`/summaries`) & AppShell Navigation**
   - Build `src/app/summaries/page.tsx` and `src/app/summaries/SummaryClient.tsx` featuring stat cards, moderation queue tab, and audit history tab.
   - Wire route active state in `src/components/layout/AppShell.tsx`.
   - *Done when:* Visiting `/summaries` displays real database summaries, pending queue, and stat cards.

- [x] 6. **End-to-End Verification & Production Build**
   - Run type safety: `npx tsc --noEmit`.
   - Run linter: `npm run lint`.
   - Run production compilation: `npm run build`.
   - *Done when:* All checks exit with 0 errors and all summaries routes compile cleanly.

## Files / areas
- `src/lib/summaries/service.ts` (Core domain logic, validation, and multi-collection point crediting)
- `src/app/api/summaries/route.ts` (Summary listing and submission API)
- `src/app/api/summaries/queue/route.ts` (Pending moderation queue API)
- `src/app/api/summaries/stats/route.ts` (Summary statistics and point totals API)
- `src/app/api/summaries/[id]/route.ts` (Single summary details API)
- `src/app/api/summaries/[id]/review/route.ts` (Moderation approval/rejection API)
- `src/components/summaries/ModerationQueue.tsx` (Queue cards and interactive scoring modal)
- `src/components/summaries/SummaryHistoryTable.tsx` (Complete audit ledger table)
- `src/components/summaries/SubmitSummaryModal.tsx` (Manual paper summary submission modal)
- `src/components/summaries/index.ts` (Barrel export)
- `src/app/summaries/page.tsx` (Server page prefetching stats)
- `src/app/summaries/SummaryClient.tsx` (Client workspace)
- `src/components/layout/AppShell.tsx` (Navigation item route mapping)

## Data / contracts
- **Validation Rules:**
  - Minimum summary length: 100 characters.
  - Rating: 1 to 5 integer stars.
  - Compound unique constraint: `{ patronBarcode: 1, bookBarcode: 1 }` (only one summary per book per patron).
- **Gamification Scoring:**
  - Valid approved score range: +2 to +10 points.
  - Score tiers: Basic (+2), Good (+5), Great (+8), Exceptional (+10).
  - Rejection: 0 points awarded, feedback mandatory.
- **Atomic Persistence:**
  - `BookSummary`: status, points, feedback, reviewedBy, reviewDate.
  - `Patron`: increment `points` by approved score.
  - `MonthlyActivity`: increment `summariesApproved`, `pointsFromSummaries`, `totalPoints`, `activityScore`.

## Testing
- Automated code checks: `npx tsc --noEmit` and `npm run lint`.
- Production build: `npm run build`.
- Live API validation: Query `GET /api/summaries/queue` and test review workflow against MongoDB.

## Notes for the AI
- Zero placeholders: Query real `dzuelsDB.booksummaries` (which contains existing live records).
- Always synchronize `Patron.points` and `MonthlyActivity` atomically upon approval so leaderboard rankings stay consistent.
- Provide responsive feedback and auto-refresh queue counts when a review action completes.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":9568,"specSha256":"b75f1fa2469de9f42bb8ab8808a91ea239d093a67ca3776fa8a066b96f33bf65","branch":"refs/heads/feature/book-summary-moderation-and-gamification-scoring","head":"84388015bd270c98d8e751e1339be242e41cc227","baseRef":"refs/heads/main","baseCommit":"84388015bd270c98d8e751e1339be242e41cc227","sourceTree":"bf33a0fa3639aa2e8bb27cf4a698f24cdd74fb76","absentOptional":[]} -->
