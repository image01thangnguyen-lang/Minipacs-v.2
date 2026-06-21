import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission, type PermissionKey } from "./permissions";

export async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, permission, session.user.permissions)) redirect("/");
  return session.user;
}
