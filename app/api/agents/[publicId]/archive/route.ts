import { NextResponse } from "next/server";
import { getServiceDb } from "@/lib/db/service";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const ctx = await getCurrentAccountContext();
    const { publicId } = await params;
    const db = getServiceDb();

    const agent = await db.agent.findFirst({
      where: { publicId, accountId: ctx.openclawAccountId },
      select: { id: true, status: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.status === "archived") {
      return NextResponse.json({ ok: true, already: true });
    }

    await db.agent.update({
      where: { id: agent.id },
      data: { status: "archived" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof AccountLinkError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/agents/:publicId/archive failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
