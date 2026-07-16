import { CommandCenterClient } from "./CommandCenterClient";
import { requirePermission } from "@/lib/authz";

export default async function CommandCenterPage() {
  await requirePermission("commandCenter.read");

  // Keep the operational dashboard stable: this is the original unified
  // command-center experience with its live 30-second refresh cycle.
  return <CommandCenterClient />;
}
