import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { handleSignIn } from "../services/user-provisioning";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      const result = await handleSignIn({
        email: profile.email,
        name: profile.name ?? null,
        image: (profile as any).picture ?? null,
        googleId: account.providerAccountId,
      });
      return result.allowed;
    },
    async jwt({ token, account, profile }) {
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
