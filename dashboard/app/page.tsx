import { auth } from "@/auth";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { requirePermission } from "@/lib/authz";
import { WorkspaceClient } from "./WorkspaceClient";
import { WorkspaceAntd } from "./WorkspaceAntd";

export default async function DashboardPage() {
  await requirePermission("studies.read");

  const session = await auth();
  const user = session?.user;

  let useAntd = false;
  if (user?.id) {
    try {
      // The root workspace is not scoped to one selected facility. The server
      // still authenticates the actor; "global" is a non-PHI rollout cohort,
      // not a client-supplied authorization scope.
      const rolloutResourceId = "global";
      const deps = {
        authenticate: async () => ({ userId: user.id }),
        reauthorizeResource: async (_actor: { userId: string }, resourceId: string) =>
          resourceId === rolloutResourceId ? { facilityId: rolloutResourceId } : null,
        loadConfig: loadPhase7FlagConfig,
        audit: () => {},
      };
      // Evaluate capability for AntD workspace mapping
      const decision = await evaluateScopedCapability(
        { capability: "antd-workspace", resourceId: rolloutResourceId },
        deps,
      );
      useAntd = decision.enabled;
    } catch (err) {
      console.error("Flag evaluation failed:", err);
    }
  }

  if (useAntd) {
    return <WorkspaceAntd />;
  }
  return <WorkspaceClient />;
}
