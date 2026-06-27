# Conventions & Rules

These are the rules every addition must follow. They exist so the codebase reads
as if one person wrote it. When a rule genuinely shouldn't apply, say why in the
PR and in [decisions.md](decisions.md).

## Components

- **Server Components by default.** Add `"use client"` only when you need state,
  effects, event handlers, or browser APIs — and add it at the smallest component
  that needs it, not the whole page.
- **Keep pages thin.** `src/app/**/page.tsx` composes; interactive logic lives in
  `src/components/`.
- **Props must be serializable** when passed from a Server Component to a Client
  Component (no functions/class instances across that boundary).
- **Model UI state explicitly.** Use discriminated unions for async/multi-state UI
  rather than scattered booleans. Example from `feedback-form.tsx`:
  ```ts
  type SubmitState =
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "success" }
    | { status: "error"; message: string };
  ```

## Forms & validation

- **Zod is the single source of validation truth.** Define schemas in
  `src/lib/<feature>.ts`, not inline in components.
- **Expose per-field schemas when the UX needs field-level logic** (e.g. the
  sequential unlock), plus a composite object schema for submit. See
  `src/lib/feedback.ts` (`nameSchema`, `emailSchema`, `messageSchema`,
  `feedbackSchema`).
- **Forms use react-hook-form with `zodResolver`.**
  - Default `mode: "onTouched"` so errors appear after blur, not on first keystroke.
  - **Use `useWatch({ control, name })`, not `watch()`**, to read live values —
    `watch()` trips the React Compiler (Next 16) and de-optimizes the component.
  - Derive live field validity with `schema.safeParse(value).success` when you need
    behavior (like unlocking) that's independent of when RHF surfaces error text.
- **Accessibility is required, not optional:**
  - Every input has a `<label htmlFor>` ↔ `id`.
  - Set `aria-invalid` on invalid fields.
  - Use `role="status"` for success and `role="alert"` for errors.
- **Sequential unlock pattern** (established UX): later fields are `disabled` until
  earlier fields are valid; locked fields are dimmed and show a guiding hint.
  Reuse the `Field` wrapper approach in `feedback-form.tsx` for multi-step forms.

## Environment variables

- **Never read `process.env` directly.** Import `env` from `src/env.ts`.
- Add new vars to `src/env.ts` (server vs client section) **and** `.env.example`.
- **Client-exposed vars must be prefixed `NEXT_PUBLIC_`** and declared in the
  `client` block; everything else is server-only.

## API access

- **All HTTP goes through `apiFetch` in `src/lib/api.ts`.** Never call `fetch`
  directly from a component or page.
- `apiFetch` prepends the versioned base (`${NEXT_PUBLIC_API_URL}/api/v1`), sends/
  parses JSON, and throws `ApiError` (with `status` + `body`) on non-2xx.
- **Catch `ApiError`** to show user-facing messages; branch on `err.status` when
  the UX needs to.
- Keep request/response **types in the feature's `src/lib/` module** and keep them
  aligned with the backend (hand-synced — see architecture.md).

## Styling

- **Tailwind v4 utility classes.** No CSS-in-JS, no ad-hoc `.css` files per
  component.
- **Use theme tokens** (`bg-foreground`, `text-background`, etc.) and support dark
  mode with `dark:` variants, consistent with `layout.tsx`/`globals.css`.
- **Prettier sorts classes** (`prettier-plugin-tailwindcss`) — don't hand-order
  them; run `npm run format`.
- Factor long, repeated class strings into a named constant (see `inputClass` in
  `feedback-form.tsx`) rather than duplicating.

## Naming & imports

- **Files:** kebab-case (`feedback-form.tsx`, `api.ts`).
- **Components:** PascalCase named exports (`export function FeedbackForm()`).
- **Imports:** use the `@/` alias for `src/` (`@/lib/api`), not deep relative paths.
- Let ESLint/Prettier handle ordering and formatting; don't fight them.

## Testing

- **Colocate unit tests** as `*.test.tsx` next to the source.
- **Test behavior, not implementation.** e.g. `feedback-form.test.tsx` asserts the
  unlock sequence and validation messages a user would experience.
- Use `@testing-library/user-event` for interactions; query by role/label.
- **e2e** specs live in `e2e/` (Playwright). First run needs `npx playwright install`.
- Tests that hit the network should be avoided in unit tests — test up to the
  `apiFetch` boundary, not real HTTP.

## Quality gates (must stay green)

Run before committing (the Husky pre-commit hook runs lint-staged automatically):

```bash
npm run lint        # ESLint (incl. React Compiler checks) — keep it warning-free
npm run typecheck   # tsc --noEmit
npm run test:ci     # vitest run
npm run build       # next build
```

CI runs the same on every push/PR. **Keep lint warning-free** — a tolerated
warning today becomes noise that hides a real one tomorrow.

## Documentation upkeep

- Update the root `CHANGELOG.md` (`[Unreleased]`) for every behavior change.
- Update these docs when you change a convention or make a notable decision.
