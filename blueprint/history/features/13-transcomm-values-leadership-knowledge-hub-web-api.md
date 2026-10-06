# Feature: Transcomm Values & Leadership Knowledge Hub (Web & API)

**From build-plan:** feature 13
**Build attempt:** 1
**Branch:** feature/transcomm-values-leadership-knowledge-hub-web-api
**Status:** verified

## Goal

Deliver the Transcomm Values & Leadership Knowledge Hub across web and mobile REST API channels, providing an editorial publishing studio for DRNICER core values (Discipline, Respect, Nobility, Integrity, Compassion, Excellence, Responsibility) and leadership articles, an interactive public reader with category and pillar filtering, and dual-mode REST endpoints consumable by both Next.js and the companion Android app.

## In scope

1. **Enhanced Domain Data Model & Service Layer**:
   - Update `TranscommArticle` schema and TypeScript types to support the 7 DRNICER core values (`Discipline`, `Respect`, `Nobility`, `Integrity`, `Compassion`, `Excellence`, `Responsibility`) alongside editorial categories.
   - Service layer (`src/lib/transcomm/service.ts`) with functions for listing, searching, slug-lookup with atomic view increment (`$inc: { viewCount: 1 }`), creating, updating, soft/hard deleting articles, and calculating reading time.
   - Curated initial articles covering foundational DRNICER leadership pillars so the hub is populated immediately from live MongoDB storage with zero mock placeholders.

2. **Dual-Mode REST API Endpoints**:
   - `GET /api/transcomm/articles`: Paginated list of published articles with category, DRNICER value, search keywords, and sort filters. Open to Android mobile clients and web readers.
   - `GET /api/transcomm/articles/slug/[slug]`: Single article retrieval by URL slug with atomic view count increment and next/related recommendations.
   - `POST /api/transcomm/articles`: Editorial creation endpoint protected by RBAC (`EDITORIAL_ROLES`: `admin`, `asst_admin`, `transcomm_author`), validating required fields, unique slug, and minimum 200-character content.
   - `PUT /api/transcomm/articles/[id]`: Editorial update endpoint protected by RBAC for editing article metadata, content, and publishing status.
   - `DELETE /api/transcomm/articles/[id]`: Editorial archiving/deletion endpoint protected by RBAC.

3. **Article Editor Studio & UI Components**:
   - Editorial rich editor toolbar with live side-by-side preview mode (supporting Markdown/rich text headings, lists, blockquotes, emphasis, and callout blocks).
   - DRNICER Value Pills and Category Badges with distinctive academic and brand color tokens.
   - Article card components, read time estimator, and author attribution chips.
   - Interactive search and filter controls for categories and DRNICER pillars.

4. **Web Experience (Reader & Management)**:
   - `/transcomm`: Public Knowledge Hub directory featuring hero featured article, DRNICER pillar selector, category tabs, search input, and responsive card grid.
   - `/transcomm/[slug]`: Reader view with typography styling, estimated read time, DRNICER badge banner, author attribution, formatted article body, and related reading links.
   - `/transcomm/manage`: Staff Editorial Management Studio with data table of all articles (draft and published), quick status toggling, view counters, and link to create/edit.
   - `/transcomm/manage/new` and `/transcomm/manage/[id]`: Full-page editorial authoring studio with slug auto-generation, DRNICER pillar selector, and live preview.
   - AppShell sidebar navigation integration under the `MANAGEMENT` section linking to `/transcomm`.

## Out of scope

- Android client app APK compilation (this feature provides the production REST endpoints the Android app consumes).
- Comments or discussion forum threads on articles.
- User/patron article submission (authoring is restricted to editorial staff roles).
- External image CDN hosting beyond existing Cloudinary/URL patterns.

## Build loop

- Step review policy: `feature` (all implementation steps run sequentially, followed by a unified review packet).
- Step checkpoint commits: `disabled`.
- Final feature commit and squash merge performed in `/complete`.

## Build steps

- [x] **Step 1: Domain types, model enhancement & service layer**
  - Add `drnicerValue` to `src/models/TranscommArticle.ts` (`Discipline`, `Respect`, `Nobility`, `Integrity`, `Compassion`, `Excellence`, `Responsibility`).
  - Create `src/lib/transcomm/types.ts` defining input, query, and serializable output types.
  - Create `src/lib/transcomm/service.ts` with atomic view count increment, pagination, filtering, slug uniqueness resolution, word count read-time estimation, and curated baseline DRNICER article seeds.
  - *Done when:* Service functions execute without type errors, correctly format articles, and enforce DRNICER pillar contracts under `npx tsc --noEmit`.

