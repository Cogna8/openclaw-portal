import { NextResponse } from "next/server";
import { getPortalDb } from "@/lib/portal-db";
import {
  requireSuperAdminContext,
  AuthRequiredError,
  ForbiddenError,
  isProtectedSuperAdminEmail,
} from "@/lib/auth/admin-context";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSuperAdminContext();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const newRole = body?.role;

    if (newRole !== "user" && newRole !== "admin") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const db = getPortalDb();
    const existing = await db.portalUser.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.id === actor.actorUserId) {
      return NextResponse.json({ error: "Cannot modify own role" }, { status: 403 });
    }
    if (existing.role === "super_admin" || isProtectedSuperAdminEmail(existing.email)) {
      return NextResponse.json({ error: "Cannot modify super admin" }, { status: 403 });
    }
    if (existing.role === newRole) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    const action = newRole === "admin" ? "user_role_promote" : "user_role_demote";

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.portalUser.update({
        where: { id },
        data: { role: newRole as any },
        select: { id: true, email: true, role: true },
      });

      await tx.adminAuditLog.create({
        data: {
          actorPortalUserId: actor.actorUserId,
          actorEmail: actor.actorEmail,
          action: action as any,
          targetType: "portal_user",
          targetId: updated.id,
          targetLabel: updated.email,
          before: { role: existing.role } as any,
          after: { role: updated.role } as any,
        },
      });

      return updated;
    });

    return NextResponse.json({ ok: true, user: result });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/users/[id]/role failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
