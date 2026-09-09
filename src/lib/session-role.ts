import type { Session } from "next-auth";
import type { portal_role_t } from "@prisma/client";
import type { AppSessionFields } from "./auth";

/**
 * Reads the app-specific role off a next-auth session. Set in the
 * session callback in `auth.ts`; see `AppSessionFields` there for why
 * this is a local cast rather than a global type augmentation.
 */
export function getSessionRole(
  session: (Session & Partial<AppSessionFields>) | null | undefined,
): portal_role_t {
  return session?.role ?? "user";
}
