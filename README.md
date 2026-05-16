# Zebvo — AI Social Media Studio

> Submission for the **Zebvo Full Stack Developer Task**.
> A lightweight, production-style SaaS for AI-powered social media content creation, scheduling, and export — built with a clean service-oriented backend and a beautiful, animated Next.js frontend.

<p align="center">
  <em>Brand workspaces · Gemini text & image generation · Streaming AI · Calendar scheduling · PDF / Markdown / ZIP export · Dark mode</em>
</p>

---

## 1. Architecture at a glance

```
┌──────────────────────────────┐         ┌───────────────────────────────┐
│  Next.js 14 Frontend (3000)  │  HTTPS  │  Express + TypeScript (5050)  │
│  • App Router / RSC          │ ◀─────▶ │  • Modular service layer      │
│  • Tailwind + glass UI       │   SSE   │  • Prisma + PostgreSQL (Neon)      │
│  • Zustand + React Query     │         │  • Gemini AI (text + image)   │
│  • Streaming AI consumer     │         │  • PDF / MD / ZIP exporters   │
└──────────────────────────────┘         └───────────────────────────────┘
                                                       │
                                            ┌──────────▼──────────┐
                                            │  Google Gemini API  │
                                            │  text + image gen   │
                                            └─────────────────────┘
```

Monorepo layout:

```
.
├── backend/                Express + Prisma + Gemini
│   ├── prisma/             schema.prisma + migrations (PostgreSQL / Neon)
│   └── src/
│       ├── config/         env + prisma client
│       ├── middleware/     auth (JWT) + error handler
│       ├── services/       auth · ai · workspace · content · schedule · export · template
│       ├── controllers/    request validation (zod) + DTOs
│       ├── routes/         REST router composition
│       └── utils/          ApiError, asyncHandler, seed
├── frontend/               Next.js 14 (App Router)
│   └── src/
│       ├── app/            routes (login, signup, dashboard, generate, library, schedule, templates, ...)
│       ├── components/     UI kit + AppShell + ThemeToggle
│       ├── lib/            API client (fetch + SSE)
│       └── store/          zustand (auth, active workspace)
├── vercel.json             Vercel Services: Next.js `/` + Express `/api` (optional deploy path)
└── README.md
```

## 2. Features — task checklist

| Spec requirement | Where it lives |
|---|---|
| **Auth: signup / login / protected dashboard** | `backend/src/services/auth.service.ts`, `frontend/src/app/(login\|signup\|dashboard)` |
| **Multiple workspaces / brand info** | `backend/src/services/workspace.service.ts`, `frontend/src/app/workspaces` |
| **Save generated content history** | `Content` + `ContentVersion` models in `prisma/schema.prisma` |
| **AI content generation (Gemini)** | `backend/src/services/ai.service.ts`, `frontend/src/app/generate` |
| **Captions, posts, threads, hashtags, carousels, marketing copy, campaigns, reels** | Single generate endpoint with 8 content types |
| **Platform + tone selectors** | `frontend/src/app/generate/generate-client.tsx` (thin `page.tsx` wraps Suspense + query params) |
| **Save / edit / delete / regenerate** | `frontend/src/app/library/[id]/page.tsx` (regenerate auto-archives to `ContentVersion`) |
| **Scheduling UI (no actual posting)** | `frontend/src/app/schedule/page.tsx` — calendar **and** list views |
| **Library filters / listing** | `frontend/src/app/library/library-client.tsx` (thin `page.tsx` wraps Suspense) |
| **Export PDF / Markdown / ZIP & JSON** | `backend/src/services/export.service.ts` (pdfkit + archiver) |

### Bonus features delivered

