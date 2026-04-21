import { NextResponse } from "next/server";
import { getServiceDb } from "@/lib/db/service";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(req: Request) {
  try {
    const ctx = await getCurrentAccountContext();
    const serviceDb = getServiceDb();

    const statusParam = new URL(req.url).searchParams.get("status");
    const where =
      statusParam === "all"
        ? { accountId: ctx.openclawAccountId }
        : { accountId: ctx.openclawAccountId, status: "active" as const };

    const agents = await serviceDb.agent.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      select: {
        publicId: true,
        externalId: true,
        name: true,
        source: true,
        status: true,
        pluginVersion: true,
        agentVersion: true,
        toolsRegisteredCount: true,
        activeRulesCount: true,
        firstSeenAt: true,
        lastSeenAt: true,
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorized();
    if (error instanceof AccountLinkError) return forbidden();
    console.error("GET /api/agents failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
