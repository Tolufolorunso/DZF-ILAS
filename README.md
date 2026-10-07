# DZF-ILLS

Dzuels Integrated Library & Learning System — an internal staff web application designed as a modern academic SaaS and digital workspace.

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Production start:** `npm run start`
- **Lint:** `npm run lint`
- **Typecheck:** `npx tsc --noEmit`

## Tech Stack

- **Framework:** Next.js (App Router, React 19)
- **Language:** TypeScript
- **UI & Design System:** Material UI (`@mui/material`), `@mui/material-nextjs`, `@emotion/react`, `@emotion/styled`
- **Architecture:** AI Blueprint workflow layer

## Deployment

### Deploying to Vercel (Recommended for Serverless)
1. Import the repository in [Vercel](https://vercel.com).
2. Framework preset will automatically detect **Next.js**.
3. Configure the environment variables (see `.env.example`):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - (Optional) `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`
4. Deploy. Build command defaults to `npm run build`.

### Deploying to Render (Web Service)
1. In the [Render Dashboard](https://dashboard.render.com), create a new Blueprint or Web Service using `render.yaml`.
2. Provide the secret environment variables specified in `render.yaml` (`MONGODB_URI`, Cloudinary credentials, etc.).
3. Health check path is automatically configured to `/api/health/db`.
