import { NextResponse } from "next/server";
import { getPortalDb } from "@/lib/portal-db";
import { getServiceDb } from "@/lib/db/service";
import {
  requireAdminContext,
  AuthRequiredError,
  ForbiddenError,
} from "@/lib/auth/admin-context";

export async function GET() {
  try {
    await requireAdminContext();

    const portalDb = getPortalDb();
    const serviceDb = getServiceDb();

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [totalUsers, blockedUsers, signedInLast7Days, activeLast30Days, accounts] =
      await Promise.all([
        portalDb.portalUser.count(),
        portalDb.portalUser.count({ where: { isBlocked: true } }),
        portalDb.portalUser.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
        portalDb.portalUser.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
        serviceDb.account.findMany({
          select: {
            id: true,
            publicId: true,
            plan: true,
            status: true,
            evaluationsLimitMonthly: true,
            usagePeriods: {
              orderBy: { periodStart: "desc" },
              take: 1,
              select: {
                periodStart: true,
                evaluationsUsed: true,
                mode: true,
              },
            },
          },
        }),
      ]);

    const byPlan = { free: 0, paid: 0, enterprise: 0 };
    const byStatus = { active: 0, suspended: 0, closed: 0 };
    const byMode = { normal: 0, degraded: 0 };

    let currentPeriodTotal = 0;

    const topAccounts = accounts
      .map((a) => {
        byPlan[a.plan as keyof typeof byPlan] += 1;
        byStatus[a.status as keyof typeof byStatus] += 1;

        const latest = a.usagePeriods[0] ?? null;
        if (latest) {
          currentPeriodTotal += latest.evaluationsUsed;
          byMode[latest.mode as keyof typeof byMode] += 1;
        }

        return {
          publicId: a.publicId,
          evaluationsUsed: latest?.evaluationsUsed ?? 0,
          mode: latest?.mode ?? "normal",
        };
      })
      .sort((a, b) => b.evaluationsUsed - a.evaluationsUsed)
      .slice(0, 10);

    const usageRows = await serviceDb.usagePeriod.findMany({
      select: { evaluationsUsed: true },
    });

    const lifetimeTotal = usageRows.reduce(
      (sum, row) => sum + row.evaluationsUsed,
      0
    );

    return NextResponse.json({
      users: {
        total: totalUsers,
        activeLast30Days,
        signedInLast7Days,
        blocked: blockedUsers,
      },
      evaluations: {
        currentPeriodTotal,
        lifetimeTotal,
        byMode,
      },
      accounts: {
        total: accounts.length,
        byPlan,
        byStatus,
      },
      topAccounts,
      degradedAccounts: topAccounts.filter((a) => a.mode === "degraded"),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/stats failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
