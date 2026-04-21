import { NextResponse } from "next/server";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { deleteTemplateVariantRule } from "@/lib/policies-service";
import { jsonError, normalizeProxyError } from "@/lib/http-proxy-error";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ rulePublicId: string }> },
) {
  try {
    const ctx = await getCurrentAccountContext();
    const { rulePublicId } = await context.params;
    const result = await deleteTemplateVariantRule({
      accountId: ctx.openclawAccountId,
      userId: ctx.portalUserId,
      rulePublicId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return jsonError("Unauthorized", 401);
    }
    if (error instanceof AccountLinkError) {
      return jsonError("Forbidden", 403);
    }
    const { status, message } = normalizeProxyError(error);
    console.error("DELETE /api/policies/rules/[id] failed", {
      status,
      message,
      cause: error,
    });
    return jsonError(message, status);
  }
}
