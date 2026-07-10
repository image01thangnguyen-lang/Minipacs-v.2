import type { AeResolutionResult, AeResolutionStatus } from "./scope-decision";
import type { ScopeRequestContext } from "./scope-request-context";

/**
 * Resolves an AE Title to a DicomNode and its facility, classifying the
 * result so callers can make safe authorization decisions.
 *
 * Resolution status meanings:
 * - MATCHED: exactly one active node → safe to use
 * - MISSING_IDENTIFIER: aeTitle was null/empty → cannot resolve
 * - NO_MATCH: no active node with this aeTitle
 * - AMBIGUOUS: multiple active nodes share the aeTitle → MUST NOT fail-open
 * - RESOURCE_INACTIVE: node found but inactive
 */

type DicomNodeRow = {
  id: string;
  aeTitle: string;
  isActive: boolean;
  facilityId: string | null;
};

export type AeTitleResolverDeps = {
  findDicomNodesByAeTitle: (aeTitle: string) => Promise<DicomNodeRow[]>;
};

function makeResult(
  status: AeResolutionStatus,
  aeTitle: string | null,
  nodeId: string | null = null,
  facilityId: string | null = null
): AeResolutionResult {
  return { status, dicomNodeId: nodeId, facilityUnitId: facilityId, aeTitle };
}

export async function resolveAeTitle(
  aeTitle: string | null | undefined,
  deps: AeTitleResolverDeps,
  ctx?: ScopeRequestContext
): Promise<AeResolutionResult> {
  if (!aeTitle || aeTitle.trim() === "") {
    return makeResult("MISSING_IDENTIFIER", null);
  }

  const normalizedAeTitle = aeTitle.trim();

  // Check cache first
  if (ctx) {
    const cached = ctx.getAeResolution(normalizedAeTitle);
    if (cached) return cached;
  }

  const nodes = await deps.findDicomNodesByAeTitle(normalizedAeTitle);

  let result: AeResolutionResult;

  if (nodes.length === 0) {
    result = makeResult("NO_MATCH", normalizedAeTitle);
  } else {
    // Separate active from inactive
    const activeNodes = nodes.filter(n => n.isActive);
    const inactiveNodes = nodes.filter(n => !n.isActive);

    if (activeNodes.length === 1) {
      result = makeResult("MATCHED", normalizedAeTitle, activeNodes[0].id, activeNodes[0].facilityId);
    } else if (activeNodes.length > 1) {
      // Multiple active nodes share the same AE Title — ambiguous.
      // Cannot safely pick one. Caller must not fail-open.
      result = makeResult("AMBIGUOUS", normalizedAeTitle);
    } else if (inactiveNodes.length > 0) {
      // Only inactive nodes found
      result = makeResult("RESOURCE_INACTIVE", normalizedAeTitle, inactiveNodes[0].id, inactiveNodes[0].facilityId);
    } else {
      result = makeResult("NO_MATCH", normalizedAeTitle);
    }
  }

  // Cache for this request
  if (ctx) {
    ctx.setAeResolution(normalizedAeTitle, result);
  }

  return result;
}
