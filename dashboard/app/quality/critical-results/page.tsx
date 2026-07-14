import { auth } from "@/auth";
import { requirePermission } from "@/lib/authz";
import { getCriticalResults } from "@/lib/qualityService";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { CriticalResultsClient } from "./CriticalResultsClient";
import { CriticalResultsAntd } from "./CriticalResultsAntd";

export default async function CriticalResultsPage() {
  await requirePermission("quality.criticalResult");
  const results = await getCriticalResults();

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
      const decision = await evaluateScopedCapability({ capability: "antd-quality", resourceId: (user as any).activeFacilityId || "global" }, deps);
      useAntd = decision.enabled;
    } catch (err) {
      console.error("Flag evaluation failed:", err);
    }
  }

  if (useAntd) {
    return <CriticalResultsAntd results={results} />;
  }
  return <CriticalResultsClient results={results} />;
}
