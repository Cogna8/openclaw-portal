import { NextResponse } from "next/server";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function normalizeProxyError(
  error: unknown,
  fallback = "Internal server error",
): { status: number; message: string } {
  const status = (error as any)?.status;
  const bodyError = (error as any)?.body?.error;

  return {
    status: typeof status === "number" ? status : 500,
    message:
      typeof bodyError === "string" && bodyError.length > 0
        ? bodyError
        : fallback,
  };
}
