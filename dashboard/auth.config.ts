import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * Keep database clients, password hashing and credential authorization out of
 * this file because Next.js bundles it into middleware's Edge runtime.
 */
export const authConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as typeof user & {
          id: string;
          role: string;
          baseRole?: string;
          roleName?: string;
          permissions?: string[];
          username?: string;
        };

        token.id = authenticatedUser.id;
        token.role = authenticatedUser.role;
        token.baseRole = authenticatedUser.baseRole;
        token.roleName = authenticatedUser.roleName;
        token.permissions = authenticatedUser.permissions;
        token.username = authenticatedUser.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id: string;
          role: string;
          baseRole?: string;
          roleName?: string;
          permissions?: string[];
        };

        sessionUser.id = token.id as string;
        sessionUser.role = token.role as string;
        sessionUser.baseRole = token.baseRole as string | undefined;
        sessionUser.roleName = token.roleName as string | undefined;
        sessionUser.permissions = Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
