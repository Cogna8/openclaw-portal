import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};
  
  // Check env vars
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";
  checks.AUTH_SECRET = process.env.AUTH_SECRET ? "set" : "MISSING";
  checks.CG8_GOOGLE_CLIENT_ID = process.env.CG8_GOOGLE_CLIENT_ID ? "set" : "MISSING";
  checks.CG8_GOOGLE_CLIENT_SECRET = process.env.CG8_GOOGLE_CLIENT_SECRET ? "set" : "MISSING";
  checks.CG8_PORTAL_DATABASE_URL = process.env.CG8_PORTAL_DATABASE_URL ? "set" : "MISSING";
  checks.CG8_OPENCLAW_DATABASE_URL = process.env.CG8_OPENCLAW_DATABASE_URL ? "set" : "MISSING";
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "NOT SET";

  // Test portal DB connection
  try {
    const { getPortalDb } = await import("@/lib/portal-db");
    const db = getPortalDb();
    const count = await db.portalUser.count();
    checks.portal_db = `connected (${count} users)`;
  } catch (e: any) {
    checks.portal_db = `ERROR: ${e.message}`;
  }

  // Test openclaw DB connection
  try {
    const { Pool } = await import("@neondatabase/serverless");
    const url = process.env.CG8_OPENCLAW_DATABASE_URL;
    if (url) {
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete("channel_binding");
      const pool = new Pool({ connectionString: cleanUrl.toString() });
      const result = await pool.query("SELECT count(*) FROM accounts");
      checks.openclaw_db = `connected (${result.rows[0].count} accounts)`;
      await pool.end();
    } else {
      checks.openclaw_db = "URL not set";
    }
  } catch (e: any) {
    checks.openclaw_db = `ERROR: ${e.message}`;
  }

  return NextResponse.json(checks);
}
