import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import { TemplatesClient } from "./TemplatesClient";
import { TemplatesAntd } from "./TemplatesAntd";

export default async function AdminTemplatesPage() {
  const session = await requirePermission("admin.catalogs");

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session.user.id }),
      reauthorizeResource: async () => ({ facilityId: session.user.activeFacilityId || "global" }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-templates",
      resourceId: session.user.activeFacilityId || "global"
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  if (useAntd) {
    return <TemplatesAntd />;
  }
  return <TemplatesClient />;
}
