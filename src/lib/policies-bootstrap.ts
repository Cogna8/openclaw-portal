/**
 * Called during first-sign-in provisioning, after the service account is
 * created. Enables every template flagged default_enabled. Best-effort:
 * errors are logged but do NOT fail sign-in — the user will see the
 * "Enable recommended policies" banner on first dashboard load if this
 * path silently fails.
 */

import { listPolicies, enablePolicy } from "./policies-service";

export async function enableDefaultPoliciesForNewAccount(params: {
  accountId: string;
  userId: string;
}): Promise<{ enabledTemplates: string[]; errors: string[] }> {
  const enabledTemplates: string[] = [];
  const errors: string[] = [];

  try {
    const list = await listPolicies({
      accountId: params.accountId,
      userId: params.userId,
    });
    const defaults = list.policies.filter((p) => p.default_enabled);

    for (const template of defaults) {
      try {
        await enablePolicy({
          accountId: params.accountId,
          userId: params.userId,
          templateId: template.id,
        });
        enabledTemplates.push(template.id);
      } catch (err) {
        errors.push(
          `${template.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  } catch (err) {
    errors.push(
      `listPolicies: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return { enabledTemplates, errors };
}
