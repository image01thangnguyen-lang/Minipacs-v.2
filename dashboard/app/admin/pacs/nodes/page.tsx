import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import { NodesClient } from "./NodesClient";
import { NodesAntd } from "./NodesAntd";

export default async function DicomNodesPage() {
  const session = await requirePermission("pacs.manage");

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session.user.id }),
      reauthorizeResource: async () => ({ facilityId: session.user.activeFacilityId }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-pacs-nodes",
      resourceId: session.user.activeFacilityId
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  if (useAntd) {
    return <NodesAntd />;
  }
  return <NodesClient />;
}
