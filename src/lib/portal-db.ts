import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

let instance: ReturnType<typeof createClient> | undefined;

function createClient() {
  const url = process.env.CG8_PORTAL_DATABASE_URL;
  if (!url) throw new Error("CG8_PORTAL_DATABASE_URL is required");
  const cleanUrl = new URL(url);
  cleanUrl.searchParams.delete("channel_binding");
  const pool = new Pool({ connectionString: cleanUrl.toString() });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export function getPortalDb() {
  if (!instance) instance = createClient();
  return instance;
}
