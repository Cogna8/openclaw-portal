import { NextResponse } from "next/server";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function normalizeProxyError(
  error: unknown,
  fallback = "Internal server error",
): { status: number; message: string } {
  const err = error as { status?: unknown; body?: { error?: unknown } };
  const status = err?.status;
  const bodyError = err?.body?.error;

  return {
    status: typeof status === "number" ? status : 500,
    message:
      typeof bodyError === "string" && bodyError.length > 0
        ? bodyError
        : fallback,
  };
}
