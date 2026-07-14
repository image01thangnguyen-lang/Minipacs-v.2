import { auth } from "@/auth";
import { requirePermission } from "@/lib/authz";
import { getPeerReviews } from "@/lib/qualityService";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { PeerReviewClient } from "./PeerReviewClient";
import { PeerReviewAntd } from "./PeerReviewAntd";

export default async function PeerReviewPage() {
  await requirePermission("quality.peerReview");
  const reviews = await getPeerReviews();

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
    return <PeerReviewAntd reviews={reviews} />;
  }
  return <PeerReviewClient reviews={reviews} />;
}
