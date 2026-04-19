# Pack 6.2 audit notes (delete before merge)

Findings from Step 0 verification of the openclaw-portal repo.

## 0.1 Hash derivation rule

Spec assumption: `lookupHash = secretHash = sha256(rawKey)` where `rawKey = "cg8_sk_" + base64url(32 random bytes)`.

`openclaw-service` source not accessible from this branch. Implementation follows the spec's documented rule. End-to-end validation against `/v1/evaluate` MUST be performed by an operator before this work is treated as live.

If the service uses a different rule, update `src/lib/keys/generate.ts` accordingly.

## 0.2 Existing portal Prisma singleton

File: `src/lib/portal-db.ts`
Export: `getPortalDb()` factory function (lazy singleton, uses `PrismaNeon` adapter)

Not renaming. Service client mirrors the same factory pattern.

## 0.3 PortalUser -> Account linkage

`PortalUser.openclawAccountId` field exists in `prisma/schema.prisma`.
Pack 6.1 sign-in writes `account.id` (the service `Account.id` UUID) into this field via `handleSignIn` in `src/services/user-provisioning.ts`.

Primary linkage path: `PortalUser.openclawAccountId -> Account.id`.
Fallback `Account.ownerUserId` is also handled in `getCurrentAccountContext`.

## 0.4 nanoid

Already in `package.json` at `^3.3.0`. No install needed.

## 0.5 publicId format

Existing convention: `acct_<8 nanoid chars>` for accounts (see `src/lib/ids.ts`).
This work uses `key_<16 nanoid chars>` for API keys (per Pack 1 spec).

## 0.6 Env var name

Existing portal env var for the service DB is `CG8_OPENCLAW_DATABASE_URL` (set in `.env.example`, used by `src/lib/openclaw-db.ts`).

Spec proposes `CG8_SERVICE_DATABASE_URL`. Using the existing name to avoid regressing the existing Pack 6.1 account-provisioning code path and to match what is already configured in Vercel.

## 0.7 NextAuth entrypoint

File: `src/lib/auth.ts`
Exports: `{ handlers, auth, signIn, signOut }`
Import specifier with current tsconfig (`@/*` -> `./src/*`): `@/lib/auth`
