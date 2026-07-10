import { resolveScope } from "./scope-resolver";
import { resolveResourceContext } from "./resource-context";
import { getScopeDeps } from "./deps";
import { ScopeCapability } from "./capability-registry";
import { prisma } from "../../../app/db";
import { ScopeRequestContext } from "./scope-request-context";

export type ExplainResult = {
  success: boolean;
  error?: string;
  allowed?: boolean;
  mode?: string;
  reasonCode?: string;
  globalAllowed?: boolean;
  resourceClassified?: boolean;
  traces?: {
    grantId: string;
    source: string;
    effect: string;
    facilityUnitId: string | null;
    dicomNodeId: string | null;
    matchType: string;
  }[];
  treePath?: string[];
};

export async function explainScopeDecision(
  actorUserId: string,
  targetUserId: string,
  capability: ScopeCapability,
  performingUnitId: string | null,
  stationAeTitle: string | null,
  machineId: string | null
): Promise<ExplainResult> {
  // Validate actor is admin
  const actor = await prisma.user.findUnique({ where: { id: actorUserId } });
  if (!actor || actor.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const deps = getScopeDeps();
  const ctx = ScopeRequestContext.create();

  // Resolve scope decision
  const decision = await resolveScope(targetUserId, capability, { performingUnitId, stationAeTitle, machineId, resourceType: "STUDY" }, deps, ctx);

  // Audit this explain operation
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "EXPLAIN_SCOPE_DECISION",
      entityType: "User",
      entityId: targetUserId,
      message: `Đã dùng explain mode để kiểm tra quyền ${capability} cho user ${targetUserId} tại ${performingUnitId || stationAeTitle || machineId}`,
    }
  });

  return {
    success: true,
    allowed: decision.effectiveAllowed,
    mode: decision.mode,
    reasonCode: decision.reasonCode,
    globalAllowed: decision.baselineAllowed,
    resourceClassified: decision.resourceContext.classified,
    traces: decision.scopeTrace.map(t => ({
      grantId: t.grantId,
      source: t.source,
      effect: t.effect,
      facilityUnitId: t.facilityUnitId,
      dicomNodeId: t.dicomNodeId,
      matchType: t.matchType,
    })),
    treePath: decision.resourceContext.ancestorUnitIds,
  };
}