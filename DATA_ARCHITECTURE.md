# OpenClaw Portal - Data Architecture

## Service DB access

The OpenClaw portal uses two Prisma clients.

- Portal client: `prisma/schema.prisma` -> `CG8_PORTAL_DATABASE_URL`
- Service client: `prisma-service/schema.prisma` -> `CG8_OPENCLAW_DATABASE_URL`

The service client is read/write for Pack 6.2 only on these mirrored models:
- Account
- ApiKey
- UsagePeriod
- EvaluationEvent

The portal is a consumer of the service DB schema and must not create or manage migrations in `prisma-service/`.

Account resolution is derived from the authenticated portal user and the stored OpenClaw account linkage. The client never sends account IDs.

## Admin surface (Pack 6.3)

The admin panel at /dashboard/admin/* is gated by role (admin or super_admin).

Defense layers:
1. Middleware in middleware.ts checks the role claim on the JWT for /dashboard/admin/*
2. The admin layout in app/dashboard/admin/layout.tsx re-checks role via requireAdminContext
3. All /api/admin/* routes re-check role via requireAdminContext or requireSuperAdminContext

Admin audit lives in the portal DB in admin_audit_logs. This is separate from the OpenClaw service DB because admin actions are portal concerns. If service-side audit is required later, that belongs in a separate service-owned table.

For portal DB mutations such as role changes and block / unblock, the target change and audit row are written in a single portal DB transaction.

For cross-DB changes such as account plan / limits updates, the service DB change is written first and the portal audit row is written second. If the audit write fails, log it and do not roll back the service DB change.
