import { auth } from "@/auth";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { ConsultationsClient } from "./ConsultationsClient";
import { ConsultationsAntd } from "./ConsultationsAntd";
import { requirePermission } from "@/lib/authz";

export default async function ConsultationsPage() {
  await requirePermission("consult.read");

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
      const decision = await evaluateScopedCapability({ capability: "antd-consultations", resourceId: (user as any).activeFacilityId || "global" }, deps);
      useAntd = decision.enabled;
    } catch (err) {
      console.error("Flag evaluation failed:", err);
    }
  }

  if (useAntd) {
    return <ConsultationsAntd />;
  }
  return <ConsultationsClient />;
}
