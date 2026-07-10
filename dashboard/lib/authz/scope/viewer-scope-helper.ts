import { requireScopedStudyMutation, requireScopedStudyRead } from "./require-scoped-access";
import { ScopeRequestContext } from "./scope-request-context";
import { auth } from "@/auth";
import type { ScopeCapability } from "./capability-registry";

/**
 * Shared helper for viewer API routes to enforce study scope.
 */
export async function requireViewerStudyScope(
  studyInstanceUid: string,
  capability: ScopeCapability | "READ_STUDY_ONLY" = "READ_STUDY_ONLY"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (capability === "READ_STUDY_ONLY") {
    return requireScopedStudyRead({
      userId: session.user.id,
      studyInstanceUid,
    });
  }

  return requireScopedStudyMutation({
    userId: session.user.id,
    studyInstanceUid,
    capability,
  });
}
