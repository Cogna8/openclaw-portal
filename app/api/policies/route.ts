import { NextResponse } from "next/server";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { listPolicies } from "@/lib/policies-service";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof AccountLinkError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const status = (error as any)?.status;
    console.error("GET /api/policies failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: typeof status === "number" ? status : 500 },
    );
  }
}
