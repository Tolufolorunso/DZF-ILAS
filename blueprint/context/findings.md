# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.



### F-04 [P2] open - Privilege escalation and hierarchy bypass in staff role modification

**File:** src/app/api/admin/users/[id]/role/route.ts:31
**Found:** 2026-10-07 by /audit (scope: full; lens: security)
**Why it matters:** In `PATCH /api/admin/users/[id]/role`, any user satisfying `canActivateStaff` (`ima`, `country_manager`, or `admin`) can assign ANY role from `ALL_ROLES`. An `admin` (rank 50) can assign `role: 'ima'` (rank 70) or `role: 'country_manager'` (rank 60), or promote their own account to `ima`.
**Suggested fix:** Enforce `ROLE_HIERARCHY_RANK` so an administrator can only assign roles strictly lower than or equal to their own rank, and forbid self-role modification.
**Resolution:**

### F-05 [P2] open - RBAC policy drift in circulation checkout and check-in endpoints

**File:** src/app/api/circulations/check-out/route.ts:19
**Found:** 2026-10-07 by /audit (scope: full; lens: quality)
**Why it matters:** `check-out/route.ts` and `check-in/route.ts` hardcode `const allowedRoles = ['admin', 'librarian', 'ict']` instead of importing and calling `canManageCirculation(auth.role)` from `src/lib/auth/rbac.ts`. Consequently, `asst_admin` (who is authorized under `CIRCULATION_ROLES`) is denied checkout/checkin access with HTTP 403.
**Suggested fix:** Import and use `canManageCirculation(auth.role)` from `src/lib/auth/rbac.ts` in both circulation Route Handlers.
**Resolution:**

### F-06 [P2] open - Mass assignment risk in patron profile update handler

**File:** src/app/api/patrons/[id]/route.ts:144
**Found:** 2026-10-07 by /audit (scope: full; lens: security)
**Why it matters:** `PUT /api/patrons/[id]` only deletes `barcode` and `_id` before passing `{ $set: body }` directly to `Patron.findByIdAndUpdate`. Arbitrary schema attributes such as `points`, `isDeleted`, or `registeredBy` can be manipulated without domain validation.
**Suggested fix:** Validate update payloads against an explicit allowlist or Zod schema containing only mutable profile fields (`firstname`, `surname`, `middlename`, `email`, `phoneNumber`, `gender`, `address`, `dateOfBirth`, `studentSchoolInfo`, `parentInfo`, `employerInfo`, `image_url`).
**Resolution:**
