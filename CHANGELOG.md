# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Maintained by both humans and AI assistants. AI-made changes are recorded here
> as part of completing each task.

## [Unreleased]

### Added

- Admin **Background job** tab (`/admin/jobs`) — a live status card (health, schedule, next-run
  countdown, totals) plus a log-format run history with timestamps, outcome, detail, and duration;
  auto-refreshes every 15s and filters by outcome.
- Admin **Logs** tab (`/admin/logs`) — a filterable audit-log table (search, action dropdown, date
  range) with actor, target, and old→new change diffs, paginated.
- Admin **Dashboard** view with analytics — stat cards (total / analyzed / backlog / avg
  confidence), bar charts for sentiment / priority / status, a **30-day feedback-volume
  time-series**, and a top-themes list (from `GET /api/v1/feedback/stats`). The admin area is now split into **Dashboard** and
  **All feedback** sub-tabs behind a shared auth gate (`/admin`, `/admin/feedback`).

### Changed

- Refactored admin gating into a shared `AdminGate` (used by the admin layout); the feedback
  table moved to `/admin/feedback`. Replaces the single `AdminPanel` component.

- Editable status per row in the triage table — a dropdown that changes a feedback item's status
  (`PATCH /api/v1/feedback/:id/status`, audited on the backend) and refreshes.
- "Analyse" / "Re-analyse" action per row in the triage table — triggers the backend AI
  analysis (`POST /api/v1/feedback/:id/analyze`), then refreshes to show the new
  sentiment/priority tags. Per-row loading state and a clear message when AI isn't configured.
- Admin triage table (`FeedbackTable`): a paginated (20/page), searchable, status-filterable,
  sortable table of all feedback, with status/sentiment/priority tags and submitter info. Fetches
  the guarded `GET /api/v1/feedback`; loading/empty/error states; replaces the admin placeholder.
  Tests for row rendering and the empty state.

### Security

- The admin panel is now gated on role (`admin`/`triage`), not just "authenticated" — an
  authenticated member sees a no-access message instead of the panel.
- `apiFetch` clears the token and emits `feedige:unauthorized` on a 401 to a token-bearing
  request; `AuthProvider` listens and logs out, so an expired token no longer strands the UI.
- Backend responses are validated with Zod at the boundary (`lib/auth.ts`, `lib/feedback.ts`)
  instead of being trusted via a type cast.

### Added

- Admin panel authentication: sign-in / sign-up forms gating the `/admin` panel, an
  `AuthProvider` context (`useAuth`) that stores the JWT and rehydrates the session from
  `/auth/me`, and a token store (`src/lib/auth-token.ts`) wired into `apiFetch` as a Bearer
  header. Validated with Zod + react-hook-form; sign-out clears the session. Component test
  for the form toggle.
- Top navigation tabs (Feedback / Admin) via a `TabNav` component in the root layout, with
  active-route highlighting. New `/admin` route scaffolds the triage/admin panel (placeholder
  until the backend list endpoint exists). Component test for the tabs.
- `docs/engineering-standards.md` — senior engineering expectations & review checklist (the bar
  we hold work to). Linked from `AGENTS.md` and the docs index so AI tools self-check against it.
- Comprehensive `README` — tech stack, architecture/data-flow, run instructions, API contract,
  and a "Packages reference" section summarising every explicit dependency.
- `docs/` engineering folder — architecture, conventions, decision log (ADRs), and a
  "adding a feature" playbook — as the source of truth for FE design decisions and rules.
  Wired into `AGENTS.md` so AI tools discover it.
- Feedback submission form as the index page (`/`): name, email, and feedback fields that
  **unlock in sequence** as each prior field becomes valid, guiding the user step by step.
- Clean per-field validation with Zod (`src/lib/feedback.ts`) and react-hook-form; inline
  errors on blur, character counter, and success/error states on submit.
- Component tests for the sequential-unlock flow and validation (`feedback-form.test.tsx`).
- Initial Next.js scaffold (TypeScript, App Router, Tailwind CSS v4, ESLint, `src/`, `@/*` alias).
- Type-safe, validated environment variables via `@t3-oss/env-nextjs` + Zod (`src/env.ts`).
- Typed backend API client `apiFetch` (`src/lib/api.ts`) using `NEXT_PUBLIC_API_URL`.
- Vitest + Testing Library unit testing setup, with an example test.
- Playwright end-to-end testing setup, with an example spec.
- Prettier (with `prettier-plugin-tailwindcss`) integrated into the ESLint config.
- Multi-stage `Dockerfile` (standalone output) and `docker-compose.yml`.
- GitHub Actions CI (lint, typecheck, unit tests, build).
- Dependabot configuration and a pull request template.
- Husky + lint-staged pre-commit hooks.
- Project hygiene: `format`/`format:check`/`typecheck`/test scripts, `.nvmrc`, `.editorconfig`,
  `engines` pin (Node `>=22`).
- This `CHANGELOG.md`.

### Changed

- App metadata title set to `Feedige`.
- `next.config.ts`: enabled `reactStrictMode` and `output: "standalone"` (for the Docker image).
- `.gitignore`: ignore Playwright/coverage artifacts; allow `.env.example` to be committed.
- Default branch renamed from `master` to `main`.
