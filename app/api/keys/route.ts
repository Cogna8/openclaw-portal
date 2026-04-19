import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { getServiceDb } from "@/lib/db/service";
import {
  getCurrentAccountContext,
  AuthRequiredError,
  AccountLinkError,
} from "@/lib/auth/session-account";
import { generateApiKeyMaterial } from "@/lib/keys/generate";

const NANO_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const nanoKeyId = customAlphabet(NANO_ALPHABET, 16);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET() {
  try {
    const ctx = await getCurrentAccountContext();
    const serviceDb = getServiceDb();

    const keys = await serviceDb.apiKey.findMany({
      where: { accountId: ctx.openclawAccountId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        publicId: true,
        label: true,
        lastFour: true,
        status: true,
        createdAt: true,
        issuedAt: true,
        revokedAt: true,
        lastUsedAt: true,
      },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorized();
    if (error instanceof AccountLinkError) return forbidden();
    console.error("GET /api/keys failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentAccountContext();
    const body = await request.json().catch(() => ({}));
    const label = typeof body?.label === "string" ? body.label.trim() : "";

    if (!label || label.length < 1 || label.length > 50) {
      return NextResponse.json(
        { error: "Label must be 1-50 characters" },
        { status: 400 }
      );
    }

    const generated = generateApiKeyMaterial();
    const serviceDb = getServiceDb();

    const created = await serviceDb.apiKey.create({
      data: {
        publicId: `key_${nanoKeyId()}`,
        accountId: ctx.openclawAccountId,
        label,
        lookupHash: generated.lookupHash,
        secretHash: generated.secretHash,
        secretPrefix: generated.secretPrefix,
        lastFour: generated.lastFour,
        status: "active",
        createdByUserId: ctx.portalUserId,
      },
      select: {
        id: true,
        publicId: true,
        label: true,
        lastFour: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      key: created,
      rawKey: generated.rawKey,
      warning: "This key will not be shown again. Copy it now.",
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorized();
    if (error instanceof AccountLinkError) return forbidden();
    console.error("POST /api/keys failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
