# Playbook: Adding a Feature Consistently

Follow this when adding a page, form, or anything that talks to the backend. It
encodes the patterns already in the codebase so new work matches existing work.

## 1. Plan the data contract first

- Define the request/response shapes as **Zod schemas** in
  `src/lib/<feature>.ts`. Export a TypeScript type via `z.infer`.
- If the feature submits a form, expose **per-field schemas** plus a composite
  object schema (mirrors `src/lib/feedback.ts`).
- Add a typed call function that uses `apiFetch` (e.g. `submitFeedback`). Keep the
  path versioned (`apiFetch` already prefixes `/api/v1`).
- **Confirm the shape matches the backend DTO** (separate repo — hand-synced).

## 2. Build the UI

- Add the route under `src/app/<route>/page.tsx` as a **Server Component** that
  composes and renders Client Components.
- Put interactive pieces in `src/components/<name>.tsx` with `"use client"`.
- For forms: react-hook-form + `zodResolver`, `mode: "onTouched"`, `useWatch` for
  live values. Model async UI with a discriminated-union state.
- Style with Tailwind utility classes + theme tokens + `dark:` variants. Factor
  long repeated class strings into a constant.
- Accessibility: labels tied to inputs, `aria-invalid`, `role="status"`/`"alert"`.

## 3. Handle env / config (if needed)

- New config? Add it to `src/env.ts` (correct server/client block) and
  `.env.example`. Client values need the `NEXT_PUBLIC_` prefix.

## 4. Test it

- Colocate `*.test.tsx` next to the component. Test the **behavior** a user sees
  (validation messages, enabled/disabled states, success/error rendering) with
  `@testing-library/user-event`.
- Add/adjust a Playwright spec in `e2e/` if it's a meaningful user flow.

## 5. Verify locally (all must pass)

```bash
npm run lint        # keep it warning-free
npm run typecheck
npm run test:ci
npm run build
```

## 6. Document & commit

- Update root `CHANGELOG.md` under `[Unreleased]`.
- If you introduced a new pattern or made a notable choice, add an entry to
  [decisions.md](decisions.md) and update [conventions.md](conventions.md) if a
  rule changed.
- Commit (the Husky pre-commit hook runs lint-staged). CI must stay green.

## Quick checklist

- [ ] Zod schema(s) + inferred types in `src/lib/<feature>.ts`
- [ ] Backend call via `apiFetch` (no direct `fetch`)
- [ ] Shape matches backend DTO
- [ ] Page = Server Component; interactivity = Client Component
- [ ] `useWatch` (not `watch()`); `mode: "onTouched"`
- [ ] Accessible labels / `aria-invalid` / status roles
- [ ] No direct `process.env` (use `src/env.ts`)
- [ ] Tailwind tokens + `dark:`; classes Prettier-sorted
- [ ] Colocated behavior tests
- [ ] lint / typecheck / test:ci / build green
- [ ] CHANGELOG (+ decisions/conventions if relevant) updated
