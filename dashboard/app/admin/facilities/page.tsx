import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import FacilitiesClient from "./FacilitiesClient";

export default async function FacilitiesPage() {
  const session = await requirePermission("admin.facilities");

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session.user.id }),
      reauthorizeResource: async () => ({ facilityId: session.user.activeFacilityId || "global" }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-facilities",
      resourceId: session.user.activeFacilityId || "global"
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  return <FacilitiesClient useAntd={useAntd} />;
}
