import type { ResourceContextInput, ResolvedResourceContext, AeResolutionResult } from "./scope-decision";
import type { AeTitleResolverDeps } from "./ae-title-resolver";
import { resolveAeTitle } from "./ae-title-resolver";
import type { OrganizationTree } from "./organization-tree";
import type { ScopeRequestContext } from "./scope-request-context";

/**
 * Dependencies for looking up machine → facility mapping.
 */
export type ResourceContextDeps = AeTitleResolverDeps & {
  findDicomNodeById: (id: string) => Promise<{ id: string; facilityId: string | null; aeTitle: string; isActive: boolean } | null>;
  findFacilityUnitExists: (id: string) => Promise<boolean>;
};

/**
 * Resolves the organizational context of a resource (study, order, or non-dicom exam).
 *
 * Priority order:
 * 1. performingUnitId — direct facility unit assignment
 * 2. facilityId (NonDicom) — direct facility assignment on exam
 * 3. machineId — look up DicomNode.facilityId
 * 4. stationAeTitle — AE resolver → DicomNode → facilityId
 *
 * For each resolved facilityUnitId, populates ancestorUnitIds from the
 * organization tree for grant inheritance checks.
 */
export async function resolveResourceContext(
  input: ResourceContextInput,
  tree: OrganizationTree,
  deps: ResourceContextDeps,
  ctx?: ScopeRequestContext
): Promise<ResolvedResourceContext> {
  let performingUnitId: string | null = input.performingUnitId || null;
  let facilityUnitId: string | null = null;
  let dicomNodeId: string | null = null;
  let aeResolution: AeResolutionResult = {
    status: "MISSING_IDENTIFIER",
    dicomNodeId: null,
    facilityUnitId: null,
    aeTitle: null,
  };

  // Step 1: If performingUnitId is directly set, verify it exists
  if (performingUnitId) {
    const exists = await deps.findFacilityUnitExists(performingUnitId);
    if (exists) {
      facilityUnitId = performingUnitId;
    } else {
      // performingUnitId points to non-existent unit — cannot trust
      performingUnitId = null;
    }
  }

  // Step 2: For Non-DICOM, try facilityId if performingUnitId didn't resolve
  if (!facilityUnitId && input.facilityId) {
    const exists = await deps.findFacilityUnitExists(input.facilityId);
    if (exists) {
      facilityUnitId = input.facilityId;
    }
  }

  // Step 3: Try machineId (always check if present to ensure it's not inactive)
  if (input.machineId) {
    const node = await deps.findDicomNodeById(input.machineId);
    if (node) {
      if (!node.isActive) {
        aeResolution = { status: "RESOURCE_INACTIVE", dicomNodeId: null, facilityUnitId: null, aeTitle: null };
      } else {
        dicomNodeId = node.id;
        if (!facilityUnitId && node.facilityId) {
          facilityUnitId = node.facilityId;
        }
      }
    }
  }

  // Step 4: Try stationAeTitle via AE resolver
  if (aeResolution.status !== "RESOURCE_INACTIVE") {
    if (!facilityUnitId && input.stationAeTitle) {
      aeResolution = await resolveAeTitle(input.stationAeTitle, deps, ctx);
      if (aeResolution.status === "MATCHED") {
        dicomNodeId = aeResolution.dicomNodeId;
        facilityUnitId = aeResolution.facilityUnitId;
      }
    } else if (input.stationAeTitle) {
      // Even if we already have a facilityUnitId, still resolve AE for the trace
      aeResolution = await resolveAeTitle(input.stationAeTitle, deps, ctx);
      if (aeResolution.status === "MATCHED" && !dicomNodeId) {
        dicomNodeId = aeResolution.dicomNodeId;
      }
    }
  }

  // Build ancestor chain from the resolved facility unit
  let ancestorUnitIds: string[] = [];
  if (facilityUnitId) {
    try {
      ancestorUnitIds = tree.getAncestorIds(facilityUnitId);
    } catch {
      // Cycle in tree — treat as unclassified
      ancestorUnitIds = [];
    }
  }

  const classified = facilityUnitId !== null && aeResolution.status !== "RESOURCE_INACTIVE";

  return {
    performingUnitId,
    ancestorUnitIds,
    dicomNodeId,
    facilityUnitId,
    aeResolution,
    classified,
  };
}