- [x] **Step 2: Dual-Mode REST API endpoints**
  - Implement `GET /api/transcomm/articles` with pagination (`page`, `limit`), `category`, `drnicerValue`, `search`, and `status` query filters.
  - Implement `GET /api/transcomm/articles/slug/[slug]` to retrieve article details, atomically increment `viewCount`, and return adjacent suggested articles.
  - Implement `POST /api/transcomm/articles` with `canPublishArticles` RBAC check, input validation, and automatic slug creation.
  - Implement `PUT /api/transcomm/articles/[id]` and `DELETE /api/transcomm/articles/[id]` for editorial modification and archiving.
  - *Done when:* API route handlers validate requests, enforce RBAC authentication for mutations, return structured JSON with `{ success: true, data }`, and pass typecheck.

- [x] **Step 3: Transcomm UI components & rich text editor**
  - Build `src/components/transcomm/DRNICERPill.tsx` with customized color tokens for each of the 7 pillars.
  - Build `src/components/transcomm/ArticleCard.tsx` with category badges, read times, and excerpt teasers.
  - Build `src/components/transcomm/RichArticleEditor.tsx` with formatting controls (headings, lists, quotes, callouts), character/word counter, estimated read time, and side-by-side live preview.
  - Export components cleanly from `src/components/transcomm/index.ts`.
  - *Done when:* UI components render cleanly using MUI theme tokens, respond to theme changes, and compile without TypeScript or ESLint errors.

- [x] **Step 4: Knowledge Hub public directory & reader pages**
  - Create `/transcomm/page.tsx` and `/transcomm/KnowledgeHubClient.tsx` featuring hero article highlight, DRNICER pillar filter pills, category tabs, keyword search with instant filtering, and responsive article grid.
  - Create `/transcomm/[slug]/page.tsx` and `/transcomm/[slug]/ArticleReaderClient.tsx` rendering the full article with academic typography, table of contents, author metadata, DRNICER pillar banner, and related articles.
  - *Done when:* Navigating to `/transcomm` and `/transcomm/[slug]` displays articles cleanly with functional filtering and responsive layout.

- [x] **Step 5: Editorial management studio & navigation integration**
  - Create `/transcomm/manage/page.tsx` and `TranscommManageClient.tsx` with DZFDataTable showing all articles, draft/published badges, view metrics, and quick actions.
  - Create `/transcomm/manage/new/page.tsx` and `/transcomm/manage/[id]/page.tsx` embedding `RichArticleEditor` for authoring and editing articles.
  - Update `src/components/layout/AppShell.tsx` to add `Transcomm Hub` (`id: 'transcomm'`, path `/transcomm`, badge `'Values'`) to sidebar navigation and route resolver.
  - *Done when:* Staff can navigate to Transcomm Hub from the sidebar, open the Editorial Studio, create, edit, and toggle articles, with unauthorized roles properly redirected or blocked.

- [x] **Step 6: End-to-end verification & quality checks**
  - Verify baseline DRNICER articles are loaded in MongoDB.
  - Verify REST endpoints via API test calls.
  - Run full verification: `npx tsc --noEmit` and `npm run lint`.
  - *Done when:* Typecheck and lint pass cleanly with zero errors or warnings.

## Files / areas

