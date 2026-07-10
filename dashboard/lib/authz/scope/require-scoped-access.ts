/**
 * Per-resource mutation authorization helpers.
 *
 * These are the single entry points for mutation scope checks.
 * Each function:
 *   1. Loads the resource from DB (never trusts client-provided context)
 *   2. Resolves READ_STUDY scope decision
 *   3. Resolves the action capability scope decision
 *   4. Throws ScopedAccessError on deny (generic message, no PHI)
 *   5. Returns the loaded resource for reuse by the caller
 *
 * Usage:
 *   const { study, ctx } = await requireScopedStudyMutation({
 *     userId: actor.id,
 *     studyInstanceUid,
 *     capability: "SIGN_REPORT",
 *   });
 *   // study is loaded and authorized; proceed with mutation
 */

import { prisma } from "@/app/db";
import { resolveScope } from "./scope-resolver";
import type { ScopeCapability } from "./capability-registry";
import { ScopeRequestContext } from "./scope-request-context";
import { getScopeDeps } from "./deps";
import { ScopedAccessError } from "./scoped-access-error";
import { getAuthorizationMode } from "./authorization-mode";

// ─── Types ──────────────────────────────────────────────────────────────────────

import type { ImagingStudy, WorklistOrder } from "@prisma/client";

type StudyWithContext = ImagingStudy & {
  order: {
    performingUnitId: string | null;
    scheduledStationAeTitle: string | null;
  } | null;
};

type OrderWithContext = WorklistOrder & {
  imagingStudies: StudyWithContext[];
};

export type ScopedStudyResult = {
  study: StudyWithContext;
  ctx: ScopeRequestContext;
};

export type ScopedOrderResult = {
  order: OrderWithContext;
  study: StudyWithContext | null;
  ctx: ScopeRequestContext;
};

// ─── Study include clause (reused) ───────────────────────────────────────────────

const STUDY_CONTEXT_INCLUDE = {
  order: {
    select: {
      performingUnitId: true,
      scheduledStationAeTitle: true,
    },
  },
} as const;

// ─── Shadow mode logging ────────────────────────────────────────────────────────

function logShadowMismatch(
  userId: string,
  capability: string,
  studyUid: string,
  reasonCode: string
): void {
  // Rate-limited, scrubbed log — no PHI, no grant IDs
  console.warn(
    `[SCOPE_SHADOW_MISMATCH] user=${userId.substring(0, 8)}… cap=${capability} study=${studyUid.substring(0, 12)}… reason=${reasonCode}`
  );
}

// ─── Core: requireScopedStudyMutation ───────────────────────────────────────────

export async function requireScopedStudyMutation(opts: {
  userId: string;
  studyInstanceUid: string;
  capability: ScopeCapability;
  ctx?: ScopeRequestContext;
}): Promise<ScopedStudyResult> {
  const { userId, studyInstanceUid, capability } = opts;
  const ctx = opts.ctx || ScopeRequestContext.create();
  const deps = getScopeDeps();
  const mode = getAuthorizationMode();

  // Step 1: Load resource from DB
  const study = await prisma.imagingStudy.findUnique({
    where: { studyInstanceUid },
    include: STUDY_CONTEXT_INCLUDE,
  }) as StudyWithContext | null;

  if (!study) {
    throw new ScopedAccessError({
      code: "RESOURCE_NOT_FOUND",
      capability,
      reasonCode: "RESOURCE_NOT_FOUND",
    });
  }

  const resourceInput = {
    resourceType: "STUDY" as const,
    performingUnitId: study.order?.performingUnitId || null,
    stationAeTitle: study.stationAeTitle || study.order?.scheduledStationAeTitle || null,
  };

  // Step 2: READ_STUDY prerequisite
  const readDecision = await resolveScope(userId, "READ_STUDY", resourceInput, deps, ctx);

  // Global permissions are baseline authorization and are mandatory in every
  // mode. OFF/SHADOW only disable enforcement of the proposed resource scope.
  if (!readDecision.baselineAllowed) {
    throw new ScopedAccessError({
      code: "PREREQUISITE_DENIED",
      capability: "READ_STUDY",
      reasonCode: readDecision.reasonCode,
    });
  }

  if (mode === "ENFORCE" && !readDecision.effectiveAllowed) {
    throw new ScopedAccessError({
      code: "PREREQUISITE_DENIED",
      capability: "READ_STUDY",
      reasonCode: readDecision.reasonCode,
    });
  }

  if (mode === "SHADOW" && !readDecision.proposedAllowed) {
    logShadowMismatch(userId, "READ_STUDY", studyInstanceUid, readDecision.reasonCode);
  }

  // Step 3: Action capability (skip if same as READ_STUDY)
  if (capability !== "READ_STUDY") {
    const capDecision = await resolveScope(userId, capability, resourceInput, deps, ctx);

    if (!capDecision.baselineAllowed) {
      throw new ScopedAccessError({
        code: "SCOPE_DENIED",
        capability,
        reasonCode: capDecision.reasonCode,
      });
    }

    if (mode === "ENFORCE" && !capDecision.effectiveAllowed) {
      throw new ScopedAccessError({
        code: "SCOPE_DENIED",
        capability,
        reasonCode: capDecision.reasonCode,
      });
    }

    if (mode === "SHADOW" && !capDecision.proposedAllowed) {
      logShadowMismatch(userId, capability, studyInstanceUid, capDecision.reasonCode);
    }
  }

  return { study, ctx };
}

