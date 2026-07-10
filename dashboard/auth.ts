import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/db"; // or adjust path if necessary
import { getPermissionsForRole } from "@/lib/permissions";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Crendentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        
        // Find user
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: { roleProfile: true },
        });

        if (!user) {
          throw new Error("Tài khoản không tồn tại");
        }

        if (!user.isActive) {
          throw new Error("Tài khoản đã bị khóa");
        }

        const isMatch = await bcrypt.compare(credentials.password as string, user.password);
        if (!isMatch) {
          throw new Error("Mật khẩu không chính xác");
        }

        const activeRoleProfile = user.roleProfile?.isActive ? user.roleProfile : null;
        const role = activeRoleProfile?.code || user.role;
        const permissions = getPermissionsForRole(user.role, activeRoleProfile?.permissions);

        return {
          id: user.id,
          name: user.fullName,
          username: user.username,
          role,
          baseRole: activeRoleProfile?.baseRole || user.role,
          roleName: activeRoleProfile?.name,
          permissions,
        };
      }
    })
  ],
});
