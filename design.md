# DZF-ILAS — UI/UX Design Direction

Build DZF-ILAS (Dzuels Integrated Library & Administrative System) as a modern internal staff web application.

The application is for Dzuels staff, so the priority is not visual effects. The priority is **clarity, speed, usability, consistency and a premium professional feel**.

## 1. Overall Design Language

Use a:

**Modern Academic SaaS / Digital Workspace**

The design should feel like a combination of:

* A modern SaaS dashboard
* A professional digital library
* A clean learning management system
* A productivity workspace

It should NOT look like an old-school school management system.

Avoid:

* Crowded interfaces
* Tiny text
* Excessive tables
* Excessive shadows
* Excessive gradients
* Too many colors
* Excessive rounded cards
* Decorative animations
* Generic admin-dashboard appearance

The interface should feel calm, modern, trustworthy and easy to learn.

## 2. Technology

Use:

* React / Next.js
* @mui/material
* @mui/material-nextjs

Use MUI as the UI foundation, but create a custom DZF-ILAS design system on top of MUI.

Do not rely on the default MUI visual appearance.

## 3. Design System

Create a centralized theme.

Suggested structure:

src/
theme/
index.ts
colors.ts
typography.ts
components.ts

The theme should control:

* Colors
* Typography
* Border radius
* Spacing
* Shadows
* Component variants
* Breakpoints
* MUI component overrides

Do not create random styling decisions the color in  in individual pages.

## 4. Color Direction

colors to be used is `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`

Color should communicate meaning.

Do not make every component colorful.

## 5. Typography

Use a clean modern sans-serif font.

Prefer:

Inter,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif

Use clear typography hierarchy.

Page title:
approximately 28–32px

Section title:
approximately 20–24px

Body:
14–16px

Secondary text:
13–14px

Prioritize readability.

## 6. Main Application Layout

Use:

LEFT SIDEBAR + TOP HEADER + MAIN CONTENT AREA

Desktop:

Sidebar:

* Collapsible
* Compact
* Clear icons
* Clear labels
* Group related navigation items

Header:

* Global search
* Notifications
* Help
* User profile

Main content:

* Generous spacing
* Clear page hierarchy
* Consistent page headers

Suggested navigation:

WORKSPACE

* Dashboard
* Library
* Learning Resources
* Members
* Activity

MANAGEMENT

* Books
* Borrowing
* Returns
* Reservations
* Reports

SYSTEM

* Notifications
* Settings

Do not overcrowd the sidebar.

## 7. Dashboard

The dashboard should be useful, not just decorative.

Start with:

"Good morning, [Name]"

Then a short description.

Provide important quick actions:

* Add Resource
* Register Member
* Record Borrowing

Show important statistics:

* Total Books
* Borrowed
* Overdue
* Members

Then:

* Recent Activity
* Items requiring attention
* Quick access to important modules

Do not create a dashboard containing dozens of statistics.

## 8. Library Interface

The Library should feel like a real modern digital library.

Include:

* Large search interface
* Filters
* Sorting
* Resource type filters
* Category filters
* Availability filters

Allow:

GRID VIEW
and
LIST/TABLE VIEW

Grid view should display:

* Cover/image
* Title
* Author
* Category
* Availability

List/table view should be optimized for staff management.

## 9. Search

Search is a major feature.

Support searching by:

* Title
* Author
* ISBN
* Category
* Topic
* Resource type

Consider a global search / command interface using:

Ctrl + K

Search results can be grouped into:

* Books
* Members
* Learning Resources
* Actions

## 10. Resource Details

Resource/book details should have a proper detail page.

Example structure:

Back to Library

[Cover]

Title
Author
Status

Actions:

* Borrow
* Edit
* More

Then sections:

Book Information
Publication Information
Classification
Borrowing History

Do not immediately open a huge edit form when the user clicks a resource.

## 11. Forms

Forms must be easy for staff.

Group related fields.

Example:

Basic Information

Title | Author
Category | Resource Type

Publication

Publisher | Year
ISBN | Edition

Classification

...

Avoid extremely long single-column forms.

Use sections, grids and clear labels.

## 12. Tables

Tables should be clean and readable.

Use:

* Sorting
* Filtering
* Pagination
* Search
* Row actions
* Clear status chips
* Loading states
* Empty states

Avoid tiny typography.

Use whitespace.

For advanced data-heavy requirements, use MUI X DataGrid where appropriate.

## 13. Cards

Use cards selectively.

Cards are appropriate for:

* Statistics
* Resources
* Quick actions
* Important alerts
* Learning materials

Do not put every piece of content inside a card.

Use normal layouts for forms, settings and long content.

## 14. Border Radius

Use moderate rounding.

Suggested:

Cards:
12–16px

Buttons:
8–10px

Inputs:
8–10px

Avoid excessive pill-shaped UI unless the component is actually a status/tag/chip.

## 15. Shadows

Keep shadows subtle.

Prefer borders and surface hierarchy.

Do not use heavy shadows on every card.

## 16. Empty States

Never display only:

"No data"

Create useful empty states.

Example:

"Your library is empty"

"Add your first book or learning resource to start building the DZF-ILAS library."

[Add Resource]

Keep illustrations minimal.

## 17. Loading States

Use skeleton loaders for content-heavy pages.

Use button loading states during mutations.

Never leave a blank page while data is loading.

## 18. Notifications

Create a clean notification center.

Examples:

* Overdue books
* New learning resources
* Returned books
* System announcements

Use status indicators and timestamps.

## 19. Responsive Design

The application must work well on:

* Desktop
* Laptop
* Tablet
* Mobile

On smaller screens:

* Collapse the sidebar
* Use a mobile navigation pattern
* Stack dashboard cards
* Make tables horizontally scrollable where necessary
* Keep touch targets large enough
* Do not simply shrink desktop layouts

## 20. Animation

Use subtle micro-interactions only.

Good:

* Hover states
* Drawer transitions
* Dialog transitions
* Toast notifications
* Skeleton loading
* Button loading
* Small tab transitions

Avoid:

* Large page animations
* Animated backgrounds
* Excessive motion
* Decorative animations

This is a productivity application.

## 21. Component Architecture

Create reusable UI components instead of duplicating UI.

Examples:

components/
layout/
navigation/
dashboard/
library/
resources/
members/
forms/
tables/
feedback/
common/

Reusable components should include:

* PageHeader
* SearchBar
* StatCard
* ResourceCard
* StatusChip
* EmptyState
* LoadingState
* ConfirmDialog
* DataTable
* FilterBar
* QuickAction
* NotificationItem

## 22. UX Rules

Every page should answer three questions immediately:

1. Where am I?
2. What can I do here?
3. What should I do next?

Every important action should have obvious feedback.

Examples:

Success:
"Book added successfully."

Error:
"We couldn't save this book. Please check the highlighted fields."

Loading:
"Saving..."

Never leave users guessing whether an action worked.

## 23. Overall Quality Standard

The final application should feel like a professionally designed SaaS product.

Think:

**Clean + Academic + Modern + Human + Practical**

Not:

**Generic Admin Dashboard**

The interface should be visually impressive because of its spacing, typography, hierarchy, consistency and usability — not because of excessive decoration.

Most importantly:

**Build the design system first, then build the individual pages using that system.**
