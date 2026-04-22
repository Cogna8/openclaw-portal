import { NextResponse } from "next/server";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { resolveOnboardingStatus } from "@/lib/services/onboarding";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET() {
  try {
    const ctx = await getCurrentAccountContext();
    const status = await resolveOnboardingStatus({
      portalUserId: ctx.portalUserId,
      openclawAccountId: ctx.openclawAccountId,
    });
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorized();
    if (error instanceof AccountLinkError) return forbidden();
    console.error("GET /api/onboarding failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
