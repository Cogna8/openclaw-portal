# Cogna8 Canonical Design

**The design system for every Cogna8 app is `@cogna8/ui`.** Read this before touching styles, themes, or UI primitives.

This document is loaded by the `/cogna8-ui` Claude Code skill on every session.

---

## What is `@cogna8/ui`?

A private package shipped from `Cogna8/ui` and published to GitHub Packages. It bundles:

- **Tokens.** A single `globals.css` with the Radix Nova preset on the Mist base color and the Cyan chart palette. `--primary` is Cogna8 system orange in both light and dark modes.
- **Tailwind v4 theme.** The `@theme inline` block exposes every token as a Tailwind utility (`bg-card`, `text-muted-foreground`, `border`, `text-primary`, `bg-sidebar`, etc.). No `tailwind.config.*` is needed in consumers.
- **shadcn primitives.** 55 components at `@cogna8/ui/components/ui/*` (Card, Button, Switch, Dialog, Alert, Badge, Sidebar, …). These are the design system. Use them.
- **Brand components.** `Header`, `ThemeToggle`, `HexGridBackground`, `Providers` at `@cogna8/ui/components/brand/*`.
- **`cn()` helper.** From `@cogna8/ui/lib/utils`.

## Mandatory rules

1. **Check `@cogna8/ui/components/ui/*` FIRST.** If a primitive exists there, use it. Do not hand-roll.
2. **Never recreate primitives in `src/components/ui/`.** Consumers do not own the design system. The directory should not exist.
3. **Never define a `tailwind.config.*`.** Tailwind v4 reads the `@theme` block from the package's `globals.css`. Adding a config overrides tokens and creates drift.
4. **Never re-define tokens.** `:root { --primary: ...; }` etc. live in the package. Consumers re-importing or re-declaring them is forbidden.
5. **Never use arbitrary-value token imposters.** Banned in className strings:
   - `bg-[oklch(var(--card))]` — use `bg-card`
   - `border-[oklch(var(--border))]` — use `border` (or `border-border`)
   - `text-[oklch(var(--muted-foreground))]` — use `text-muted-foreground`
   - `bg-[oklch(var(--primary))]` — use `bg-primary`
   - `hover:bg-[oklch(var(--accent))]` — use `hover:bg-accent`
   - …and every other `(bg|border|text|hover:*)-\[oklch\(var\(--…\)\)\]` pattern. Grep the repo before each commit.
6. **`globals.css` is one line.** It must contain only `@import "@cogna8/ui/styles/globals.css";`. Layered overrides are tolerated below the import only when they cannot be expressed as utility classes; never re-declare tokens.
7. **PostCSS uses `@tailwindcss/postcss`.** Do not add `autoprefixer` (Tailwind v4 bundles it). Do not pin `tailwindcss@3` — the package requires `^4`.
8. **Lucide is being phased out.** Use `@phosphor-icons/react` for new icons. Migrate Lucide imports as you touch each file.

## File layout — what consumers MAY have

- `app/globals.css` — single `@import` line.
- `app/layout.tsx` — wires Geist fonts via CSS variables and renders `<AppProviders>`.
- `src/components/app-providers.tsx` — composes `next-themes` `ThemeProvider` with `next-auth/react` `SessionProvider`. This is application-level glue, not a design primitive.
- `src/components/header.tsx` — **2-line `"use client"` re-export of the package `Header`.** This is interop, not a wrapper. Required because the package's compiled `Header` is missing the `"use client"` directive (transitively pulls in client-only `radix-ui` components). Delete this file the moment `@cogna8/ui` ships `"use client"` on `dist/components/brand/header.js`.
- `next.config.ts` — must include `transpilePackages: ["@cogna8/ui"]` so Next can re-compile package modules using the new JSX transform when needed.
- `.npmrc` — at repo root, with the GitHub Packages scope and `${GITHUB_TOKEN}` expansion. Never commit a literal token.

## File layout — what consumers MUST NOT have

- `src/components/ui/` — primitives belong to the package.
- `tailwind.config.*` — there is no Tailwind config in any Cogna8 consumer.
- `src/lib/utils.ts` — use `cn()` from `@cogna8/ui/lib/utils`.
- Local `theme-toggle.tsx`, `providers.tsx`, `hex-grid-background.tsx`. The package owns these.
- Local hand-rolled equivalents of any package primitive (no DIY Switch, Card, Alert, Badge, Sidebar, etc.).

## Token cheat sheet

| Old / Wrong                                          | New / Correct          |
| ---------------------------------------------------- | ---------------------- |
| `bg-[oklch(var(--background))]`                      | `bg-background`        |
| `bg-[oklch(var(--card))]`                            | `bg-card`              |
| `bg-[oklch(var(--primary))]`                         | `bg-primary`           |
| `bg-[oklch(var(--muted))]`                           | `bg-muted`             |
| `bg-[oklch(var(--accent))]`                          | `bg-accent`            |
| `border-[oklch(var(--border))]`                      | `border` or `border-border` |
| `border-[oklch(var(--primary))]`                     | `border-primary`       |
| `text-[oklch(var(--foreground))]`                    | `text-foreground`      |
| `text-[oklch(var(--muted-foreground))]`              | `text-muted-foreground`|
| `text-[oklch(var(--primary))]`                       | `text-primary`         |
| `text-[oklch(var(--primary-foreground))]`            | `text-primary-foreground` |
| `bg-[#C65A20]` (literal Cogna8 orange)               | `bg-primary`           |

Sidebar: use `bg-sidebar` and `bg-sidebar-accent` / `text-sidebar-accent-foreground` for the chrome — not `bg-background` — so the sidebar reads correctly in both themes.

Charts: `chart-1` through `chart-5` are a cyan gradient. Use them directly; do not hand-pick hex.

## Pre-commit checklist

```bash
# 1. Zero arbitrary-value imposters (the canvas in HexGridBackground is the only allowed exception, and it lives in the package)
grep -rnE "(bg|border|text|hover:[a-z]+)-\[oklch\(var\(--" app/ src/ --include="*.tsx" | grep -v hex-grid-background
# expect: no output

# 2. No forbidden directories or files
[ ! -d src/components/ui ] && echo "ok"
[ ! -e tailwind.config.ts ] && [ ! -e tailwind.config.js ] && echo "ok"
[ ! -e src/lib/utils.ts ] && echo "ok"
for f in providers theme-toggle hex-grid-background; do
  [ ! -e "src/components/$f.tsx" ] && echo "$f ok"
done

# 3. globals.css is the single import line
[ "$(wc -l < app/globals.css)" -le 1 ] && echo "ok"

# 4. Build and tests
SKIP_ENV_VALIDATION=1 NEXT_TELEMETRY_DISABLED=1 pnpm build
pnpm test
```

## When `@cogna8/ui` is missing something

1. Open an issue on `Cogna8/ui` and propose the primitive there.
2. Do **not** add it locally to ship it faster. Local primitives become the next round of design drift.
3. The only acceptable local files are: application-level state composers (e.g. `app-providers.tsx`) and documented one-line interop shims (e.g. `header.tsx` `"use client"` re-export).

## Why this exists

Every per-app shadcn init drifts. Tokens get nudged, primitives get hand-edited, "just this once" arbitrary values multiply. Six months later no two Cogna8 surfaces share the same look. `@cogna8/ui` is the lever that prevents that. Every Cogna8 app reads from the same tokens and the same primitives. Drift requires a PR against `Cogna8/ui` — and that PR affects every app at once, which is exactly the level of friction needed to keep the system honest.
