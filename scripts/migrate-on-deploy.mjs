#!/usr/bin/env node
/**
 * Runs `prisma migrate deploy` against the portal schema ONLY when
 * deploying to Vercel production. No-ops locally and in preview builds.
 *
 * This prevents:
 *  - Preview / PR-branch builds from mutating the production DB
 *  - Local `npm run build` from trying to reach a DB
 *  - Deploys continuing if migrations fail (exit 1 fails the build)
 */
import { spawnSync } from "node:child_process";

const env = process.env.VERCEL_ENV;

if (env !== "production") {
  console.log(`[migrate-on-deploy] VERCEL_ENV=${env ?? "(unset)"} - skipping prisma migrate deploy.`);
  process.exit(0);
}

console.log("[migrate-on-deploy] VERCEL_ENV=production - running prisma migrate deploy...");

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"],
  { stdio: "inherit" }
);

if (result.status !== 0) {
  console.error(`[migrate-on-deploy] prisma migrate deploy failed with exit code ${result.status}.`);
  process.exit(result.status ?? 1);
}

console.log("[migrate-on-deploy] prisma migrate deploy completed successfully.");
