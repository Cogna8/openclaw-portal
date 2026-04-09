import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env from repo root
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const url = process.env.CG8_PORTAL_DATABASE_URL;
if (!url) {
  throw new Error("CG8_PORTAL_DATABASE_URL is not set. Create a .env file in the repo root.");
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),
  datasource: { url },
});
