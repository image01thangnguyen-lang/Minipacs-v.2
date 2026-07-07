import { SlaPolicy } from "@prisma/client";

export type SlaStage = 
  | "ORDER_TO_CHECKIN"
  | "CHECKIN_TO_SCAN"
  | "SCAN_TO_RECEIVED"
  | "RECEIVED_TO_FIRST_READ"
  | "FIRST_READ_TO_FINAL"
  | "FINAL_TO_DELIVERED"
  | "END_TO_END";

export interface SlaContext {
  procedureCatalogId?: string | null;
  machineId?: string | null;
  modality?: string | null;
  facilityId?: string | null;
  priority?: string | null;
  doctorId?: string | null;
  role?: string | null;
  module?: string | null;
}

export interface SlaBreachResult {
  policyCode: string;
  thresholdMinutes: number;
  source: 'POLICY' | 'FALLBACK';
}

const SCOPE_PRECEDENCE = [
  "PROCEDURE",
  "MACHINE",
  "MODALITY",
  "FACILITY",
  "PRIORITY",
  "DOCTOR",
  "ROLE",
  "MODULE",
  "GLOBAL"
];

const DEFAULT_FALLBACKS: Record<SlaStage, number> = {
  ORDER_TO_CHECKIN: 1440, // 24 hours
  CHECKIN_TO_SCAN: 60, // 1 hour
  SCAN_TO_RECEIVED: 30, // 30 minutes
  RECEIVED_TO_FIRST_READ: 1440, // 24 hours
  FIRST_READ_TO_FINAL: 1440, // 24 hours
  FINAL_TO_DELIVERED: 1440, // 24 hours
  END_TO_END: 4320, // 3 days
};

export function resolveSlaPolicy(
  policies: SlaPolicy[],
  stage: SlaStage,
  context: SlaContext,
  now: Date = new Date()
): SlaBreachResult {
  // Filter active and within effective dates
  const activePolicies = policies.filter((p) => {
    if (!p.isActive) return false;
    if (p.stage !== stage) return false;
    if (p.effectiveFrom && p.effectiveFrom > now) return false;
    if (p.effectiveTo && p.effectiveTo < now) return false;

    // Match scope
    switch (p.scope) {
      case "PROCEDURE":
        return context.procedureCatalogId && p.procedureCatalogId === context.procedureCatalogId;
      case "MACHINE":
        return context.machineId && p.machineId === context.machineId;
      case "MODALITY":
        return context.modality && p.modality === context.modality;
      case "FACILITY":
        return context.facilityId && p.facilityId === context.facilityId;
      case "PRIORITY":
        return context.priority && p.priority === context.priority;
      case "DOCTOR":
        return context.doctorId && p.doctorId === context.doctorId;
      case "ROLE":
        return context.role && p.role === context.role;
      case "MODULE":
        return context.module && p.module === context.module;
      case "GLOBAL":
        return true;
      default:
        return false;
    }
  });

  if (activePolicies.length === 0) {
    return {
      policyCode: 'FALLBACK',
      thresholdMinutes: DEFAULT_FALLBACKS[stage],
      source: 'FALLBACK'
    };
  }

  // Sort by precedence -> effectiveFrom DESC NULLS LAST -> updatedAt DESC -> id ASC
  activePolicies.sort((a, b) => {
    const aPrecedence = SCOPE_PRECEDENCE.indexOf(a.scope);
    const bPrecedence = SCOPE_PRECEDENCE.indexOf(b.scope);
    
    // Lower index is higher precedence
    const aPrecValue = aPrecedence === -1 ? 999 : aPrecedence;
    const bPrecValue = bPrecedence === -1 ? 999 : bPrecedence;

    if (aPrecValue !== bPrecValue) {
      return aPrecValue - bPrecValue;
    }

    // effectiveFrom DESC NULLS LAST
    if (a.effectiveFrom && b.effectiveFrom) {
      const diff = b.effectiveFrom.getTime() - a.effectiveFrom.getTime();
      if (diff !== 0) return diff;
    } else if (a.effectiveFrom && !b.effectiveFrom) {
      return -1; // a comes first
    } else if (!a.effectiveFrom && b.effectiveFrom) {
      return 1; // b comes first
    }

    // updatedAt DESC
    const updateDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
    if (updateDiff !== 0) return updateDiff;

    // id ASC
    return a.id.localeCompare(b.id);
  });

  const bestPolicy = activePolicies[0];

  return {
    policyCode: bestPolicy.code,
    thresholdMinutes: bestPolicy.thresholdMinutes,
    source: 'POLICY'
  };
}

