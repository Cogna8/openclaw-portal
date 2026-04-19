import { NextResponse } from "next/server";
import { getServiceDb } from "@/lib/db/service";
import {
  requireAdminContext,
  AuthRequiredError,
  ForbiddenError,
} from "@/lib/auth/admin-context";
import { writeAuditEvent } from "@/services/admin-audit";

function parsePositiveInt(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) return null;
  return value;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdminContext();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const evals = parsePositiveInt(body?.evaluationsLimitMonthly);
    const maxAgents = parsePositiveInt(body?.maxAgents);
    const maxRules = parsePositiveInt(body?.maxRulesPerAgent);

    if (evals === null || maxAgents === null || maxRules === null) {
      return NextResponse.json(
        { error: "All limit values must be positive integers" },
        { status: 400 }
      );
    }

    const db = getServiceDb();
    const existing = await db.account.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        evaluationsLimitMonthly: true,
        maxAgents: true,
        maxRulesPerAgent: true,
      },
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.account.update({
      where: { id },
      data: {
        evaluationsLimitMonthly: evals,
        maxAgents,
        maxRulesPerAgent: maxRules,
      },
      select: {
        id: true,
        publicId: true,
        evaluationsLimitMonthly: true,
        maxAgents: true,
        maxRulesPerAgent: true,
      },
    });

    try {
      await writeAuditEvent({
        actor,
        action: "account_limits_change",
        targetType: "openclaw_account",
        targetId: updated.id,
        targetLabel: updated.publicId,
        before: {
          evaluationsLimitMonthly: existing.evaluationsLimitMonthly,
          maxAgents: existing.maxAgents,
          maxRulesPerAgent: existing.maxRulesPerAgent,
        },
        after: {
          evaluationsLimitMonthly: updated.evaluationsLimitMonthly,
          maxAgents: updated.maxAgents,
          maxRulesPerAgent: updated.maxRulesPerAgent,
        },
      });
    } catch (auditError) {
      console.error("audit write failed after account limits change", auditError);
    }

    return NextResponse.json({ ok: true, account: updated });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/accounts/[id]/limits failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
