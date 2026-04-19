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
