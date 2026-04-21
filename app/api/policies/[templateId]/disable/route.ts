import { NextResponse } from "next/server";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { disablePolicy } from "@/lib/policies-service";

export async function POST(
  _req: Request,
  context: { params: Promise<{ templateId: string }> },
) {
  try {
    const ctx = await getCurrentAccountContext();
    const { templateId } = await context.params;
    const result = await disablePolicy({
      accountId: ctx.openclawAccountId,
      userId: ctx.portalUserId,
      templateId,
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
    console.error("POST /api/policies/[id]/disable failed", error);
    return NextResponse.json(
      { error: (error as any)?.body?.error ?? "Internal server error" },
      { status: typeof status === "number" ? status : 500 },
    );
  }
}
