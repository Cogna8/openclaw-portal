import { NextResponse } from "next/server";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { enablePolicy } from "@/lib/policies-service";
import { jsonError, normalizeProxyError } from "@/lib/http-proxy-error";

export async function POST(
  _req: Request,
  context: { params: Promise<{ templateId: string }> },
) {
  try {
    const ctx = await getCurrentAccountContext();
    const { templateId } = await context.params;
    const result = await enablePolicy({
      accountId: ctx.openclawAccountId,
      userId: ctx.portalUserId,
      templateId,
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
    console.error("POST /api/policies/[id]/enable failed", {
      status,
      message,
      cause: error,
    });
    return jsonError(message, status);
  }
}
