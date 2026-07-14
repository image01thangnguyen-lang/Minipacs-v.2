import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import { ReportTemplatesClient } from "./ReportTemplatesClient";
import { ReportTemplatesAntd } from "./ReportTemplatesAntd";

export default async function ReportTemplateTextPage() {
  const session = await requirePermission("templates.manage");

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session.user.id }),
      reauthorizeResource: async () => ({ facilityId: session.user.activeFacilityId }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-settings",
      resourceId: session.user.activeFacilityId
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  if (useAntd) {
    return <ReportTemplatesAntd />;
  }
  return <ReportTemplatesClient />;
}
