import { auth } from "@/lib/auth";
import { getPortalDb } from "@/lib/portal-db";
import { getServiceDb } from "@/lib/db/service";

export class AuthRequiredError extends Error {}
export class AccountLinkError extends Error {}

export type CurrentAccountContext = {
  sessionUserEmail: string;
  portalUserId: string;
  portalUserEmail: string;
  openclawAccountId: string;
};

export async function getCurrentAccountContext(): Promise<CurrentAccountContext> {
  const session = await auth();

  if (!session?.user?.email) {
    throw new AuthRequiredError("Authentication required");
  }

  const portalDb = getPortalDb();
  const portalUser = await portalDb.portalUser.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      isBlocked: true,
      openclawAccountId: true,
    },
  });

  if (!portalUser || portalUser.isBlocked) {
    throw new AuthRequiredError("Authentication required");
  }

  const serviceDb = getServiceDb();

  if (portalUser.openclawAccountId) {
    const linked = await serviceDb.account.findUnique({
      where: { id: portalUser.openclawAccountId },
      select: { id: true },
    });

    if (linked) {
      return {
        sessionUserEmail: session.user.email,
        portalUserId: portalUser.id,
        portalUserEmail: portalUser.email,
        openclawAccountId: linked.id,
      };
    }
  }

  const fallback = await serviceDb.account.findFirst({
    where: { ownerUserId: portalUser.id },
    select: { id: true },
  });

  if (!fallback) {
    throw new AccountLinkError("No linked OpenClaw account found");
  }

  return {
    sessionUserEmail: session.user.email,
    portalUserId: portalUser.id,
    portalUserEmail: portalUser.email,
    openclawAccountId: fallback.id,
  };
}
