import { NextResponse } from "next/server";
import { getPortalDb } from "@/lib/portal-db";
import { getServiceDb } from "@/lib/db/service";
import {
  requireAdminContext,
  AuthRequiredError,
  ForbiddenError,
} from "@/lib/auth/admin-context";

export async function GET(request: Request) {
  try {
    await requireAdminContext();

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const roleFilter = url.searchParams.get("role") || "";
    const statusFilter = url.searchParams.get("status") || "";

    const portalDb = getPortalDb();
    const users = await portalDb.portalUser.findMany({
      where: {
        ...(search && {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(roleFilter === "user" || roleFilter === "admin" || roleFilter === "super_admin"
          ? { role: roleFilter as any }
          : {}),
        ...(statusFilter === "blocked" ? { isBlocked: true } : {}),
        ...(statusFilter === "active" ? { isBlocked: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        lastLoginAt: true,
        openclawAccountId: true,
      },
      take: 200,
    });

    const accountIds = users
      .map((u) => u.openclawAccountId)
      .filter((x): x is string => Boolean(x));

    const serviceDb = getServiceDb();
    const accounts =
      accountIds.length > 0
        ? await serviceDb.account.findMany({
            where: { id: { in: accountIds } },
            select: {
              id: true,
              publicId: true,
              plan: true,
              status: true,
              evaluationsLimitMonthly: true,
              maxAgents: true,
              maxRulesPerAgent: true,
            },
          })
        : [];

    const accountById = new Map(accounts.map((a) => [a.id, a]));

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        account: u.openclawAccountId ? accountById.get(u.openclawAccountId) ?? null : null,
      })),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/users failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
