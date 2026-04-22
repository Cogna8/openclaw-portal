import { getPortalDb } from "@/lib/portal-db";
import { getServiceDb } from "@/lib/db/service";
import { listPolicies } from "@/lib/policies-service";

export type OnboardingStatus = { completed: boolean };

export async function resolveOnboardingStatus(args: {
  portalUserId: string;
  openclawAccountId: string;
}): Promise<OnboardingStatus> {
  const portalDb = getPortalDb();

  const user = await portalDb.portalUser.findUnique({
    where: { id: args.portalUserId },
    select: { onboardingCompletedAt: true },
  });

  if (user?.onboardingCompletedAt) {
    return { completed: true };
  }

  const serviceDb = getServiceDb();

  const [agentsCount, policies] = await Promise.all([
    serviceDb.agent.count({
      where: { accountId: args.openclawAccountId, status: "active" },
    }),
    listPolicies({
      accountId: args.openclawAccountId,
      userId: args.portalUserId,
    }),
  ]);

  const enabledPoliciesCount = policies.policies.filter((p) => p.enabled).length;
  const qualifies = agentsCount > 0 && enabledPoliciesCount > 0;

  if (qualifies) {
    await portalDb.portalUser.update({
      where: { id: args.portalUserId },
      data: { onboardingCompletedAt: new Date() },
    });
    return { completed: true };
  }

  return { completed: false };
}
