import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Cookie-presence check only. Do not decode the JWT here.
  // NextAuth v5 beta session cookies cannot be reliably decoded in edge
  // runtime via getToken(); role gating runs in the admin layout instead.
  const hasSession =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
