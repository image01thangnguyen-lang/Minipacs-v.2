import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  // First, authenticate & authorize
  const session = await requirePermission("users.manage");

  // Evaluate feature flag for Phase 4 Wave 4A Users Migration
  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session.user.id }),
      reauthorizeResource: async () => ({ facilityId: session.user.activeFacilityId }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    // Pass mock request payload to match schema
    const decision = await evaluateScopedCapability({
      capability: "antd-admin-users",
      resourceId: session.user.activeFacilityId
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  return <UsersClient useAntd={useAntd} />;
}
