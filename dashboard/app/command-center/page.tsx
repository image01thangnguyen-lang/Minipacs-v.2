import { auth } from "@/auth";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { CommandCenterClient } from "./CommandCenterClient";
import { CommandCenterAntd } from "./CommandCenterAntd";
import { requirePermission } from "@/lib/authz";

export default async function CommandCenterPage() {
  await requirePermission("commandCenter.read");

  const session = await auth();
  const user = session?.user;

  let useAntd = false;
  if (user?.id) {
    try {
      const deps = {
        authenticate: async () => ({ userId: user.id }),
        reauthorizeResource: async () => ({ facilityId: (user as any).activeFacilityId || "global" }),
        loadConfig: loadPhase7FlagConfig,
        audit: () => {},
      };
      const decision = await evaluateScopedCapability({ capability: "antd-command-center", resourceId: (user as any).activeFacilityId || "global" }, deps);
      useAntd = decision.enabled;
    } catch (err) {
      console.error("Flag evaluation failed:", err);
    }
  }

  if (useAntd) {
    return <CommandCenterAntd />;
  }
  return <CommandCenterClient />;
}
