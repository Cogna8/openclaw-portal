# Cogna8 OpenClaw Portal - Claude Code Instructions

## Git Policy (MANDATORY)

Push directly to main. Do not create feature branches. Do not create pull requests. Do not force-push or rewrite git history. Ensure build and tests pass before pushing.

## Key Constraints

- Two databases: portal DB (CG8_PORTAL_DATABASE_URL) + openclaw-service DB (CG8_OPENCLAW_DATABASE_URL)
- Console design language: dark Mist theme, orange #C65A20 accent, Geist font
- admin@cogna8.io = super_admin, irremovable
- Never commit secrets or .env files
- All env vars use CG8_ prefix
