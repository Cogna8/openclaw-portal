import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { handleSignIn } from "../services/user-provisioning";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  logger: {
    error(code, ...message) {
      console.error("[NEXTAUTH_ERROR]", code, JSON.stringify(message, null, 2));
    },
    warn(code) {
      console.warn("[NEXTAUTH_WARN]", code);
    },
  },
  providers: [
    Google({
      clientId: process.env.CG8_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.CG8_GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      try {
        if (!profile?.email || !account?.providerAccountId) return false;
        const result = await handleSignIn({
          email: profile.email,
          name: profile.name ?? null,
          image: (profile as any).picture ?? null,
          googleId: account.providerAccountId,
        });
        return result.allowed;
      } catch (error) {
        console.error("[portal-auth] signIn callback error:", error);
        throw error;
      }
    },
    async jwt({ token, account, profile }) {
      try {
        if (account && profile?.email) {
          const { getPortalDb } = await import("./portal-db");
          const db = getPortalDb();
          const user = await db.portalUser.findUnique({
            where: { googleId: account.providerAccountId! },
            select: { id: true, role: true, openclawAccountId: true },
          });
          if (user) {
            token.userId = user.id;
            token.role = user.role;
            token.openclawAccountId = user.openclawAccountId;
          }
        }
      } catch (error) {
        console.error("[portal-auth] jwt callback error:", error);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).userId = token.userId;
        (session as any).role = token.role;
        (session as any).openclawAccountId = token.openclawAccountId;
      }
      return session;
    },
  },
  pages: { signIn: "/" },
});
