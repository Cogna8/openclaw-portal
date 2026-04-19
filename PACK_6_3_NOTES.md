# Pack 6.3 audit notes (keep on branch through merge)

Findings from Step 0 verification of the openclaw-portal repo.

## 0.1 PortalUser schema

File: `prisma/schema.prisma`

Confirmed fields on `PortalUser`:
- `role` (portal_role_t: user | admin | super_admin)
- `isBlocked` (Boolean, default false)
- `email` (String, unique)
- `openclawAccountId` (String?, maps to `openclaw_account_id`)
- `lastLoginAt` (DateTime?, maps to `last_login_at`, Timestamptz)

All types and names match the spec. No changes needed to existing `PortalUser` model.

## 0.2 Session role population

File: `src/lib/auth.ts`

- `jwt` callback selects `{ id, role, openclawAccountId }` from portal_users by googleId and writes `token.userId`, `token.role`, `token.openclawAccountId`.
- `session` callback mirrors those onto `(session as any).userId`, `.role`, `.openclawAccountId`.

Middleware can safely read `token.role` via `getToken`. No fallback DB lookup required.

## 0.3 Super-admin constant location

File: `src/services/user-provisioning.ts` line 5 currently holds:
```
const SUPER_ADMIN_EMAIL = "admin@cogna8.io";
```

This pack moves it to `src/lib/constants.ts` and updates the import. Test file `tests/user-provisioning.test.ts` mocks the provisioning module directly so the rename is transparent to tests.

## 0.4 Middleware file and matcher

File: `middleware.ts` at repo root.

Current:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;
  if (!token) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
```

Replaced (not extended) with `getToken`-based JWT decode and role gate for `/dashboard/admin/*`. Old version recorded here for rollback.

## 0.5 Sidebar and dashboard layout shape

- `app/dashboard/layout.tsx` renders `<Sidebar />` with no props (client-side component tree wrapped in `<Providers>`).
- `src/components/sidebar.tsx` is `"use client"` with a static `navItems` array. After Pack 6.2 it includes: Dashboard, API Keys (/dashboard/keys), Usage (/dashboard/usage), Setup Guide (disabled), Settings (disabled).

Changes in Pack 6.3:
- Dashboard layout becomes `async` and a server component, calls `auth()`, passes `role` prop to `<Sidebar role={...} />`.
- Sidebar accepts `role` prop, filters nav items by role. Admin item added, gated to admin and super_admin. Per spec, no new placeholder/disabled nav items are added.

## 0.6 UserMenu component path

File: `src/components/user-menu.tsx` exists. Sidebar import `./user-menu` works as-is.

## Pre-migration sanity

`portal_users` row count can only be checked against a live DB. Not accessible from this branch. Migration is additive (adds a new table + enums) and does not touch `portal_users`, so row count is not affected.

## Deltas from the spec sample code

- Portal singleton is `getPortalDb()` factory, not `portalDb` direct export. All samples adapted accordingly.
- Service singleton is `getServiceDb()` factory, not `serviceDb` direct export. Samples adapted.
- Service DB env var is `CG8_OPENCLAW_DATABASE_URL` (existing, not renamed).
- Auth entrypoint is `@/lib/auth` (already consistent with spec).

## Pack 6.2 baseline

This branch starts from `claude/api-key-management-dashboard-HZPR5` which carries Pack 6.2. `main` does not yet have Pack 6.2, so basing this branch directly off main would leave `@/lib/db/service` and `/dashboard/keys` missing. Downstream merge order should be: Pack 6.2 to main, then Pack 6.3 to main.
