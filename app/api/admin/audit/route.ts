import { NextResponse } from "next/server";
import { getPortalDb } from "@/lib/portal-db";
import {
  requireAdminContext,
  AuthRequiredError,
  ForbiddenError,
} from "@/lib/auth/admin-context";

export async function GET(request: Request) {
  try {
    await requireAdminContext();

    const url = new URL(request.url);
    const actor = url.searchParams.get("actor")?.trim() || "";
    const action = url.searchParams.get("action")?.trim() || "";
    const targetType = url.searchParams.get("targetType")?.trim() || "";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const limitRaw = Number(url.searchParams.get("limit") || "100");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;

    const db = getPortalDb();
    const rows = await db.adminAuditLog.findMany({
      where: {
        ...(actor ? { actorEmail: actor } : {}),
        ...(action ? { action: action as any } : {}),
        ...(targetType ? { targetType: targetType as any } : {}),
        ...((from || to)
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ rows });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/audit failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