// ─── Core: requireScopedOrderMutation ───────────────────────────────────────────

export async function requireScopedOrderMutation(opts: {
  userId: string;
  orderId: string;
  capability: ScopeCapability;
  ctx?: ScopeRequestContext;
}): Promise<ScopedOrderResult> {
  const { userId, orderId, capability } = opts;
  const ctx = opts.ctx || ScopeRequestContext.create();
  const deps = getScopeDeps();
  const mode = getAuthorizationMode();

  // Step 1: Load order and linked study from DB
  const order = await prisma.worklistOrder.findUnique({
    where: { id: orderId },
    include: {
      imagingStudies: {
        include: STUDY_CONTEXT_INCLUDE,
      },
    },
  }) as OrderWithContext | null;

  if (!order) {
    throw new ScopedAccessError({
      code: "RESOURCE_NOT_FOUND",
      capability,
      reasonCode: "RESOURCE_NOT_FOUND",
    });
  }

  const primaryStudy = order.imagingStudies[0] || null;
  // Build resource input from order context (or its study if linked)
  const resourceInput = {
    resourceType: "ORDER" as const,
    performingUnitId: order.performingUnitId || null,
    stationAeTitle:
      primaryStudy?.stationAeTitle ||
      order.scheduledStationAeTitle ||
      null,
  };

  // Step 2: READ_STUDY prerequisite
  const readDecision = await resolveScope(userId, "READ_STUDY", resourceInput, deps, ctx);

  if (!readDecision.baselineAllowed) {
    throw new ScopedAccessError({
      code: "PREREQUISITE_DENIED",
      capability: "READ_STUDY",
      reasonCode: readDecision.reasonCode,
    });
  }

  if (mode === "ENFORCE" && !readDecision.effectiveAllowed) {
    throw new ScopedAccessError({
      code: "PREREQUISITE_DENIED",
      capability: "READ_STUDY",
      reasonCode: readDecision.reasonCode,
    });
  }

  if (mode === "SHADOW" && !readDecision.proposedAllowed) {
    logShadowMismatch(
      userId,
      "READ_STUDY",
      primaryStudy?.studyInstanceUid || orderId,
      readDecision.reasonCode
    );
  }

  // Step 3: Action capability
  if (capability !== "READ_STUDY") {
    const capDecision = await resolveScope(userId, capability, resourceInput, deps, ctx);

    if (!capDecision.baselineAllowed) {
      throw new ScopedAccessError({
        code: "SCOPE_DENIED",
        capability,
        reasonCode: capDecision.reasonCode,
      });
    }

    if (mode === "ENFORCE" && !capDecision.effectiveAllowed) {
      throw new ScopedAccessError({
        code: "SCOPE_DENIED",
        capability,
        reasonCode: capDecision.reasonCode,
      });
    }

    if (mode === "SHADOW" && !capDecision.proposedAllowed) {
      logShadowMismatch(
        userId,
        capability,
        primaryStudy?.studyInstanceUid || orderId,
        capDecision.reasonCode
      );
    }
  }

  return { order, study: primaryStudy, ctx };
}

// ─── Convenience: requireScopedStudyRead ────────────────────────────────────────

/**
 * Shorthand for mutations that only need READ_STUDY scope + global permission.
 * Used for share, export, viewer artifacts, and statistics mutations that
 * don't have a dedicated scope capability.
 */
export async function requireScopedStudyRead(opts: {
  userId: string;
  studyInstanceUid: string;
  ctx?: ScopeRequestContext;
}): Promise<ScopedStudyResult> {
  return requireScopedStudyMutation({
    ...opts,
    capability: "READ_STUDY",
  });
}
