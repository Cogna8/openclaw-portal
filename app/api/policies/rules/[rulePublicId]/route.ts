import { NextResponse } from "next/server";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { deleteTemplateVariantRule } from "@/lib/policies-service";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof AccountLinkError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const status = (error as any)?.status;
    console.error("DELETE /api/policies/rules/[id] failed", error);
    return NextResponse.json(
      { error: (error as any)?.body?.error ?? "Internal server error" },
      { status: typeof status === "number" ? status : 500 },
    );
  }
}
