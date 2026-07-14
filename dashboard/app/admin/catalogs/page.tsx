import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import CatalogsClient from "./CatalogsClient";

const ADMIN_CATALOGS_RESOURCE_ID = "global-admin-catalogs";

export default async function CatalogsPage() {
  // First, authenticate & authorize
  const user = await requirePermission("admin.catalogs");

  // Evaluate feature flag for Phase 3 Admin Pilot
  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: user.id }),
      // Catalogs are global rather than facility-scoped. Permission was rechecked above;
      // use a stable, non-client-controlled rollout resource for this admin route.
      reauthorizeResource: async (_actor: { userId: string }, resourceId: string) =>
        resourceId === ADMIN_CATALOGS_RESOURCE_ID
          ? { facilityId: ADMIN_CATALOGS_RESOURCE_ID }
          : null,
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-pilot",
      resourceId: ADMIN_CATALOGS_RESOURCE_ID,
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  return <CatalogsClient useAntd={useAntd} />;
}
