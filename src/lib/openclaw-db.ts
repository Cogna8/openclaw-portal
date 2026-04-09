import { Pool } from "@neondatabase/serverless";

function getPool(): Pool {
  const url = process.env.CG8_OPENCLAW_DATABASE_URL;
  if (!url) throw new Error("CG8_OPENCLAW_DATABASE_URL is required");
  const cleanUrl = new URL(url);
  cleanUrl.searchParams.delete("channel_binding");
  return new Pool({ connectionString: cleanUrl.toString() });
}

export async function createOpenClawAccount(publicId: string): Promise<{ id: string; publicId: string }> {
  const pool = getPool();
  try {
    const result = await pool.query(
      `INSERT INTO accounts (id, public_id, plan, status, evaluations_limit_monthly, max_agents, max_rules_per_agent, post_cap_new_rules_limit, api_version, capability_flags, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'free', 'active', 10000, 3, 25, 3, 'v1', '{}', NOW(), NOW())
       RETURNING id, public_id`,
      [publicId]
    );
    return { id: result.rows[0].id, publicId: result.rows[0].public_id };
  } finally {
    await pool.end();
  }
}
