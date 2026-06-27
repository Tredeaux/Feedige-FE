# Feedige FE — Engineering Docs

**Read this folder before making changes.** It is the source of truth for _how_
the Feedige frontend is built and _why_. The goal is that any contributor —
human or AI — can extend the app so that every addition is consistent with what
already exists.

## How to use these docs

1. **Before writing code**, skim [`conventions.md`](conventions.md) and
   [`architecture.md`](architecture.md).
2. **When adding a feature/page**, follow [`adding-a-feature.md`](adding-a-feature.md).
3. **When making a non-obvious technical choice**, record it in
   [`decisions.md`](decisions.md) (an ADR-style log).
4. **When you change how things work**, update the relevant doc here _and_ the
   root `CHANGELOG.md` as part of the same change. Docs are part of "done".

## Contents

| Doc                                        | What's in it                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)         | Folder layout, the rendering model, data flow, where things live                   |
| [conventions.md](conventions.md)           | The rules: components, forms/validation, env, API access, styling, testing, naming |
| [decisions.md](decisions.md)               | Why we chose what we chose (and the alternatives we rejected)                      |
| [adding-a-feature.md](adding-a-feature.md) | Step-by-step playbook + checklist for consistent additions                         |

## The short version

- **Next.js 16, App Router, TypeScript.** Server Components by default; `"use client"`
  only at interactive boundaries.
- **Validation is Zod-first.** Schemas live in `src/lib/`; forms use react-hook-form
  - `zodResolver`.
- **Never read `process.env` directly.** Import the validated `env` from `src/env.ts`.
- **Never call `fetch` directly in a component.** Go through `apiFetch` in `src/lib/api.ts`.
- **Styling is Tailwind v4** utility classes with theme tokens; Prettier sorts classes.
- **Tests are colocated** (`*.test.tsx`) with Vitest + Testing Library; Playwright for e2e.
- **This is a separate repo from the backend** — API types are hand-synced. See
  [decisions.md](decisions.md#separate-frontend-and-backend-repositories).
