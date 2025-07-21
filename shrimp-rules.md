# Development Guidelines

## Project Architecture
- Always modify API route definitions under `app/api/*` instead of `pages/api/*`.
- Coordinate changes in any `app/api/*` endpoint with corresponding docs in `docs/auth-workflows.md` and `docs/security-algorithms.md`.
- Keep `app/` directory as the single source for page routes and API handlers; do not introduce parallel directories for routes.

## Code Standards
- Use TypeScript for all source files; reject JavaScript-only modules.
- Format code with Prettier rules defined in `.prettierrc`; fail commits if formatting differs.
- Enforce ESLint with Next.js recommended config; block merges on lint errors.
- Name hooks `useXxx`, components `Xxx`, utilities with `camelCase`, and types/interfaces with `PascalCase`.

## Functionality Implementation Standards
- Validate all API inputs with Zod schemas in `validation/`; reject handlers missing validation.
- Implement 2FA endpoints only under `app/api/auth/2fa`; do not scatter logic in UI components.
- Centralize email alerts in `app/api/send-email-alert`; do not embed SMTP logic elsewhere.
- Manage sessions in `app/api/auth/device-sessions` and expose UI only via `useDeviceSessions` hook.

## Third-party Library Usage Standards
- Use NextAuth.js for authentication flows; avoid custom auth middleware.
- Use Prisma ORM exclusively for database models; reject raw SQL queries in code.
- Use React Query (`@tanstack/react-query`) for data fetching; do not call fetch directly in components.
- Configure Tailwind CSS via `tailwind.config.js`; disallow inline style objects.

## Workflow Standards
- Invoke Husky `pre-commit` hook to run `npm run lint` and `npm run format`; block commits on failure.
- Use GitHub Actions `ci.yml` to run `npm test`, `npm run lint`, and `npm run build`; do not merge failing PRs.
- Tag releases with semantic versioning (`vX.Y.Z`) in Git tags and update `CHANGELOG.md`.

## Key File Interaction Standards
- When modifying `package.json`, also update `README.md` and `docs/component-architecture.md` if dependencies change.
- When adding a new API route under `app/api`, create or update corresponding validation schema in `validation/`.
- When updating Prisma schema (`prisma/schema.prisma`), always run `prisma generate` and commit generated client code under `src/lib/prisma.ts`.

## AI Decision-making Standards
- Prioritize augmenting existing files over creating new ones when adding similar functionality.
- If a requested path conflicts with `app/` conventions, override user suggestion to conform to the `app/api` structure.
- Always enforce Zod validation presence before accepting any new route handler.

## Prohibited Actions
- Do not create or modify routes under `pages/api`; all API endpoints belong in `app/api`.
- Do not store raw secrets or tokens in code; use environment variables managed in `.env.local`.
- Do not include any general development knowledge or tutorials; include only project-specific rules.
- Do not modify documentation outside the `docs/` folder without simultaneous updates in `docs/component-architecture.md` or related files.
