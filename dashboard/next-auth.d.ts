import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      baseRole?: string;
      roleName?: string;
      permissions?: string[];
      username?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    baseRole?: string;
    roleName?: string;
    permissions?: string[];
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    baseRole?: string;
    roleName?: string;
    permissions?: string[];
    username?: string;
  }
}
