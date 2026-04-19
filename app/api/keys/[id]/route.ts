import { NextResponse } from "next/server";
import { getServiceDb } from "@/lib/db/service";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentAccountContext();
    const { id } = await params;
    const serviceDb = getServiceDb();

    const existing = await serviceDb.apiKey.findFirst({
      where: {
        publicId: id,
        accountId: ctx.openclawAccountId,
      },
      select: {
        id: true,
        publicId: true,
        label: true,
        status: true,
      },
    });

    if (!existing) {
      return forbidden();
    }

    if (existing.status === "revoked") {
      return NextResponse.json({ ok: true });
    }

    await serviceDb.apiKey.update({
      where: { id: existing.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByUserId: ctx.portalUserId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorized();
    if (error instanceof AccountLinkError) return forbidden();
    console.error("DELETE /api/keys/[id] failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
