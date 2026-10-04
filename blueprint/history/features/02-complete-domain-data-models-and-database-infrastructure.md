# Feature: Complete Domain Data Models & Database Infrastructure

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/complete-domain-data-models-and-database-infrastructure
**Status:** verified

## Goal

Establish the cached singleton MongoDB connection infrastructure (`src/lib/db.ts`) and create fully-typed TypeScript Mongoose models under `src/models/` for all 15 production domain schemas plus an atomic sequence `Counter` model. Resolve all audit-identified schema bugs (typos, invalid enum defaults, duplicate arrays, and model re-registration hacks) while adding required compound indexes, type contracts, and relationship helpers.

## Design reference

- `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md` (Section 4.4 & Section 6.2):
  - Model corrections:
    - `Patron`: fix `schoolAdress` -> `schoolAddress`, rename `is18` -> `isDeleted`, remove duplicate `returnedAt` in history, add indexes `{ barcode: 1 }` (unique), `{ active: 1, isDeleted: 1 }`.
    - `Cataloging`: consolidate `checkedOutHistory` and `patronsCheckedOutHistory`, add unique indexes `{ barcode: 1 }` and `{ controlNumber: 1 }`, index `{ isCheckedOut: 1, checkedOutBy: 1 }`.
    - `Task`: fix status default from `'To Do'` to `'todo'` matching the enum.
    - `Library` (Circulation): fix `require: true` to `required: true`, remove `mongoose.deleteModel` hack.
    - `Requisition`: fix `quautity` typo to `quantity`.
    - `Attendance`: align points default to 20, compound unique index `{ patronBarcode: 1, className: 1, classDate: 1 }`.
    - `MonthlyActivity`: compound unique index `{ patronId: 1, monthYear: 1 }`.
    - `TranscommArticle`: unique slug index, DRNICER value enum validation.
    - `Counter`: atomic sequence collection eliminating `countDocuments()` race condition.
- `blueprint/context/project-overview.md` (Data model section): Exact schemas for User, Patron, Cataloging, Library, Inventory, BookSummary, Attendance, Cohort, CohortGroup, Competition, MonthlyActivity, TranscommArticle, Requisition, Task, Event.

## In scope

- MongoDB connection infrastructure:
  - Install `mongoose` and define connection caching in `src/lib/db.ts`.
  - Cached singleton connection pool (`global.mongoose = { conn, promise }`) preventing socket exhaustion during Next.js Turbopack fast refresh and serverless invocations.
  - Safe error handling and connection state diagnostics (`readyState` helper).
- 15 production domain models plus atomic counter in `src/models/`:
  - `User.ts` (Staff accounts, bcrypt password hash field, roles: `admin | librarian | cohort_lead | transcomm_author`)
  - `Patron.ts` (Students, teachers, staff, guests, unique barcode, `schoolAddress`, `isDeleted`, Cloudinary `image_url`)
  - `Cataloging.ts` (Library books/monographs, Dewey decimal, consolidated loan history, unique barcode & controlNumber)
  - `Library.ts` (Active circulation loan transactions, dueDate, renewalsCount, status: `borrowed | returned | overdue | lost`)
  - `Inventory.ts` (Physical copies, itemBarcode, condition, status)
  - `BookSummary.ts` (Patron book summaries, moderation queue, pointsAwarded, status: `pending | approved | rejected`)
  - `Attendance.ts` (Daily library and cohort attendance, classType, classDate YYYY-MM-DD, compound unique index)
  - `Cohort.ts` & `CohortGroup.ts` (Digital literacy cohorts, student rosters, Google Sheets sync metadata)
  - `Competition.ts` (Reading competition sessions, categories SS1-3 to P1-6, participant grading rubrics)
  - `MonthlyActivity.ts` (Monthly gamified scores aggregator, compound unique index patronId + monthYear, rank tiers)
  - `TranscommArticle.ts` (DRNICER leadership values articles, slug, published state)
  - `Requisition.ts` (Staff expenditure requisitions, estimatedCost, status)
  - `Task.ts` (Staff operational tasks, corrected 'todo' default, priority)
  - `Event.ts` (Library and foundation calendar events, targetAudience)
  - `Counter.ts` (Atomic sequence generator for patron barcodes and sequence numbers)
- Barrel export in `src/models/index.ts`.
- Verification route:
  - `src/app/api/health/db/route.ts`: Database health check endpoint verifying connection and schema compilation.

## Out of scope

- Staff login form, bcrypt password hashing logic, JWT generation, and cookie authentication middleware (Feature 3).
- Patron webcam capture and Cloudinary SDK photo upload pipeline (Feature 4).
- Real book acquisition wizard form and UI views (Feature 5).
- Google Sheets API v4 service account credentials synchronization (Feature 10).

## Build loop

- `workflow.stepReview`: `"feature"` (implement all steps in sequence, then pause for comprehensive review).
- `workflow.checkpointCommits`: `"disabled"` (work committed on feature branch upon approval).
- Verify command: `npm run lint && npx tsc --noEmit && npm run build`

## Build steps

- [x] 1. **Database Connection Pool & Infrastructure** - Install `mongoose` and create `src/lib/db.ts` implementing a cached singleton connection pool (`global.mongoose`), handling connection state, error logging, and graceful disconnects.
  - *Done when:* `src/lib/db.ts` compiles cleanly and exports `connectDB()` returning a cached Mongoose connection.
