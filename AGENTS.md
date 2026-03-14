# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router pages, layouts, and API routes (`src/app/api/**/route.ts`).
- `src/components/`: UI building blocks (`ui/`) and feature/shared components (`dashboard/`, `vendors/`, `shared/`, etc.).
- `src/modules/`: Service-layer logic by domain (for example `vendors.service.ts`, `risk.service.ts`).
- `src/lib/`: Shared utilities, API helpers, Supabase clients, and SQL schema (`src/lib/schema.sql`).
- `src/hooks/`, `src/types/`: Reusable hooks and TypeScript types.
- `src/__tests__/`: Jest tests grouped by area (`api/`, `components/`, `hooks/`, `lib/`).
- `public/`: Static assets. `docs/`: product docs and references.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server (default `http://localhost:3000`).
- `npm run build`: Create production build.
- `npm run start`: Run production server from built output.
- `npm run lint`: Run ESLint (Next.js core-web-vitals + TypeScript rules).
- `npm test`: Run Jest test suite once.
- `npm run test:watch`: Run Jest in watch mode.
- `npm run db:schema`: Apply `src/lib/schema.sql` to `$DATABASE_URL`.
- `npm run db:seed` / `npm run db:reset`: Seed/reset database (requires `src/lib/seed.sql`).

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled (`tsconfig.json`).
- Imports: use alias paths like `@/components/...` and `@/lib/...`.
- Naming: React components in `PascalCase`; hooks prefixed with `use` (for example `use-auth.ts`); service files as `<domain>.service.ts`.
- Keep formatting consistent with surrounding files; run `npm run lint` before opening a PR.

## Check for context
- 

## Testing Guidelines
- Framework: Jest + `@testing-library/react` (`jest.config.ts`, `jest.setup.ts`).
- Test files: `*.test.ts` / `*.test.tsx`, colocated under `src/__tests__/` by feature.
- Prefer behavior-focused tests for API routes, hooks, and shared components.
- Run `npm test` locally before pushing changes.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `type: short summary` (example: `feat: add vendor risk filter`).
- Keep commits focused and logically scoped.
- PRs should include:
  - Clear description of what changed and why.
  - Linked issue/ticket when available.
  - Test evidence (`npm test`, `npm run lint`), plus screenshots for UI changes.
