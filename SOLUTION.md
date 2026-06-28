# Feedige — Solution Overview (Frontend)

This is the **frontend** half of Feedige, an AI-powered feedback-triage app.

> 📌 **The canonical, full system write-up lives in the backend repo:**
> **[Feedige-BE/SOLUTION.md](https://github.com/Tredeaux/Feedige-BE/blob/main/SOLUTION.md)**
> — overall architecture, the AI integration, key decisions, how I used AI, and
> the most significant production risk (which is server-side). This document
> covers the frontend specifically.

The system is two repos: this client and
**[Feedige-BE](https://github.com/Tredeaux/Feedige-BE)** (NestJS + Postgres +
OpenAI).

---

## What the frontend is

- A **public feedback form** — a guided, "unlock-as-you-go" flow (name → email →
  message) with inline validation.
- An **auth-gated admin panel** with four tabs:
  - **Dashboard** — analytics (sentiment/priority/status, 30-day volume, avg confidence).
  - **All feedback** — paginated, filterable, sortable triage table with inline
    status changes and on-demand (re-)analysis.
  - **Background job** — live status + run log for the analysis cron (auto-refreshing).
  - **Logs** — a filterable view of the audit trail.

---

## Architecture

Next.js 16 **App Router**, TypeScript, Tailwind v4.

```
src/
  app/
    page.tsx              Public feedback form (Server Component shell)
    admin/                Auth-gated panel
      layout.tsx          → AdminGate (auth + role + tab chrome)
      page.tsx            Dashboard
      feedback/ jobs/ logs/   the other three tabs
  components/             Client Components (forms, tables, the panel)
  lib/
    api.ts                apiFetch — the single typed HTTP boundary
    auth.ts auth-token.ts roles + token storage
    feedback.ts jobs.ts audit.ts   per-feature Zod schemas + typed calls
  env.ts                  validated, type-safe environment access
```

**Principles I held to** (codified in [`docs/`](docs/) and enforced by an agent
checklist — see the canonical write-up):

- **Server Components by default**; `"use client"` only at interactive
  boundaries (forms, tables, the panel).
- **One typed network boundary.** Components never call `fetch` directly — they
  go through `apiFetch` ([`src/lib/api.ts`](src/lib/api.ts)), which attaches the
  JWT, parses errors into a typed `ApiError`, and **auto-logs-out on 401**.
- **Validate at the edge, both ways.** Forms validate with Zod
  (`zodResolver`); **API responses are also parsed with Zod** before use, so the
  client doesn't blindly trust the server any more than the server trusts the
  client.
- **Validated env.** `process.env` is never read directly; everything goes
  through [`src/env.ts`](src/env.ts), which fails fast on misconfiguration.

---

## Frontend decisions & trade-offs

**1. A single typed `apiFetch` boundary, not per-call `fetch`/axios.**
Auth, error normalisation, and 401-handling live in one place. _Rejected:_
React Query/SWR. They'd give caching, retries, and dedup for free — genuinely
useful as the data surface grows — but for this scope a thin wrapper + local
component state was simpler to reason about and kept the dependency surface
small. SWR/React Query is the better call once we want cross-component cache
sharing and background revalidation everywhere.

**2. Zod-validating API responses, not trusting the types.**
The contract is hand-synced across two repos, so the client treats the API as
untrusted input and parses it. _Rejected:_ trusting the TypeScript types from a
shared package — which is exactly what a monorepo would enable, and the reason a
monorepo becomes attractive as the DTO surface grows.

**3. Polling for the Background-job monitor, not WebSockets/SSE.**
The run log refreshes on a 15s interval (with a live next-run countdown).
_Rejected:_ a push channel (SSE/WebSocket). Push is the right answer for
high-frequency or many-watcher live data; for a once-a-minute cron watched by a
handful of triagers, polling is dramatically simpler and entirely adequate.

**4. Hand-built Tailwind components, not a component library.**
_Rejected:_ shadcn/ui. A library would have accelerated accessible primitives
(and I'd reach for it next), but I wanted full control over a small, consistent
component set and zero setup cost on Tailwind v4 + React 19.

---

## How I used AI

Same workflow as described in the
[canonical write-up](https://github.com/Tredeaux/Feedige-BE/blob/main/SOLUTION.md#5-how-i-used-ai):
Claude Code as an implementation partner, spec-first and review-heavy, with me
owning the architecture and the bar for "done" — including verifying the two new
admin tabs by **driving the real app in a browser** (Playwright) against live
backend data, not just trusting green unit tests.

---

## A frontend-specific risk worth naming

The **most significant** system risk is server-side (prompt injection) — see the
canonical doc. The frontend's own notable risk: **route protection here is UX,
not security.** `AdminGate` hides the panel from non-triage users client-side,
and the JWT is stored in `localStorage` (simple, but XSS-exposed). The real
enforcement is the backend's `JwtAuthGuard` + `RolesGuard` on every protected
endpoint — the client gate just avoids showing a useless screen. Hardening would
move the token to an httpOnly cookie and add a strict CSP. I relied on the server
as the source of truth deliberately, rather than letting the client's gate imply
a security boundary it doesn't provide.

---

## Testing & running

- **Unit:** Vitest + Testing Library (e.g. the feedback form's validation/flow).
- **E2E:** Playwright setup; I also used it to manually verify the live panel.
- **Gates:** lint, typecheck, unit, build — in CI and via Husky pre-commit.

To run: see [README.md](README.md). In short: `cp .env.example .env.local` →
`npm install` → `npm run dev`, with the backend running (default
`NEXT_PUBLIC_API_URL=http://localhost:3001`).