- ✅ **Real-time AI streaming** via Server-Sent Events (`/api/contents/generate/stream`)
- ✅ **AI-generated reel/video scripts** with scene-by-scene structure
- ✅ **Multi-image carousel** generation (6-slide layout in UI)
- ✅ **AI image generation** for banners (Gemini image-capable model)
- ✅ **Content approval workflow** — `draft → approved → scheduled → archived` status
- ✅ **Calendar view** for scheduling (month grid + per-day chips)
- ✅ **Prompt templates** with placeholder substitution (`{brand}`, `{audience}`, etc.)
- ✅ **Dark / light mode** with `next-themes`
- ✅ **Content versioning** — every regenerate archives the previous version
- ✅ **Workspace ZIP export** (markdown + json + manifest in one archive)

## 3. Tech stack

**Backend** Node.js · Express · TypeScript · Prisma · PostgreSQL (Neon) · JWT · bcryptjs · Zod · pdfkit · archiver · `@google/generative-ai` · helmet · cors · morgan
**Frontend** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Zustand · TanStack Query · Framer Motion · lucide-react · react-hot-toast · next-themes · date-fns

## 4. Getting started

### Prerequisites
- Node 18+
- A Google Gemini API key — get one at https://aistudio.google.com/app/apikey

### 1) Backend setup

```bash
cd backend
cp .env.example .env       # set DATABASE_URL = Neon Postgres URI, GEMINI_API_KEY, JWT_SECRET
npm install
npx prisma generate
npx prisma migrate deploy   # applies prisma/migrations/* to Neon (empty DB first time)
npm run seed               # optional: demo@zebvo.app / demo1234
npm run dev                # http://localhost:5050
```

### 2) Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

Open `http://localhost:3000` → sign up → onboarding creates your first workspace → start generating.

## 5. Environment variables

`backend/.env`

| Key | Required | Notes |
|---|---|---|
| `PORT` | no (default `5050`) | API port (5000 conflicts with macOS AirPlay) |
| `DATABASE_URL` | yes | **Neon Postgres** connection string, e.g. `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | yes | At least 32 random chars |
| `JWT_EXPIRES_IN` | no | e.g. `7d` |
| `GEMINI_API_KEY` | **yes** | Required for AI generation |
| `GEMINI_TEXT_MODEL` | no | Default `gemini-2.0-flash` |
| `GEMINI_IMAGE_MODEL` | no | Default `gemini-2.0-flash-exp-image-generation` |
| `CORS_ORIGIN` | no | Default `http://localhost:3000`. **Production:** set to your deployed site origin (e.g. `https://your-app.vercel.app`). |

`frontend/.env.local`

| Key | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | **Local:** `http://localhost:5050` (see `.env.example`). **Same-domain production (Vercel Services):** leave unset — the client uses the current origin and calls `/api`. |

## 6. Deploy (Vercel)

