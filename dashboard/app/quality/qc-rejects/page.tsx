import { auth } from "@/auth";
import { requirePermission } from "@/lib/authz";
import { getQcIssues } from "@/lib/qualityService";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { QcRejectsClient } from "./QcRejectsClient";
import { QcRejectsAntd } from "./QcRejectsAntd";

export default async function QcRejectsPage() {
  await requirePermission("quality.qc");
  const issues = await getQcIssues();

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
    return <QcRejectsAntd issues={issues} />;
  }
  return <QcRejectsClient issues={issues} />;
}