- `src/models/TranscommArticle.ts` - Schema enhancement for `drnicerValue`
- `src/lib/transcomm/types.ts` - Domain interface and query definitions
- `src/lib/transcomm/service.ts` - Transcomm business logic, CRUD, and seed logic
- `src/app/api/transcomm/articles/route.ts` - Collection GET and POST endpoint
- `src/app/api/transcomm/articles/[id]/route.ts` - Entity PUT and DELETE endpoint
- `src/app/api/transcomm/articles/slug/[slug]/route.ts` - Slug reader GET endpoint
- `src/components/transcomm/DRNICERPill.tsx` - 7 DRNICER pillar visual pills
- `src/components/transcomm/ArticleCard.tsx` - Article summary card
- `src/components/transcomm/RichArticleEditor.tsx` - Editorial authoring & preview editor
- `src/components/transcomm/index.ts` - Transcomm component barrel exports
- `src/app/transcomm/page.tsx` - Knowledge Hub directory page
- `src/app/transcomm/KnowledgeHubClient.tsx` - Client component for directory & filtering
- `src/app/transcomm/[slug]/page.tsx` - Article reader page
- `src/app/transcomm/[slug]/ArticleReaderClient.tsx` - Reader view client component
- `src/app/transcomm/manage/page.tsx` - Editorial Studio management table page
- `src/app/transcomm/manage/TranscommManageClient.tsx` - Management table client component
- `src/app/transcomm/manage/new/page.tsx` - New article creator page
- `src/app/transcomm/manage/[id]/page.tsx` - Edit article page
- `src/app/transcomm/manage/ArticleFormClient.tsx` - Form client wrapper for creator and editor
- `src/components/layout/AppShell.tsx` - Sidebar navigation registration

## Data / contracts

### Enhanced `TranscommArticle` Document Shape
```typescript
export type DRNICERValue =
  | 'Discipline'
  | 'Respect'
  | 'Nobility'
  | 'Integrity'
  | 'Compassion'
  | 'Excellence'
  | 'Responsibility';

export type TranscommCategory =
  | 'drnicer-values'
  | 'leadership-basics'
  | 'communication'
  | 'teamwork'
  | 'problem-solving'
  | 'confidence'
  | 'inspiration';

export interface ITranscommArticle {
  _id: string;
  title: string;
  slug: string;
  category: TranscommCategory;
  drnicerValue?: DRNICERValue;
  readTime: string;
  excerpt: string;
  content: string;
  tags: string[];
  author: string;
  isActive: boolean;
  viewCount: number;
  library: string;
  createdAt: string;
  updatedAt: string;
}
```

### REST API Contracts
- `GET /api/transcomm/articles?category=&drnicerValue=&search=&page=1&limit=12`
  - Response: `{ success: true, data: ITranscommArticle[], pagination: { page, limit, total, totalPages } }`
- `GET /api/transcomm/articles/slug/:slug`
  - Response: `{ success: true, data: ITranscommArticle, related: ITranscommArticle[] }`
- `POST /api/transcomm/articles`
  - Body: `{ title, slug?, category, drnicerValue?, excerpt, content, tags, author, isActive? }`
  - Auth: Cookie or Bearer token; requires `canPublishArticles` (`admin`, `asst_admin`, `transcomm_author`)
  - Response: `{ success: true, data: ITranscommArticle, message: string }`
- `PUT /api/transcomm/articles/:id`
  - Body: Partial update payload
  - Auth: Requires `canPublishArticles`
  - Response: `{ success: true, data: ITranscommArticle, message: string }`
- `DELETE /api/transcomm/articles/:id`
  - Auth: Requires `canPublishArticles`
  - Response: `{ success: true, message: string }`

## Testing

- Typecheck: `npx tsc --noEmit`
- Linter: `npm run lint`
- Verification of API response contracts and slug lookups

## Notes for the AI

- Use DZF semantic brand colors: Brand Maroon (`#6f1111`), Scholastic Navy (`#17324d`), Academic Gold (`#cca349`), Midnight Navy (`#0b1d2e`).
- Follow established Next.js App Router patterns with Server Component pages receiving initial data and passing to Client Components for interactive filtering and state.
- Handle slug collisions automatically by adding numeric suffixes if needed, while allowing custom clean slugs.
- Maintain mobile compatibility for REST responses so upcoming Android clients can consume articles directly without modification.
- Never use mock placeholders; seed the database with real foundational DRNICER articles so the system is immediately usable.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":12067,"specSha256":"71a38ed210d7d2fa49abbdd8575fc06277707f89e3e4565c4ee57c54ab63b27e","branch":"refs/heads/feature/transcomm-values-leadership-knowledge-hub-web-api","head":"d7b3c7834429e1981fdab5b1b9101579ef191818","baseRef":"refs/heads/main","baseCommit":"d7b3c7834429e1981fdab5b1b9101579ef191818","sourceTree":"cc0e5d94a91189fddb612ab189e1c425ab54fd5c","absentOptional":[]} -->
