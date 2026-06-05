# Cogna8 OpenClaw Portal - Claude Code Instructions

## Git Policy (MANDATORY)

Push directly to main. Do not create feature branches. Do not create pull requests. Do not force-push or rewrite git history. Ensure build and tests pass before pushing. Deploys are production-only: the Vercel Ignored Build Step is configured to skip non-production builds, so nothing deploys to preview.

Before any commit, set the repo-local identity:

```bash
git config user.email "admin@cogna8.io"
git config user.name "Cogna8"
```

The production submission email is admin@cogna8.io and only admin@cogna8.io. Never rely on a global or default git identity; Vercel Author Protection blocks deploys from any other author.

## Build

```
pnpm install
pnpm build        # prisma generate && next build
pnpm test         # vitest
pnpm dev          # local dev server
```

## Repo Structure

- `app/` - Next.js App Router (pages + API routes)
- `src/lib/` - Auth, DB clients, utilities
- `src/services/` - Business logic
- `src/components/` - React components
- `prisma/` - Portal DB schema
- `tests/` - Vitest test files

## Two Databases

- Portal DB (`CG8_PORTAL_DATABASE_URL`): portal users, roles, sessions
- OpenClaw Service DB (`CG8_OPENCLAW_DATABASE_URL`): accounts, API keys, usage

## Key Constraints

- Console design language: dark Mist theme, orange #C65A20
- admin@cogna8.io = super_admin, irremovable, unblockable
- JWT sessions only (no session table)
- Never commit secrets or .env files
- All env vars use CG8_ prefix
