import { NextResponse } from "next/server";

export async function GET() {
  try {
    const NextAuth = (await import("next-auth")).default;
    const Google = (await import("next-auth/providers/google")).default;

    const provider = Google({
      clientId: process.env.CG8_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.CG8_GOOGLE_CLIENT_SECRET!,
    });

    return NextResponse.json({
      status: "ok",
      secret_length: (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "").length,
      clientId_prefix: process.env.CG8_GOOGLE_CLIENT_ID?.substring(0, 30) + "...",
      clientSecret_length: process.env.CG8_GOOGLE_CLIENT_SECRET?.length || 0,
      provider_id: provider.id,
      provider_type: provider.type,
      nextauth_url: process.env.NEXTAUTH_URL,
      auth_url: process.env.AUTH_URL,
      node_env: process.env.NODE_ENV,
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      error: e.message,
      stack: e.stack?.split("\n").slice(0, 5),
    }, { status: 500 });
  }
}
