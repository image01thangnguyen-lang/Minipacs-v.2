import { auth } from "@/auth";
import { requirePermission } from "@/lib/authz";
import { getDataQualityIssues } from "@/lib/dataQualityService";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { DataQualityClient } from "./DataQualityClient";
import { DataQualityAntd } from "./DataQualityAntd";

export default async function DataQualityPage() {
  await requirePermission("dataQuality.read");
  const issues = await getDataQualityIssues();

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
      const decision = await evaluateScopedCapability({ capability: "antd-quality", resourceId: (user as any).activeFacilityId || "global" }, deps);
      useAntd = decision.enabled;
    } catch (err) {
      console.error("Flag evaluation failed:", err);
    }
  }

  if (useAntd) {
    return <DataQualityAntd issues={issues} />;
  }
  return <DataQualityClient issues={issues} />;
}
