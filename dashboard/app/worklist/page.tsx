import { auth } from "@/auth";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { WorklistClient } from "./WorklistClient";
import { WorklistAntd } from "./WorklistAntd";
import { requirePermission } from "@/lib/authz";

export default async function WorklistPage(props: { searchParams?: { orderId?: string } }) {
  await requirePermission("worklist.manage");

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
      const decision = await evaluateScopedCapability({ capability: "antd-worklist", resourceId: (user as any).activeFacilityId || "global" }, deps);
      useAntd = decision.enabled;
    } catch (err) {
      console.error("Flag evaluation failed:", err);
    }
  }

  if (useAntd) {
    return <WorklistAntd searchParams={props.searchParams} />;
  }
  return <WorklistClient searchParams={props.searchParams} />;
}
