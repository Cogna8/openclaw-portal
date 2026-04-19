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

export async function GET() {
  try {
    const ctx = await getCurrentAccountContext();
    const serviceDb = getServiceDb();

    const account = await serviceDb.account.findUnique({
      where: { id: ctx.openclawAccountId },
      select: {
        id: true,
        evaluationsLimitMonthly: true,
      },
    });

    if (!account) {
      return forbidden();
    }

    const current = await serviceDb.usagePeriod.findFirst({
      where: { accountId: ctx.openclawAccountId },
      orderBy: { periodStart: "desc" },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        evaluationsUsed: true,
        mode: true,
      },
    });

    return NextResponse.json({
      usage: {
        limit: account.evaluationsLimitMonthly,
        used: current?.evaluationsUsed ?? 0,
        mode: current?.mode ?? "normal",
        periodStart: current?.periodStart ?? null,
        periodEnd: current?.periodEnd ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorized();
    if (error instanceof AccountLinkError) return forbidden();
    console.error("GET /api/usage failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
