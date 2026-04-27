/**
 * HTTP client for the openclaw-service "portal" API surface.
 * Every call carries the shared CG8_PORTAL_SERVICE_TOKEN plus the
 * authenticated user's account/user IDs as headers.
 *
 * The service enforces the shared secret with constant-time comparison;
 * the account/user headers are trusted only after that secret validates.
 * The portal is the source of truth for which account_id a session maps to.
 */

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function getServiceBaseUrl(): string {
  return requiredEnv("CG8_OPENCLAW_SERVICE_URL");
}

function getToken(): string {
  return requiredEnv("CG8_PORTAL_SERVICE_TOKEN");
}

function buildHeaders(params: { accountId: string; userId: string | null }): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-cg8-portal-token": getToken(),
    "x-cg8-account-id": params.accountId,
  };
  if (params.userId) headers["x-cg8-user-id"] = params.userId;
  return headers;
}

async function parseJsonOrThrow(res: Response, where: string): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // leave data null; fall through
  }
  if (!res.ok) {
    const err = new Error(
      `[policies-service] ${where} failed: ${res.status} ${res.statusText}${data?.error ? ` - ${data.error}` : ""}`,
    );
    (err as any).status = res.status;
    (err as any).body = data;
    throw err;
  }
  return data;
}

export type PolicyVariantRule = {
  public_id: string;
  agent_public_id: string;
  agent_name: string;
  tool_match: string;
  status: "active" | "disabled" | "removed";
};

export type PolicyVariantDetailed = {
  pattern: string;
  description: string;
};

export type PolicyRiskClass = "critical" | "high" | "medium";
export type PolicyCategory =
  | "filesystem"
  | "network"
  | "code_execution"
  | "destructive_ops";

export type PolicyListItem = {
  id: string;
  name: string;
  description: string;
  default_enabled: boolean;
  risk_class: PolicyRiskClass;
  category: PolicyCategory;
  enabled: boolean;
  enabled_at: string | null;
  variants: string[];
  variants_detailed?: PolicyVariantDetailed[];
  rules: PolicyVariantRule[];
};

export type ApplySecureDefaultsResult = {
  enabled_template_ids: string[];
  already_enabled_template_ids: string[];
  rules_created: number;
  agents_touched: number;
};

export async function listPolicies(ctx: {
  accountId: string;
  userId: string | null;
}): Promise<{ policies: PolicyListItem[] }> {
  const res = await fetch(`${getServiceBaseUrl()}/api/v1/portal/policies`, {
    method: "GET",
    headers: buildHeaders(ctx),
    cache: "no-store",
  });
  return parseJsonOrThrow(res, "listPolicies");
}

export async function enablePolicy(ctx: {
  accountId: string;
  userId: string | null;
  templateId: string;
}): Promise<{ template_id: string; enabled: true; agents_touched: number; rules_created: number }> {
  const res = await fetch(
    `${getServiceBaseUrl()}/api/v1/portal/policies/${encodeURIComponent(ctx.templateId)}/enable`,
    {
      method: "POST",
      headers: buildHeaders(ctx),
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(res, "enablePolicy");
}

export async function disablePolicy(ctx: {
  accountId: string;
  userId: string | null;
  templateId: string;
}): Promise<{ template_id: string; enabled: false; rules_removed: number }> {
  const res = await fetch(
    `${getServiceBaseUrl()}/api/v1/portal/policies/${encodeURIComponent(ctx.templateId)}/disable`,
    {
      method: "POST",
      headers: buildHeaders(ctx),
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(res, "disablePolicy");
}

export async function deleteTemplateVariantRule(ctx: {
  accountId: string;
  userId: string | null;
  rulePublicId: string;
}): Promise<{ rule_id: string; removed: true }> {
  const res = await fetch(
    `${getServiceBaseUrl()}/api/v1/portal/rules/${encodeURIComponent(ctx.rulePublicId)}`,
    {
      method: "DELETE",
      headers: buildHeaders(ctx),
      cache: "no-store",
    },
  );
  return parseJsonOrThrow(res, "deleteTemplateVariantRule");
}

export async function applySecureDefaults(ctx: {
  accountId: string;
  userId: string | null;
}): Promise<ApplySecureDefaultsResult> {
  const res = await fetch(
    `${getServiceBaseUrl()}/api/v1/portal/policies/secure-defaults`,
    {
      method: "POST",
      headers: buildHeaders(ctx),
      cache: "no-store",
    },
  );

  return parseJsonOrThrow(res, "applySecureDefaults");
}
