# Feature: Patron Lifecycle Enhancements, Dynamic Registration & Strict RBAC

**From build-plan:** feature 17
**Build attempt:** 1
**Branch:** feature/patron-lifecycle-enhancements-dynamic-registration-strict-rbac
**Status:** verified

## Goal

Enhance the patron management lifecycle with visual identification and strict role-based access control: display passport photo thumbnails in patron list tables, dynamically adapt the registration wizard based on `patronType` (capturing school details such as class and school name, and parent/guardian info including contact and relationship for students), provide an intuitive in-app patron update modal restricted to `admin` and `ict` staff, and enable patron deletion strictly restricted to `admin` with active loan protection.

## In scope

1. **Patron List Passport Photo Thumbnails:**
   - Update `src/app/dashboard/patrons/PatronListClient.tsx` to render the patron's Cloudinary passport photo (`image_url.secure_url`) in the table avatar column.
   - Provide visual fallbacks (initials on maroon badge) when photo is absent, with smooth hover preview / zoom.
   - Ensure thumbnail loads efficiently without layout shift.

2. **Dynamic Patron Registration Wizard:**
   - Update `src/app/dashboard/patrons/register/PatronRegisterClient.tsx` to dynamically condition form sections and fields based on `patronType`:
     - **Student:** Require/show **School Info** (School Name, Class/Grade dropdown: SS1-SS3, JSS1-JSS3, P1-P6, School Address) and **Parent/Guardian Info** (Parent/Guardian Name, Phone Number, Relationship to Patron e.g. Mother/Father/Guardian, Optional Email/Address).
     - **Teacher/Staff:** Show Employer / Institution Name and Department / Subject.
     - **Guest:** Show Community affiliation.
   - Ensure payload accurately populates `studentSchoolInfo`, `parentInfo`, and `employerInfo` matching the Mongoose schema.

3. **Strict RBAC Enforcement for Patron Mutations:**
   - Update `src/lib/auth/rbac.ts` with explicit helper functions:
     - `canUpdatePatron(role)`: restricted to `admin`, `asst_admin`, and `ict`.
     - `canDeletePatron(role)`: restricted strictly to `admin` (and `asst_admin`).
   - Secure `PUT /api/patrons/[id]` to reject unauthorized staff with `403 Forbidden` if role is not in `['admin', 'asst_admin', 'ict']`.
   - Secure `DELETE /api/patrons/[id]` to reject unauthorized staff with `403 Forbidden` if role is not `admin` (or `asst_admin`).

4. **Patron Profile Editing & Safe Deletion Workflow:**
   - Create `src/components/patrons/PatronEditModal.tsx` allowing authorized staff (`admin`, `ict`) to edit patron demographics, contact info, school info, and parent info.
   - Wire "Edit Patron" button into `PatronListClient.tsx` and `PatronDetailModal.tsx` conditionally visible only for `admin` and `ict`.
   - Wire "Delete Patron" button with confirmation dialog into `PatronListClient.tsx` conditionally visible only for `admin`.
   - Implement active loan verification in `DELETE /api/patrons/[id]`: if patron currently has unreturned borrowed books in the Circulation ledger, block deletion with a descriptive error message (`400 Bad Request`).

## Out of scope

- Circulation loan limits and point gamification rules (handled in Feature 18).
- Redesigning the monograph acquisition wizard or Dewey classification (handled in Feature 19).

## Build loop

- Step review policy: `feature` (all steps implemented sequentially, followed by unified verification and review packet).
- Step checkpoint commits: `disabled`.
- Final feature commit and squash merge performed in `/complete`.

## Build steps

- [x] **Step 1: Strict RBAC helpers & API route guards**
  - Add `canUpdatePatron` and `canDeletePatron` in `src/lib/auth/rbac.ts`.
  - Update `PUT /api/patrons/[id]` and `DELETE /api/patrons/[id]` in `src/app/api/patrons/[id]/route.ts` with role guards and active loan check.
  - *Done when:* API returns 403 Forbidden when unauthorized roles attempt update or delete, and blocks deletion when active loans exist.

- [x] **Step 2: Patron list passport photo thumbnails & RBAC action triggers**
  - Update `src/app/dashboard/patrons/PatronListClient.tsx` to render passport thumbnails in the avatar column.
  - Add Edit Patron and Delete Patron action buttons in row actions, conditioned on user role.
  - *Done when:* Patron list shows photo thumbnails and displays Edit for admin/ict and Delete for admin only.

- [x] **Step 3: Dynamic registration form conditioning on patronType**
  - Enhance `src/app/dashboard/patrons/register/PatronRegisterClient.tsx` to dynamically show School Info and Parent/Guardian Info for students, and employer info for educators/staff.
  - Ensure form validation and submission accurately sends subdocuments to `POST /api/patrons`.
  - *Done when:* Changing patronType reveals the corresponding required fields and submits valid student school/parent info.

- [x] **Step 4: Patron Edit modal & active loan protection**
  - Create `src/components/patrons/PatronEditModal.tsx` with full editing support for all patron fields.
  - Connect modal to `PUT /api/patrons/[id]` and refresh table state upon successful save.
  - Add delete confirmation dialog with active loan protection feedback.
  - *Done when:* Admin/ICT can edit patron details and save changes, and Admin can delete patrons with safety warnings.

- [x] **Step 5: Full Verification & Route Integrity Test**
  - Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
  - Verify live patron listing with thumbnails, dynamic registration form, update modal, and delete RBAC.
  - *Done when:* All checks pass with 0 errors and feature is ready for completion.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":5666,"specSha256":"5a41c1b5201ef4d801217b01065b13e6b403d8ebd9be6a2e97cb847ae113fce5","branch":"refs/heads/feature/patron-lifecycle-enhancements-dynamic-registration-strict-rbac","head":"0efbbc7f7744051eaf6d67509b0817b31f53dd9b","baseRef":"refs/heads/main","baseCommit":"0efbbc7f7744051eaf6d67509b0817b31f53dd9b","sourceTree":"0baad9caa439a45e4afb62e9c412bd0fa80a4eaa","absentOptional":[]} -->
