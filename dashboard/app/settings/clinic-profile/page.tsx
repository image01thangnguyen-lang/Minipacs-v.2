import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import { ClinicProfileClient } from "./ClinicProfileClient";
import { ClinicProfileAntd } from "./ClinicProfileAntd";

export default async function ClinicProfilePage() {
  const session = await requirePermission("clinic.manage");

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session.user.id }),
      reauthorizeResource: async () => ({ facilityId: session.user.activeFacilityId || "global" }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-settings",
      resourceId: session.user.activeFacilityId || "global"
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  if (useAntd) {
    return <ClinicProfileAntd />;
  }
  return <ClinicProfileClient />;
}
