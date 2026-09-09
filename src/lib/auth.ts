import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { handleSignIn } from "../services/user-provisioning";
import type { portal_role_t } from "@prisma/client";

/**
 * The fields the jwt/session callbacks below attach on top of next-auth's
 * default Session/JWT shape.
 *
 * These aren't wired up via `declare module "next-auth"` because in this
 * project's dependency tree (next-auth 5.0.0-beta.25), that augmentation
 * doesn't merge reliably through next-auth's `@auth/core` type re-exports
 * -- the same field ends up with two non-identical declared types
 * depending on which internal path TypeScript resolves it through, which
 * a global augmentation can't reconcile. A local, single-purpose cast at
 * the one place these fields are written and read is more honest than an
 * augmentation that looks type-safe but silently isn't.
 */
export interface AppSessionFields {
  userId?: string;
  role?: portal_role_t;
  openclawAccountId?: string | null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.CG8_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.CG8_GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email || !account?.providerAccountId) return false;
      try {
        const result = await handleSignIn({
          email: profile.email,
          name: profile.name ?? null,
          image: (profile as { picture?: string }).picture ?? null,
          googleId: account.providerAccountId,
        });
        return result.allowed;
      } catch (error) {
        console.error("[portal-auth] signIn error:", error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        try {
          const { getPortalDb } = await import("./portal-db");
          const db = getPortalDb();
          const user = await db.portalUser.findUnique({
            where: { googleId: account.providerAccountId! },
            select: { id: true, role: true, openclawAccountId: true },
          });
          if (user) {
            (token as unknown as AppSessionFields).userId = user.id;
            (token as unknown as AppSessionFields).role = user.role;
            (token as unknown as AppSessionFields).openclawAccountId =
              user.openclawAccountId;
          }
        } catch (error) {
          console.error("[portal-auth] jwt error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        const t = token as unknown as AppSessionFields;
        const s = session as unknown as AppSessionFields;
        s.userId = t.userId;
        s.role = t.role;
        s.openclawAccountId = t.openclawAccountId;
      }
      return session;
    },
  },
  pages: { signIn: "/" },
});
