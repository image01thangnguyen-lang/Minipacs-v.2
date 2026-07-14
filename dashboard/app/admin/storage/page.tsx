import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import { StorageClient } from "./StorageClient";
import { StorageAntd } from "./StorageAntd";

export default async function StorageAdminPage() {
  const session = await requirePermission("admin.storage");

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session.user.id }),
      reauthorizeResource: async () => ({ facilityId: session.user.activeFacilityId }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-storage",
      resourceId: session.user.activeFacilityId
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  if (useAntd) {
    return <StorageAntd />;
  }
  return <StorageClient />;
}
