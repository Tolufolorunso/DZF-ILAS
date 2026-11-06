# Feature 44: Student Roster Laptop Allocation & Pair Programming Pairing Engine

**From build-plan:** feature 44
**Build attempt:** 1
**Branch:** feature/student-roster-laptop-allocation-pair-programming-pairing-engine
**Status:** verified

## Goal

Provide a robust hardware allocation and student pairing system on `/dashboard/cohorts` for active digital literacy cohorts, allowing instructors to assign physical laptops (numbered 1 through 15) to students, strictly enforcing a maximum capacity of two students per laptop, displaying partner names and real-time occupancy status badges, and offering seamless inline assignment and unassignment controls.

## In scope

1. **Schema Extension & Validation:**
   - Extend `Cohort` schema and interface with `assignedLaptop?: number | null` (integer constraint: 1 to 15, or null when unassigned).
   - Add index on `{ cohortType: 1, assignedLaptop: 1, active: 1 }`.

2. **Laptop Allocation Backend Logic & REST API:**
   - Update `updateStudentStatus` in `src/lib/cohorts/service.ts`:
     - Accept `assignedLaptop?: number | null`.
     - Enforce the 2-student capacity limit per laptop per cohort. If a laptop already has 2 active students assigned, reject the assignment with a clear 400 error.
     - Allow unassigning by passing `null` or `0`.
   - Update `PATCH /api/cohorts/[cohortType]/students/[barcode]` to handle `assignedLaptop` updates.
   - Update `getCohortStudents` in `src/lib/cohorts/service.ts` to enrich student records with `assignedLaptop`, `pairedStudentName`, `laptopOccupancy` (0, 1, or 2), and return a `laptopAllocations` summary (status of all 15 laptops).

3. **Student Roster Laptop UI (`/dashboard/cohorts`):**
   - Add a dedicated **"Assigned Laptop"** column to the Student Roster table on `/dashboard/cohorts`.
   - Render laptop badges for each student:
     - When unassigned: gray chip `Unassigned` with quick-assign button.
     - When assigned: laptop badge (e.g. `💻 Laptop 3`) + occupancy chip (`1/2 Available` in amber or `2/2 Paired` in green).
     - Partner student name tooltip or subtitle (e.g. `Paired with: John Doe`).
   - Inline allocation selector:
     - Dropdown selector displaying options `Unassign`, `Laptop 1 (0/2)`, `Laptop 2 (1/2 with [Partner])`, etc., automatically disabling any laptop that already has 2 students assigned.
     - Instant optimistic UI update with live feedback notification.
   - Cohort Hardware Overview bar or KPI card displaying:
     - Total Laptops in Use: `X / 15`
     - Available Laptops: `Y`
     - Students with Laptops: `Z / Total`

## Out of scope

- Physical barcode scanning for laptops (laptops are designated 1–15).
- Morning/Afternoon timeslots (user explicitly specified: no shifts/timeslot divisions).
- Assigning more than 2 students to a laptop (strict maximum 2 students per machine).

## Build loop

- `workflow.stepReview`: feature
- `workflow.checkpointCommits`: disabled

## Build steps

- [x] 1. **Extend Cohort Schema & Data Models:**
  - Update `src/models/Cohort.ts` with `assignedLaptop?: number | null` (min 1, max 15) and index.
  - Update `EnrichedStudent` in `src/lib/cohorts/service.ts` with `assignedLaptop`, `pairedStudentName`, and `laptopOccupancy`.
  - *Done when:* `npx tsc --noEmit` passes with the updated schema and model types.

- [x] 2. **Laptop Allocation Business Logic & Capacity Validation:**
  - Update `updateStudentStatus` in `src/lib/cohorts/service.ts` to validate laptop number (1–15), enforce the max 2-student capacity constraint per cohort, and record allocation.
  - Update `getCohortStudents` to resolve paired partner names and occupancy counts for each student and compute cohort-level laptop allocation stats.
  - Update `PATCH /api/cohorts/[cohortType]/students/[barcode]` to accept `assignedLaptop`.
  - *Done when:* API rejects assignment when laptop capacity is full (2 students) and successfully assigns/unassigns valid laptops.

- [x] 3. **Laptop Allocation Selector & Partner Display UI (`/dashboard/cohorts`):**
  - Update `src/app/dashboard/cohorts/CohortClient.tsx`:
    - Add "Assigned Laptop" column in the Student Roster table.
    - Display laptop badge, partner name, and occupancy status (`0/2`, `1/2`, `2/2 Full`).
    - Provide inline dropdown selector allowing instructors to allocate or change laptops, disabling full laptops.
    - Add a Cohort Laptop Fleet metric/card or summary badge showing overall laptop utilization (out of 15).
  - *Done when:* Instructors can assign, reassign, or unassign laptops for any student directly in the roster table, with real-time capacity and partner feedback.

- [x] 4. **End-to-End Verification & Health Checks:**
  - Run `npx tsc --noEmit` and `npm run build`.
  - Verify that no laptop can exceed 2 students.
  - Verify that partner pairing is correctly displayed mutually between paired students.
  - *Done when:* Production build passes cleanly with code 0.

## Files / areas

- `src/models/Cohort.ts` - Extend schema with `assignedLaptop`.
- `src/lib/cohorts/service.ts` - Update student enrichment, partner pairing, and capacity validation.
- `src/app/api/cohorts/[cohortType]/students/[barcode]/route.ts` - Support `assignedLaptop` patch.
- `src/app/dashboard/cohorts/CohortClient.tsx` - Laptop column, partner badges, and dropdown selector.
- `src/components/ui/DZFIcons.tsx` - Added `LaptopIcon`.
- `src/app/dashboard/cohorts/page.tsx` - Updated student roster type definitions.

## Data / contracts

- **`Cohort` model extension:**
  - `assignedLaptop?: number | null` (min 1, max 15, default null)

- **Student record enrichment:**
  - `assignedLaptop?: number | null`
  - `pairedStudentName?: string | null`
  - `laptopOccupancy: number` (0 = unassigned, 1 = paired with 1 seat free, 2 = full capacity)

- **API Request: `PATCH /api/cohorts/[cohortType]/students/[barcode]`:**
  - Body:
    ```json
    {
      "assignedLaptop": 3
    }
    ```
    or to unassign:
    ```json
    {
      "assignedLaptop": null
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Student laptop allocation updated to Laptop 3.",
      "student": { ... }
    }
    ```
  - Capacity Error Response (HTTP 400):
    ```json
    {
      "success": false,
      "error": "Laptop 3 is already at maximum capacity (2 students assigned: John Doe, Jane Smith). Please select another laptop."
    }
    ```

## Testing

- Typecheck: `npx tsc --noEmit` (Passed with code 0)
- Production Build: `npm run build` (Passed with code 0, 44 routes generated)

## Notes for the AI

- Zero AI attribution in Git commits or PRs (no `Co-Authored-By` or AI tool signatures).
- Strictly enforce 1–15 laptop range and max 2 students per laptop.
- Mutual pairing: if Student A is assigned Laptop 3, and Student B is assigned Laptop 3, Student A's partner is Student B and vice versa.

