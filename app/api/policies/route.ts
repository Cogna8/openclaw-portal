import { NextResponse } from "next/server";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { listPolicies } from "@/lib/policies-service";
import { jsonError, normalizeProxyError } from "@/lib/http-proxy-error";

export async function GET() {
  try {
    const ctx = await getCurrentAccountContext();
    const result = await listPolicies({
      accountId: ctx.openclawAccountId,
      userId: ctx.portalUserId,
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
    console.error("GET /api/policies failed", { status, message, cause: error });
    return jsonError(message, status);
  }
}