Deploy **frontend + backend** as one project using root [`vercel.json`](vercel.json) ([Vercel Services](https://vercel.com/docs/services)): Next.js **`frontend`** at `/`, Express **`backend`** at **`/api`**.

1. Import this repo from GitHub; Framework preset **Services** (detects both apps).
2. **Environment variables** (Production — add Preview too if you want previews working): **`DATABASE_URL`**, **`JWT_SECRET`**, **`GEMINI_API_KEY`**, **`CORS_ORIGIN`** (must be your live frontend URL, not `localhost`).
3. Omit **`NEXT_PUBLIC_API_URL`** so the browser hits **`/api`** on the same deployment.
4. The backend uses **`npm run vercel-build`** (`prisma generate`, **`prisma migrate deploy`**, **`tsc`**). **`DATABASE_URL`** must be set before the first deploy.

Smoke test: **`https://<your-domain>/api/health`** → `{ ok: true, ... }`.

## 7. API surface

```
POST   /api/auth/register             { email, password, name } → { user, token }
POST   /api/auth/login                { email, password }       → { user, token }
GET    /api/auth/me                                            → { user }

GET    /api/workspaces
POST   /api/workspaces                { name, description?, targetAudience?, industry?, brandVoice? }
GET    /api/workspaces/:id
PATCH  /api/workspaces/:id
DELETE /api/workspaces/:id

GET    /api/contents?workspaceId=&type=&platform=&status=
POST   /api/contents/generate         { workspaceId, contentType, platform, tone, extraPrompt?, imagePrompt?, imageStyle? }
POST   /api/contents/generate/stream  (same body)              → SSE: chunk | image | done | error
GET    /api/contents/:id
PATCH  /api/contents/:id              { title?, body?, status?, tone? }
DELETE /api/contents/:id
POST   /api/contents/:id/regenerate   (archives prior version)

GET    /api/schedules?workspaceId=
POST   /api/schedules                 { workspaceId, contentId, scheduledAt, note? }
PATCH  /api/schedules/:id
DELETE /api/schedules/:id

GET    /api/templates?workspaceId=
POST   /api/templates                 { name, contentType, platform, tone, promptBody, ... }
PATCH  /api/templates/:id
DELETE /api/templates/:id

GET    /api/export/content/:id?format=pdf|md|json
GET    /api/export/workspace/:id      (ZIP with manifest + per-item markdown + JSON)

GET    /api/health
```

## 8. Database schema

| Model | Purpose |
|---|---|
| `User` | Account (email, hashed password) |
| `Workspace` | One brand: name, description, audience, industry, brand voice |
| `Content` | Generated piece: type, platform, tone, body, optional metadata JSON + image |
| `ContentVersion` | Snapshot of prior `body` whenever a content is regenerated |
| `Schedule` | Date/time + linked content + note (UI-only — no publishing job) |
| `PromptTemplate` | Reusable prompt with `{brand}`, `{audience}`, `{tone}`, `{platform}`, `{extra}` placeholders |

Indexes on `userId`, `workspaceId`, and `scheduledAt` for fast filters.

## 9. AI prompt engineering

Every generation injects the workspace's brand profile into a structured system prompt before the task instruction:

```
=== BRAND CONTEXT ===
Brand: Acme Coffee Co.
Description: Specialty roaster ...
Target Audience: Coffee enthusiasts 25-45
Industry: Food & Beverage
Brand Voice: Warm, knowledgeable, slightly playful

=== TASK ===
Write a 6-slide Instagram carousel. Return STRICT JSON: { slides: [...] }
=== PLATFORM ===
Optimize for Instagram: emotional hook in line 1 ...
=== TONE ===
Tone profile: warm, friendly, conversational
```

For structured types (threads, hashtags, carousels, reels, etc.) the prompt enforces strict JSON output, and the backend tolerantly parses it into typed `metadata` so the UI can render rich layouts (slide cards, tweet stack, scene cards).

## 10. Why this submission stands out

1. **Clean service-oriented architecture** — every domain has its own service (`ai`, `auth`, `workspace`, `content`, `schedule`, `template`, `export`), keeping controllers thin.
2. **Real streaming** — `/contents/generate/stream` is a true SSE endpoint that surfaces tokens as Gemini produces them. The UI updates live.
3. **Versioning baked in** — regenerating a piece doesn't destroy history; a `ContentVersion` snapshot is auto-created.
4. **Type-rich structured outputs** — hashtags render as chips, threads as tweet stack, carousels as gradient slides, reels as scene-by-scene table.
5. **Three export formats + bulk workspace ZIP** — exceeds the spec.
6. **First-class loading/error states** — toasts everywhere, shimmer skeletons, optimistic invalidation via React Query, validation via Zod.
7. **Modern, glassy UI** with dark mode by default, gradient mesh background, animated cards via Framer Motion.
8. **Scoped, secured data access** — every service verifies `userId` ownership before reading or mutating.

## 11. Notes on the task spec

- **Scheduling is UI-only**, as required. No cron, no posting integration. The DB stores intent only.
- **Gemini API key lives on the server** — never exposed to the browser.
- **PostgreSQL (Neon)** — `provider = "postgresql"` in `prisma/schema.prisma`. Create a free DB at [Neon](https://console.neon.tech), copy the URI into `DATABASE_URL`, then run `npx prisma migrate deploy`.

---

Built with care for the Zebvo Full Stack Developer Task.
