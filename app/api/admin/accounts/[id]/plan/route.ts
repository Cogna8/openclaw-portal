import { NextResponse } from "next/server";
import { getServiceDb } from "@/lib/db/service";
import {
  requireAdminContext,
  AuthRequiredError,
  ForbiddenError,
} from "@/lib/auth/admin-context";
import { writeAuditEvent } from "@/services/admin-audit";

const ALLOWED_PLANS = ["free", "paid", "enterprise"] as const;
type Plan = (typeof ALLOWED_PLANS)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdminContext();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const newPlan = body?.plan as Plan;

    if (!ALLOWED_PLANS.includes(newPlan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const db = getServiceDb();
    const existing = await db.account.findUnique({
      where: { id },
      select: { id: true, publicId: true, plan: true },
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.plan === newPlan) return NextResponse.json({ ok: true, unchanged: true });

    const updated = await db.account.update({
      where: { id },
      data: { plan: newPlan },
      select: { id: true, publicId: true, plan: true },
    });

    try {
      await writeAuditEvent({
        actor,
        action: "account_plan_change",
        targetType: "openclaw_account",
        targetId: updated.id,
        targetLabel: updated.publicId,
        before: { plan: existing.plan },
        after: { plan: updated.plan },
      });
    } catch (auditError) {
      console.error("audit write failed after account plan change", auditError);
    }

    return NextResponse.json({ ok: true, account: updated });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/accounts/[id]/plan failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
