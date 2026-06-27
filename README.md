# Feedige — Frontend

The web client for **Feedige**, an AI-powered feedback triage app. Users submit
product feedback here; the [backend](https://github.com/Tredeaux/Feedige-BE)
persists it and runs AI analysis.

---

## Tech stack

| Concern            | Choice                                                        |
| ------------------ | ------------------------------------------------------------- |
| Framework          | [Next.js 16](https://nextjs.org/) (App Router) · React 19     |
| Language           | TypeScript (strict)                                           |
| Styling            | Tailwind CSS v4                                               |
| Forms & validation | react-hook-form + Zod (`@hookform/resolvers`)                 |
| Env safety         | [`@t3-oss/env-nextjs`](https://env.t3.gg/) + Zod              |
| Unit tests         | Vitest + Testing Library                                      |
| E2E tests          | Playwright                                                    |
| Quality            | ESLint + Prettier · Husky + lint-staged · CI (GitHub Actions) |

---

## Architecture

The app follows a thin, typed-boundary structure: UI components stay
presentational, all backend access funnels through a single typed client, and
environment access is validated once at the edge.

```
Browser
  └─ src/app/page.tsx            Server Component (landing page)
       └─ FeedbackForm           Client Component — react-hook-form + Zod
            └─ submitFeedback()  src/lib/feedback.ts   (schemas + API call)
                 └─ apiFetch()   src/lib/api.ts        (typed fetch + ApiError)
                      └─ HTTP →  NEXT_PUBLIC_API_URL/api/v1/...
```

**Key modules**

| File                               | Responsibility                                                       |
| ---------------------------------- | -------------------------------------------------------------------- |
| `src/env.ts`                       | Validates env vars at startup; import `env` instead of `process.env` |
| `src/lib/api.ts`                   | `apiFetch<T>()` — JSON in/out, throws typed `ApiError` on non-2xx    |
| `src/lib/feedback.ts`              | Zod schemas (per-field + full) and `submitFeedback()`                |
| `src/components/feedback-form.tsx` | The submission form (client component)                               |

**Form UX.** The form is a sequential "unlock-as-you-go" flow — name → email →
message — each field enabling the next once valid. Validation is shared Zod
schemas (`src/lib/feedback.ts`): the same schemas drive live per-field unlock
_and_ the final submit, so client and contract stay in sync. Errors surface on
blur; submit/success/error states are announced via ARIA live regions.

---

## Project structure

```
src/
  app/
    layout.tsx          Root layout + metadata
    page.tsx            Landing page (renders FeedbackForm)
    globals.css         Tailwind v4 entry
  components/
    feedback-form.tsx   Feedback submission form
    feedback-form.test.tsx
  lib/
    api.ts              Typed fetch client (apiFetch, ApiError)
    feedback.ts         Feedback schemas + submitFeedback
  env.ts                Validated environment variables
```

---

## Getting started

**Prerequisites:** Node.js `>=22` (see [`.nvmrc`](.nvmrc)) and the
[Feedige backend](https://github.com/Tredeaux/Feedige-BE) running.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open **http://localhost:3000**.

> **Port already in use?** Override at launch — e.g.
> `PORT=3010 NEXT_PUBLIC_API_URL=http://localhost:3011 npm run dev`.

---

## Environment variables

| Variable              | Required | Default                 | Description                 |
| --------------------- | -------- | ----------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | no       | `http://localhost:3001` | Base URL of the backend API |

Validation lives in [`src/env.ts`](src/env.ts) — a missing/invalid value fails
fast at build/startup rather than surfacing as a runtime `undefined`.

---

## API contract

The client talks to the backend through `apiFetch`, which prefixes
`NEXT_PUBLIC_API_URL` + `/api/v1`. The feedback submission expects:

```http
POST {NEXT_PUBLIC_API_URL}/api/v1/feedback
Content-Type: application/json

{ "name": "Jane Doe", "email": "jane@example.com", "message": "…" }
```

Returns the created record (`{ id, createdAt, ... }`). Non-2xx responses are
thrown as `ApiError` (carrying `status` and the parsed body).

---

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server (hot reload)    |
| `npm run build`     | Production build (standalone output) |
| `npm run start`     | Serve the production build           |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | Type-check without emitting          |
| `npm test`          | Unit tests (Vitest, watch)           |
| `npm run test:ci`   | Unit tests (single run)              |
| `npm run test:e2e`  | Playwright e2e tests                 |
| `npm run format`    | Format with Prettier                 |

> First e2e run needs browsers: `npx playwright install`.

---

## Testing

- **Unit** — Vitest + Testing Library, jsdom environment. Example coverage in
  `src/components/feedback-form.test.tsx`.
- **E2E** — Playwright (`e2e/`), boots the production build and drives a real
  browser.

---

## Docker

```bash
docker compose up --build
```

`NEXT_PUBLIC_API_URL` is baked at **build** time (Next inlines `NEXT_PUBLIC_*`),
so it's passed as a build arg — see `docker-compose.yml` / `Dockerfile`.
