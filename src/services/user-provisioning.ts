import { getPortalDb } from "../lib/portal-db";
import { createOpenClawAccount } from "../lib/openclaw-db";
import { generateAccountId } from "../lib/ids";

const SUPER_ADMIN_EMAIL = "admin@cogna8.io";

export async function handleSignIn(profile: {
  email: string;
  name?: string | null;
  image?: string | null;
  googleId: string;
}): Promise<{ userId: string; role: string; openclawAccountId: string | null; allowed: boolean }> {
  const db = getPortalDb();
  const existing = await db.portalUser.findUnique({ where: { googleId: profile.googleId } });

  if (existing) {
    const isSuperAdmin = existing.email === SUPER_ADMIN_EMAIL;
    if (existing.isBlocked && !isSuperAdmin) {
      return { userId: existing.id, role: existing.role, openclawAccountId: existing.openclawAccountId, allowed: false };
    }
    const updateData: Record<string, unknown> = { lastLoginAt: new Date() };
    if (isSuperAdmin && existing.role !== "super_admin") updateData.role = "super_admin";
    await db.portalUser.update({ where: { id: existing.id }, data: updateData as any });
    return { userId: existing.id, role: isSuperAdmin ? "super_admin" : existing.role, openclawAccountId: existing.openclawAccountId, allowed: true };
  }

  // New user: provision service account first, then portal user
  const role = profile.email === SUPER_ADMIN_EMAIL ? "super_admin" : "user";
  const accountPublicId = generateAccountId();
  const account = await createOpenClawAccount(accountPublicId);
  const user = await db.portalUser.create({
    data: {
      email: profile.email,
      name: profile.name,
      image: profile.image,
      googleId: profile.googleId,
      role: role as any,
      openclawAccountId: account.id,
      lastLoginAt: new Date(),
    },
  });
  return { userId: user.id, role: user.role, openclawAccountId: user.openclawAccountId, allowed: true };
}
