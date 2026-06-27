# Decision Log (ADRs)

Lightweight record of notable technical decisions: what we chose, why, and the
alternative we rejected. Append new entries at the top. Keep them short.

Format: **Decision → Why → Rejected alternative (when it would win).**

---

## Client auth: JWT in localStorage + AuthProvider context

**Decision:** The admin panel auths against the backend's self-hosted JWT endpoints.
The token is stored in `localStorage` (`src/lib/auth-token.ts`), attached as a Bearer
header by `apiFetch`, and session state lives in an `AuthProvider` context
(`useAuth`) that rehydrates from `/auth/me` on mount. The admin page renders sign
in/up forms when unauthenticated and the panel when authenticated.

**Why:** Simplest contract across the separate FE/BE origins; no external auth, per
the requirement. Context keeps auth state in one place; rehydration via `/auth/me`
survives reloads.

**Trade-off / hardening:** `localStorage` is XSS-readable. For production, switch to
an httpOnly Secure cookie (set by the BE), which also removes the manual Bearer
wiring. Add refresh-token rotation and route-level guards (middleware) then.

**Rejected:** httpOnly cookies now (more cross-origin setup than "simple" warrants in
dev); a data library (TanStack Query) for auth state (overkill for one session object).

---

## Sequential field unlocking for the feedback form

**Decision:** On the feedback form, fields unlock one at a time — email is disabled
until the name is valid, feedback until the email is valid, submit until all are
valid. Locked fields are dimmed with a guiding hint.

**Why:** Guides the user through a short form and prevents low-quality/partial
submissions. Live validity is computed with per-field `schema.safeParse()` so
unlocking is independent of when error text appears.

**Rejected:** A flat form with all fields enabled and validation only on submit —
simpler, but loses the guided UX the product wants. Use the flat approach for
long/optional forms where gating would frustrate power users.

---

## react-hook-form + Zod for forms

**Decision:** Use react-hook-form with `@hookform/resolvers/zod`; Zod schemas in
`src/lib/`.

**Why:** RHF is uncontrolled-first (fewer re-renders, good performance), integrates
cleanly with Zod for one source of validation truth shared between field-level and
submit-level checks. Zod was already a dependency (via env validation).

**Rejected:** Formik (heavier, more re-renders, weaker TS inference); hand-rolled
`useState` forms (fine for a single trivial input, but inconsistent and error-prone
as forms grow). A one-field form _can_ skip RHF, but default to RHF for consistency.

**Note:** `useWatch` is used instead of `watch()` because Next 16's React Compiler
flags `watch()` as non-memoizable.

---

## Typed `apiFetch` wrapper instead of per-call fetch / axios

**Decision:** A single `apiFetch<T>()` in `src/lib/api.ts` is the only HTTP entry
point; it normalizes the base URL, JSON, and errors (`ApiError`).

**Why:** One place to handle the versioned base URL, headers, and error shape;
components stay declarative; easy to add auth headers/retries later in one spot.

**Rejected:** axios (extra dep; native `fetch` is sufficient). Calling `fetch`
directly in components (scatters URL/error logic, inconsistent handling). A data
library like TanStack Query is a reasonable _future_ add when we need caching,
background refetch, or optimistic updates — layer it **on top of** `apiFetch`,
don't replace the boundary.

---

## Validated env via `@t3-oss/env-nextjs`

**Decision:** All env access goes through `src/env.ts`, which validates with Zod at
build/startup. Never read `process.env` directly.

**Why:** Fail fast on missing/misconfigured env, full type-safety, and a clear
server/client split that prevents leaking server secrets into the bundle.

**Rejected:** Raw `process.env` access (untyped, fails silently at runtime far from
the cause).

---

## Tailwind CSS v4 for styling

**Decision:** Tailwind v4 utility classes with theme tokens and `dark:` variants;
Prettier plugin sorts classes.

**Why:** Fast, consistent, colocated styling with no naming overhead; class sorting
keeps diffs clean.

**Rejected:** CSS Modules / styled-components (more files, context switching, and
runtime cost for styled-components).

---

## Vitest (unit) + Playwright (e2e)

**Decision:** Vitest + Testing Library for component/unit tests (colocated);
Playwright for end-to-end.

**Why:** Vitest is fast and shares the Vite/TS toolchain; Testing Library pushes
behavior-focused tests. Playwright covers real browser flows the unit layer can't.

**Rejected:** Jest (slower here, extra config alongside the Vite tooling); Cypress
(heavier than Playwright for our needs).

---

## Separate frontend and backend repositories

**Decision:** FE (`Feedige-FE`) and BE (`Feedige-BE`) are separate repos. API
contracts are hand-synced via the Zod schemas/types in `src/lib/`.

**Why:** Explicit product choice for independent deploy/ownership.

**Trade-off / how to proceed:** No shared types package, so FE and BE shapes can
drift. Keep `src/lib/<feature>.ts` aligned with the backend DTOs on every change.
If drift becomes painful, options are (a) generate a typed client from the
backend's OpenAPI/Swagger spec, or (b) publish a shared types package — prefer (a)
since the backend already exposes Swagger.

---

## Next.js 16 + App Router

**Decision:** App Router with React Server Components; `src/` dir; `@/*` alias.

**Why:** Current Next.js default; Server Components reduce client JS and keep data
work on the server.

**Note:** Next 16 has breaking changes vs. older versions (e.g. `dev` spawns a
persistent background server; React Compiler is active). Consult
`node_modules/next/dist/docs/` when unsure rather than assuming older behavior.