export interface SlaDurationResult {
  durationMinutes: number | 'NOT_MEASURABLE';
  status: 'ONGOING' | 'PASSED' | 'MISSING_END';
}

const STAGE_COMPLETED_STATUSES: Record<SlaStage, string[]> = {
  ORDER_TO_CHECKIN: ["READY_FOR_SCAN", "IN_PROGRESS", "STABLE", "NEEDS_QC", "RECEIVED", "READY_TO_READ", "READING", "REPORTED", "FINALIZED", "DELIVERED", "ARCHIVED", "DELETED_FROM_PACS"],
  CHECKIN_TO_SCAN: ["IN_PROGRESS", "STABLE", "NEEDS_QC", "RECEIVED", "READY_TO_READ", "READING", "REPORTED", "FINALIZED", "DELIVERED", "ARCHIVED", "DELETED_FROM_PACS"],
  SCAN_TO_RECEIVED: ["STABLE", "RECEIVED", "READY_TO_READ", "READING", "REPORTED", "FINALIZED", "DELIVERED", "ARCHIVED", "DELETED_FROM_PACS"],
  RECEIVED_TO_FIRST_READ: ["READING", "REPORTED", "FINALIZED", "DELIVERED", "ARCHIVED", "DELETED_FROM_PACS"],
  FIRST_READ_TO_FINAL: ["FINALIZED", "DELIVERED", "ARCHIVED", "DELETED_FROM_PACS"],
  FINAL_TO_DELIVERED: ["DELIVERED", "ARCHIVED", "DELETED_FROM_PACS"],
  END_TO_END: ["DELIVERED", "ARCHIVED", "DELETED_FROM_PACS"],
};

export function isSlaStageCompleted(stage: SlaStage, currentStudyStatus: string | null | undefined) {
  return Boolean(currentStudyStatus && STAGE_COMPLETED_STATUSES[stage]?.includes(currentStudyStatus));
}

export function calculateSlaDuration(
  stage: SlaStage,
  start: Date | null | undefined,
  end: Date | null | undefined,
  currentStudyStatus: string | null,
  now: Date = new Date()
): SlaDurationResult {
  if (!start) {
    return { durationMinutes: 'NOT_MEASURABLE', status: 'MISSING_END' };
  }

  if (end) {
    const diffMs = end.getTime() - start.getTime();
    return { durationMinutes: Math.max(0, diffMs / 60000), status: 'PASSED' };
  }

  // End is missing, check if it has passed the stage
  const hasPassed = isSlaStageCompleted(stage, currentStudyStatus);

  if (hasPassed) {
    return { durationMinutes: 'NOT_MEASURABLE', status: 'MISSING_END' };
  }

  // Still ongoing in this stage
  const diffMs = now.getTime() - start.getTime();
  return { durationMinutes: Math.max(0, diffMs / 60000), status: 'ONGOING' };
}

export function evaluateSlaThreshold(
  durationMinutes: number | 'NOT_MEASURABLE',
  thresholdMinutes: number
): 'OK' | 'BREACH' | 'NOT_MEASURABLE' {
  if (durationMinutes === 'NOT_MEASURABLE') {
    return 'NOT_MEASURABLE';
  }
  return durationMinutes > thresholdMinutes ? 'BREACH' : 'OK';
}
