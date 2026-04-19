import { NextResponse } from "next/server";
import { getPortalDb } from "@/lib/portal-db";
import {
  requireAdminContext,
  AuthRequiredError,
  ForbiddenError,
  isProtectedSuperAdminEmail,
  type AdminContext,
} from "@/lib/auth/admin-context";

async function setBlocked(id: string, block: boolean, actor: AdminContext) {
  const db = getPortalDb();

  const existing = await db.portalUser.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, isBlocked: true },
  });

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.id === actor.actorUserId) {
    return NextResponse.json({ error: "Cannot block own account" }, { status: 403 });
  }
  if (isProtectedSuperAdminEmail(existing.email) || existing.role === "super_admin") {
    return NextResponse.json({ error: "Cannot block super admin" }, { status: 403 });
  }
  if (existing.role === "admin" && !actor.isSuperAdmin) {
    return NextResponse.json(
      { error: "Super admin required to block another admin" },
      { status: 403 }
    );
  }
  if (existing.isBlocked === block) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const action = block ? "user_block" : "user_unblock";

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.portalUser.update({
      where: { id },
      data: { isBlocked: block },
      select: { id: true, email: true, isBlocked: true },
    });

    await tx.adminAuditLog.create({
      data: {
        actorPortalUserId: actor.actorUserId,
        actorEmail: actor.actorEmail,
        action: action as any,
        targetType: "portal_user",
        targetId: updated.id,
        targetLabel: updated.email,
        before: { isBlocked: existing.isBlocked } as any,
        after: { isBlocked: updated.isBlocked } as any,
      },
    });

    return updated;
  });

  return NextResponse.json({ ok: true, user: result });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdminContext();
    const { id } = await params;
    return await setBlocked(id, true, actor);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/users/[id]/block failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdminContext();
    const { id } = await params;
    return await setBlocked(id, false, actor);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("DELETE /api/admin/users/[id]/block failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
