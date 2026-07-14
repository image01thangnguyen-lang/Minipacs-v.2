import { auth } from "@/auth";
import { requirePermission } from "@/lib/authz";
import { getSlaPolicies } from "@/lib/controlThresholdService";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { SlaPoliciesClient } from "./SlaPoliciesClient";
import { SlaPoliciesAntd } from "./SlaPoliciesAntd";

export default async function SlaPoliciesPage() {
  await requirePermission("thresholds.read");
  const policies = await getSlaPolicies();

  const session = await auth();
  const user = session?.user;

  let useAntd = false;
  if (user?.id) {
    try {
      const deps = {
        authenticate: async () => ({ userId: user.id }),
        reauthorizeResource: async () => ({ facilityId: (user as any).activeFacilityId || "" }),
        loadConfig: loadPhase7FlagConfig,
        audit: () => {},
      };
      const decision = await evaluateScopedCapability({ capability: "antd-admin-sla", resourceId: (user as any).activeFacilityId || "global" }, deps);
      useAntd = decision.enabled;
    } catch (err) {
      console.error("Flag evaluation failed:", err);
    }
  }

  if (useAntd) {
    return <SlaPoliciesAntd policies={policies} />;
  }
  return <SlaPoliciesClient policies={policies} />;
}
