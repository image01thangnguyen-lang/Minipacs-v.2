import { auth } from "../auth";
import { redirect } from "next/navigation";
import { hasPermission, type PermissionKey } from "./permissions";

export async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = session.user as any;
  if (!hasPermission(user.role, permission, user.permissions)) redirect("/");
  return user;
}
