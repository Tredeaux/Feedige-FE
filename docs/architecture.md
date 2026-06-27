# Architecture

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Forms/validation:** react-hook-form + Zod (`@hookform/resolvers`)
- **Env:** `@t3-oss/env-nextjs` + Zod
- **Testing:** Vitest + Testing Library (unit), Playwright (e2e)

> Next.js 16 differs from older mental models (see root `AGENTS.md`). When unsure
> about a framework API, consult the bundled docs in `node_modules/next/dist/docs/`
> rather than relying on memory.

## Folder layout

```
src/
  app/                 # App Router routes. Server Components by default.
    layout.tsx         # Root layout: <html>/<body>, fonts, global metadata
    page.tsx           # "/" — renders the feedback form
    globals.css        # Tailwind entry + global styles
  components/          # Reusable UI. Client components live here.
    feedback-form.tsx  # Example: the sequential feedback form
    *.test.tsx         # Colocated unit tests
  lib/                 # Framework-agnostic logic, no JSX
    api.ts             # Typed fetch wrapper (apiFetch, ApiError)
    feedback.ts        # Zod schemas + submit helper for the feedback feature
  env.ts               # Validated, type-safe environment variables
e2e/                   # Playwright specs
docs/                  # You are here
```

## Rendering model

Next.js App Router renders **Server Components by default**. A file becomes a
Client Component only when it starts with the `"use client"` directive — that
directive marks the **boundary** where server-rendered output hands off to
client-side JavaScript.

- **Pages (`src/app/**/page.tsx`)** stay Server Components when possible. They
  compose data and render Client Components for interactivity.
- **Interactive UI (state, effects, event handlers, browser APIs)** lives in
  Client Components under `src/components/`.

Example: [`src/app/page.tsx`](../src/app/page.tsx) is a Server Component that
renders the `<FeedbackForm />` Client Component.

## Data flow

```
Component (client)
   │  calls
   ▼
src/lib/<feature>.ts        ← feature logic + Zod schemas
   │  calls
   ▼
src/lib/api.ts (apiFetch)   ← single HTTP entry point, typed, throws ApiError
   │  reads base URL from
   ▼
src/env.ts (NEXT_PUBLIC_API_URL)
   │  HTTP →
   ▼
Backend  POST/GET /api/v1/...
```

- Components never talk to `fetch` or `process.env` directly.
- Feature modules in `src/lib/` own the request/response shapes and validation.
- `apiFetch` centralizes base URL, JSON handling, and error normalization.

## The boundary with the backend

The frontend and backend are **separate repositories**. There is no shared types
package, so request/response shapes are **hand-synced**: the Zod schemas and
TypeScript interfaces in `src/lib/` are the FE's contract, and must be kept in
step with the backend's DTOs. See
[decisions.md](decisions.md#separate-frontend-and-backend-repositories).
