import { auth } from "@/lib/auth";
import { getPortalDb } from "@/lib/portal-db";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

export class AuthRequiredError extends Error {}
export class ForbiddenError extends Error {}

export type AdminContext = {
  actorUserId: string;
  actorEmail: string;
  actorRole: "admin" | "super_admin";
  isSuperAdmin: boolean;
};

export async function requireAdminContext(): Promise<AdminContext> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new AuthRequiredError("Authentication required");

  const db = getPortalDb();
  const user = await db.portalUser.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, isBlocked: true },
  });

  if (!user || user.isBlocked) throw new AuthRequiredError("Authentication required");
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new ForbiddenError("Admin role required");
  }

  return {
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    isSuperAdmin: user.role === "super_admin",
  };
}

export async function requireSuperAdminContext(): Promise<AdminContext> {
  const ctx = await requireAdminContext();
  if (!ctx.isSuperAdmin) throw new ForbiddenError("Super admin role required");
  return ctx;
}

export function isProtectedSuperAdminEmail(email: string): boolean {
  return email === SUPER_ADMIN_EMAIL;
}
