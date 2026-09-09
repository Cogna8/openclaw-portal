import { getPortalDb } from "@/lib/portal-db";
import type { Prisma } from "@prisma/client";
import type { AdminContext } from "@/lib/auth/admin-context";

type AuditAction =
  | "user_block"
  | "user_unblock"
  | "user_role_promote"
  | "user_role_demote"
  | "account_plan_change"
  | "account_limits_change"
  | "account_status_change";

type AuditTargetType = "portal_user" | "openclaw_account";

export type AuditWriteInput = {
  actor: AdminContext;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  targetLabel?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(input: AuditWriteInput): Promise<void> {
  const db = getPortalDb();
  await db.adminAuditLog.create({
    data: {
      actorPortalUserId: input.actor.actorUserId,
      actorEmail: input.actor.actorEmail,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      before: input.before as Prisma.InputJsonValue | undefined,
      after: input.after as Prisma.InputJsonValue | undefined,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
