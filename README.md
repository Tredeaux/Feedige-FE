# Feedige — Frontend

Next.js + TypeScript web client for Feedige.

## Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Env:** type-safe & validated with [`@t3-oss/env-nextjs`](https://env.t3.gg/) + Zod
- **Unit tests:** [Vitest](https://vitest.dev/) + Testing Library
- **E2E tests:** [Playwright](https://playwright.dev/)
- **Quality:** ESLint + Prettier, Husky + lint-staged pre-commit hooks

## Requirements

- Node.js `>=22` (see [`.nvmrc`](.nvmrc))
- The [Feedige backend](https://github.com/Tredeaux/Feedige-BE) running (default `http://localhost:3001`)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable              | Required | Default                 | Description                 |
| --------------------- | -------- | ----------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | no       | `http://localhost:3001` | Base URL of the backend API |

Validation lives in [`src/env.ts`](src/env.ts). Import `env` from there rather than reading `process.env` directly.

The backend client wrapper is in [`src/lib/api.ts`](src/lib/api.ts) (`apiFetch`).

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Production build (standalone output) |
| `npm run start`     | Serve the production build           |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | Type-check without emitting          |
| `npm test`          | Unit tests (watch)                   |
| `npm run test:ci`   | Unit tests (single run)              |
| `npm run test:e2e`  | Playwright e2e tests                 |
| `npm run format`    | Format with Prettier                 |

> The first `npm run test:e2e` run needs browsers: `npx playwright install`.

## Docker

```bash
docker compose up --build
```

Bakes `NEXT_PUBLIC_API_URL` at build time (see `docker-compose.yml` / `Dockerfile` build args).
