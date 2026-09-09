import { getPortalDb } from "../lib/portal-db";
import { createOpenClawAccount } from "../lib/openclaw-db";
import { enableDefaultPoliciesForNewAccount } from "../lib/policies-bootstrap";
import { generateAccountId } from "../lib/ids";
import { SUPER_ADMIN_EMAIL } from "../lib/constants";
import type { Prisma } from "@prisma/client";

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
    const updateData: Prisma.PortalUserUpdateInput = { lastLoginAt: new Date() };
    if (isSuperAdmin && existing.role !== "super_admin") updateData.role = "super_admin";
    await db.portalUser.update({ where: { id: existing.id }, data: updateData });
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
      role: role,
      openclawAccountId: account.id,
      lastLoginAt: new Date(),
    },
  });

  // Enable default policies for the new account. Best-effort — do NOT fail
  // sign-in if the service is temporarily unreachable. The user will see
  // the "Enable recommended policies" banner on first dashboard load if
  // this silently falls through.
  try {
    const result = await enableDefaultPoliciesForNewAccount({
      accountId: account.id,
      userId: user.id,
    });
    if (result.errors.length > 0) {
      console.warn(
        "[user-provisioning] default-policy enablement had errors:",
        result.errors.join("; "),
      );
    }
  } catch (err) {
    console.warn("[user-provisioning] default-policy enablement failed", err);
  }

  return { userId: user.id, role: user.role, openclawAccountId: user.openclawAccountId, allowed: true };
}