- [x] 2. **Core Library Domain Models: User, Patron & Cataloging** - Implement `src/models/User.ts`, `src/models/Patron.ts`, and `src/models/Cataloging.ts` with TypeScript interfaces, document types, enum constants, validated field schemas, and unique indexes (fixing `schoolAddress`, `isDeleted`, and history array consolidation).
  - *Done when:* The three models compile with strict TypeScript types, exported Document interfaces, and compound indexes.
- [x] 3. **Circulation & Inventory Models: Library, Inventory & BookSummary** - Implement `src/models/Library.ts` (Circulation loan transactions with corrected `required` validation), `src/models/Inventory.ts` (physical item copies), and `src/models/BookSummary.ts` (moderation queue, pointsAwarded, status enums).
  - *Done when:* Models export typed schemas with population references (`ref: 'Patron'`, `ref: 'Cataloging'`, `ref: 'User'`) and pass typecheck.
- [x] 4. **Academy & Gamification Models: Attendance, Cohort, CohortGroup & MonthlyActivity** - Implement `src/models/Attendance.ts` (with start-of-day unique index and aligned 20-point default), `src/models/Cohort.ts` (student subdocuments), `src/models/CohortGroup.ts`, and `src/models/MonthlyActivity.ts` (with unique compound index `{ patronId: 1, monthYear: 1 }`).
  - *Done when:* Models compile without type errors and enforce unique compound keys preventing duplicate attendance and monthly score duplication.
- [x] 5. **Competitions, Publishing & Administrative Models: Competition, TranscommArticle, Requisition, Task, Event & Counter** - Implement `src/models/Competition.ts` (sessionKey, categories SS1-3 to P1-6), `src/models/TranscommArticle.ts` (slug, DRNICER values), `src/models/Requisition.ts` (corrected `quantity`), `src/models/Task.ts` (corrected `'todo'` default), `src/models/Event.ts`, and `src/models/Counter.ts` (atomic counter for collision-free sequential IDs).
  - *Done when:* All administrative models compile cleanly and barrel export from `src/models/index.ts`.
- [x] 6. **Database Health Route & Model Registry Verification** - Create `src/app/api/health/db/route.ts` importing all 15 models, validating schema compilation, and reporting connection readiness. Run typecheck and production build to verify zero compile or packaging errors.
  - *Done when:* `npx tsc --noEmit` and `npm run build` succeed with exit code 0.

## Files / areas

- `package.json` - add `mongoose` dependency
- `src/lib/db.ts` - cached singleton MongoDB connection helper
- `src/models/User.ts` - staff user schema and model
- `src/models/Patron.ts` - patron schema, indexes, and model
- `src/models/Cataloging.ts` - catalog monograph inventory schema
- `src/models/Library.ts` - circulation loan transactions schema
- `src/models/Inventory.ts` - item copy tracking schema
- `src/models/BookSummary.ts` - patron book summary submission schema
- `src/models/Attendance.ts` - daily scanner attendance logging schema
- `src/models/Cohort.ts` - digital literacy cohort schema
- `src/models/CohortGroup.ts` - cohort grouping schema
- `src/models/Competition.ts` - reading competition sessions schema
- `src/models/MonthlyActivity.ts` - monthly score aggregation schema
- `src/models/TranscommArticle.ts` - DRNICER values editorial schema
- `src/models/Requisition.ts` - staff expenditure requisitions schema
- `src/models/Task.ts` - internal operational tasks schema
- `src/models/Event.ts` - library calendar events schema
- `src/models/Counter.ts` - atomic sequence counter schema
- `src/models/index.ts` - barrel export of all domain models
- `src/app/api/health/db/route.ts` - database health check Route Handler

## Data / contracts

- MongoDB URI resolution:
  - Primary: `process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI`
  - Fallback: `mongodb://127.0.0.1:27017/dzuelsDB`
- Model registration pattern:
  ```typescript
  import mongoose, { Model, Schema } from 'mongoose';
  export const ModelName: Model<IModelDoc> =
    mongoose.models.ModelName || mongoose.model<IModelDoc>('ModelName', ModelSchema);
  ```
- Atomic Counter contract:
  - `Counter.getNextSequence(sequenceName: string, prefix?: string): Promise<string>`
  - Atomically increments sequence and formats zero-padded string (e.g. `20260001`).

## Testing

- Typecheck verification: `npx tsc --noEmit`
- Linter verification: `npm run lint`
- Production build compilation: `npm run build`
- API Route verification: `GET /api/health/db` responding with registered models and connection status.

## Notes for the AI

- Next.js 16 Route Handlers under App Router use Web standard `Request` and `Response` / `NextResponse`.
- Always guard model compilation with `mongoose.models[name] || mongoose.model(...)` to prevent Mongoose `OverwriteModelError` during hot reloads.
- Do not call `mongoose.deleteModel()`.
- Use Mongoose timestamps `{ timestamps: true }` for automated `createdAt` and `updatedAt` tracking.
- Ensure all indexes match query patterns in `project-overview.md` and `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`.

## Open questions

*None. All 15 schema definitions, bug fixes, and database infrastructure requirements are fully detailed in the project overview and audit specification.*


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10395,"specSha256":"c576e1cf1d11897837b0c31279b3d68b5f8d1fe6d7757ec92c05c3d2c9e44782","branch":"refs/heads/feature/complete-domain-data-models-and-database-infrastructure","head":"c1ac5cee26d6975f3737d5a219443bee9f5681d6","baseRef":"refs/heads/main","baseCommit":"c1ac5cee26d6975f3737d5a219443bee9f5681d6","sourceTree":"a40a7c2f400010cd75b0d1e213d8581456b283ef","absentOptional":[]} -->
