import { PrismaClient } from "@/generated/service-prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

let instance: PrismaClient | undefined;

function createClient(): PrismaClient {
  const url = process.env.CG8_OPENCLAW_DATABASE_URL;
  if (!url) throw new Error("CG8_OPENCLAW_DATABASE_URL is required");
  const cleanUrl = new URL(url);
  cleanUrl.searchParams.delete("channel_binding");
  const adapter = new PrismaNeon({ connectionString: cleanUrl.toString() });
  return new PrismaClient({ adapter });
}

export function getServiceDb(): PrismaClient {
  if (!instance) instance = createClient();
  return instance;
}
