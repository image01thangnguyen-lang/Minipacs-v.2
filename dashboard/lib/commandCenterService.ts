import { prisma } from "@/app/db";
import { getDeniedAeTitlesForAction } from "@/lib/authz/machine-permissions";
import { resolveSlaPolicy, calculateSlaDuration, evaluateSlaThreshold, isSlaStageCompleted, SlaStage } from "./services/slaResolver";
import {
  getStudyStuckSince,
  getWorklistStuckSince,
  mergeQueueBucketPage,
  QueueReference,
} from "./services/commandCenterUtils";
import { Prisma } from "@prisma/client";
import { ScopeRequestContext } from "@/lib/authz/scope/scope-request-context";
import { buildScopeFilter, applyScopeFilterToPrisma } from "@/lib/authz/scope/scope-filter-builder";
import { getScopeDeps } from "@/lib/authz/scope/deps";

export interface CommandCenterFilters {
  dateFrom?: string | Date;
  dateTo?: string | Date;
  facilityId?: string;
  modality?: string;
  machineId?: string;
  doctorId?: string;
  priority?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface AuthenticatedUser {
  id: string;
  role: string;
  permissions?: string[];
  [key: string]: any;
}

const CANONICAL_STUDY_STATUSES = [
  "ORDERED", "READY_FOR_SCAN", "IN_PROGRESS", "STABLE", "NEEDS_QC", 
  "RECEIVED", "READY_TO_READ", "READING", "REPORTED", "FINALIZED", "DELIVERED"
];

const WORKLIST_STATUSES = ["REQUESTED", "SCHEDULED", "ARRIVED"];

async function buildBaseWhere(user: AuthenticatedUser, filters: CommandCenterFilters, ctx?: ScopeRequestContext) {
  const effectiveCtx = ctx || ScopeRequestContext.create();
  const filterResult = await buildScopeFilter(user.id, "READ_STUDY", "STUDY", getScopeDeps(), effectiveCtx);
  const scopeWhere = applyScopeFilterToPrisma(filterResult, "performingUnitId", "stationAeTitle");

  const where: Prisma.ImagingStudyWhereInput = {
    status: { in: CANONICAL_STUDY_STATUSES as any[] },
    ...scopeWhere
  };

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  if (filters.modality) where.modality = filters.modality;
  if (filters.priority) where.priority = filters.priority;
  if (filters.doctorId) where.assignedDoctorId = filters.doctorId;

  if (filters.machineId || filters.facilityId) {
    const nodeWhere: any = { isActive: true };
    if (filters.machineId) nodeWhere.id = filters.machineId;
    if (filters.facilityId) nodeWhere.facilityId = filters.facilityId;
    
    const nodes = await prisma.dicomNode.findMany({
      where: nodeWhere,
      select: { aeTitle: true }
    });
    
    const aeTitles = nodes.map(n => n.aeTitle).filter(Boolean) as string[];
    
    if (aeTitles.length > 0) {
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { stationAeTitle: { in: aeTitles } }
        ];
        delete where.OR;
      } else {
        where.stationAeTitle = { in: aeTitles };
      }
    } else {
      where.id = "force-empty-result"; 
    }
  }

  return where;
}

async function buildWorklistWhere(user: AuthenticatedUser, filters: CommandCenterFilters, ctx?: ScopeRequestContext) {
  const effectiveCtx = ctx || ScopeRequestContext.create();
  const filterResult = await buildScopeFilter(user.id, "READ_STUDY", "ORDER", getScopeDeps(), effectiveCtx);
  const scopeWhere = applyScopeFilterToPrisma(filterResult, "performingUnitId", "scheduledStationAeTitle");

  const where: Prisma.WorklistOrderWhereInput = {
    orderStatus: { in: WORKLIST_STATUSES as any[] },
    imagingStudies: { none: {} },
    ...scopeWhere
  };

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  if (filters.modality) where.modality = filters.modality;
  if (filters.priority) where.priority = filters.priority;
  // Note: assignedDoctorId doesn't apply directly to worklist typically, so we omit doctorId filter for Worklist.

  if (filters.machineId || filters.facilityId) {
    const nodeWhere: any = { isActive: true };
    if (filters.machineId) nodeWhere.id = filters.machineId;
    if (filters.facilityId) nodeWhere.facilityId = filters.facilityId;
    
    const nodes = await prisma.dicomNode.findMany({
      where: nodeWhere,
      select: { aeTitle: true }
    });
    
    const aeTitles = nodes.map(n => n.aeTitle).filter(Boolean) as string[];
    
    if (aeTitles.length > 0) {
      if (where.OR) {
        where.AND = [
          { OR: where.OR as any },
          { scheduledStationAeTitle: { in: aeTitles } }
        ];
        delete where.OR;
      } else {
        where.scheduledStationAeTitle = { in: aeTitles };
      }
    } else {
      where.id = "force-empty-result"; 
    }
  }

  return where;
}

export async function getCommandCenterSummary(user: AuthenticatedUser, filters: CommandCenterFilters) {
  const ctx = ScopeRequestContext.create();
  const baseWhere = await buildBaseWhere(user, filters, ctx);
  const worklistWhere = await buildWorklistWhere(user, filters, ctx);

  const [
    studyCounts,
    pendingApprovalCount,
    hisFailedCount,
    criticalAckCount,
    worklistCount
  ] = await Promise.all([
    prisma.imagingStudy.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true
    }),
    prisma.report.count({
      where: {
        status: "PENDING_APPROVAL",
        imagingStudy: baseWhere
      }
    }),
    prisma.imagingStudy.count({
      where: {
        AND: [
          baseWhere,
          {
            OR: [
              { hisSyncStatus: { in: ["FAILED", "RETRY"] } },
              { hisResultStatus: { in: ["FAILED", "RETRY"] } },
              { reports: { some: { hisResultStatus: { in: ["FAILED", "RETRY"] } } } }
            ]
          }
        ]
      }
    }),
    prisma.criticalResult.count({
      where: {
        status: "PENDING_ACK",
        imagingStudy: baseWhere
      }
    }),
    prisma.worklistOrder.count({
      where: worklistWhere
    })
  ]);

  const { total: activeAlertsCount } = await scanScopedOpenAlerts(user, filters, baseWhere);

  const stats = {
    WAITING_SCAN: worklistCount,
    WAITING_RECEIVED: 0,
    WAITING_READ: 0,
    READING: 0,
    PENDING_APPROVAL: pendingApprovalCount,
    FINALIZED: 0,
    DELIVERED: 0,
    HIS_FAILED: hisFailedCount,
    CRITICAL_PENDING: criticalAckCount,
    ACTIVE_ALERTS: activeAlertsCount,
    TOTAL: worklistCount
  };

  for (const item of studyCounts) {
    stats.TOTAL += item._count;
    if (["ORDERED", "READY_FOR_SCAN", "IN_PROGRESS"].includes(item.status)) {
      stats.WAITING_RECEIVED += item._count;
    } else if (["RECEIVED", "STABLE", "NEEDS_QC", "READY_TO_READ"].includes(item.status)) {
      stats.WAITING_READ += item._count;
    } else if (item.status === "READING" || item.status === "REPORTED") {
      stats.READING += item._count;
    } else if (item.status === "FINALIZED") {
      stats.FINALIZED += item._count;
    } else if (item.status === "DELIVERED") {
      stats.DELIVERED += item._count;
    }
  }

  return stats;
}

export async function getLiveQueue(user: AuthenticatedUser, filters: CommandCenterFilters, pagination: PaginationParams) {
  const ctx = ScopeRequestContext.create();
  const baseWhere = await buildBaseWhere(user, filters, ctx);
  const worklistWhere = await buildWorklistWhere(user, filters, ctx);
  const skip = (pagination.page - 1) * pagination.pageSize;
  const activeStudyWhere: Prisma.ImagingStudyWhereInput = {
    AND: [
      baseWhere,
      { status: { in: ["ORDERED", "READY_FOR_SCAN", "IN_PROGRESS", "STABLE", "NEEDS_QC", "RECEIVED", "READY_TO_READ", "READING"] as any[] } },
    ],
  };

  const priorityBuckets: Prisma.StringFilter[] = [
    { equals: "STAT" },
    { equals: "URGENT" },
    { notIn: ["STAT", "URGENT"] },
  ];

  const bucketCounts = await Promise.all(
    priorityBuckets.map(async priority => {
      const [pacs, his] = await Promise.all([
        prisma.imagingStudy.count({ where: { AND: [activeStudyWhere, { priority }] } }),
        prisma.worklistOrder.count({ where: { AND: [worklistWhere, { priority }] } }),
      ]);
      return { pacs, his, total: pacs + his };
    })
  );

  const total = bucketCounts.reduce((sum, bucket) => sum + bucket.total, 0);
  const paginatedRefs: QueueReference[] = [];
  let precedingCount = 0;

  for (let index = 0; index < priorityBuckets.length && paginatedRefs.length < pagination.pageSize; index += 1) {
    const bucket = bucketCounts[index];
    const bucketEnd = precedingCount + bucket.total;
    if (skip >= bucketEnd) {
      precedingCount = bucketEnd;
      continue;
    }

    const skipWithinBucket = Math.max(0, skip - precedingCount);
    const needed = pagination.pageSize - paginatedRefs.length;
    const candidateLimit = skipWithinBucket + needed;
    const priority = priorityBuckets[index];

    const [studyRefs, worklistRefs] = await Promise.all([
      prisma.imagingStudy.findMany({
        where: { AND: [activeStudyWhere, { priority }] },
        select: { id: true, priority: true, createdAt: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: candidateLimit,
      }),
      prisma.worklistOrder.findMany({
        where: { AND: [worklistWhere, { priority }] },
        select: { id: true, priority: true, createdAt: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: candidateLimit,
      }),
    ]);

    const bucketPage = mergeQueueBucketPage(studyRefs, worklistRefs, skipWithinBucket, needed);

    paginatedRefs.push(...bucketPage);
    precedingCount = bucketEnd;
  }

  const pacsIds = paginatedRefs.filter(r => r.source === 'PACS').map(r => r.id);
  const hisIds = paginatedRefs.filter(r => r.source === 'HIS').map(r => r.id);

  const [fullStudies, fullWorklists] = await Promise.all([
    pacsIds.length > 0
      ? prisma.imagingStudy.findMany({ where: { AND: [activeStudyWhere, { id: { in: pacsIds } }] } })
      : [],
    hisIds.length > 0
      ? prisma.worklistOrder.findMany({ where: { AND: [worklistWhere, { id: { in: hisIds } }] } })
      : []
  ]);

  const canSeePHI = user.role === "ADMIN" || user.permissions?.includes("studies.read");
  
  const studyMap = new Map(fullStudies.map(s => [s.id, s] as [string, any]));
  const worklistMap = new Map(fullWorklists.map(w => [w.id, w] as [string, any]));

  const paginated: any[] = [];
  for (const ref of paginatedRefs) {
    if (ref.source === 'PACS') {
      const s = studyMap.get(ref.id);
      if (!s) continue;
      paginated.push({
        id: s.id,
        uid: s.studyInstanceUid,
        accessionNumber: s.accessionNumber,
        patientName: canSeePHI ? s.patientName : "***",
        priority: s.priority,
        status: s.status,
        createdAt: s.createdAt,
        source: 'PACS'
      });
    } else {
      const w = worklistMap.get(ref.id);
      if (!w) continue;
      paginated.push({
        id: w.id,
        orderId: w.id,
        accessionNumber: w.accessionNumber,
        patientName: canSeePHI ? w.patientName : "***",
        priority: w.priority,
        status: w.orderStatus,
        createdAt: w.createdAt,
        source: 'HIS'
      });
    }
  }

  return { data: paginated, total };
}

export async function getDoctorMachineBacklog(user: AuthenticatedUser, filters: CommandCenterFilters) {
  const ctx = ScopeRequestContext.create();
  const baseWhere = await buildBaseWhere(user, filters, ctx);

  const [doctorGroup, machineGroup] = await Promise.all([
    prisma.imagingStudy.groupBy({
      by: ['assignedDoctorId'],
      where: {
        ...baseWhere,
        status: { in: ["READY_TO_READ", "READING", "REPORTED", "NEEDS_QC", "STABLE", "RECEIVED"] as any[] }
      },
      _count: true
    }),
    prisma.imagingStudy.groupBy({
      by: ['stationAeTitle'],
      where: {
        ...baseWhere,
        status: { in: ["ORDERED", "READY_FOR_SCAN", "IN_PROGRESS"] as any[] }
      },
      _count: true
    })
  ]);

  const doctorIds = doctorGroup.map(d => d.assignedDoctorId).filter(Boolean) as string[];
  const doctors = doctorIds.length > 0 
    ? await prisma.user.findMany({ where: { id: { in: doctorIds } }, select: { id: true, fullName: true } })
    : [];
  
  const doctorMap = Object.fromEntries(doctors.map(d => [d.id, d.fullName]));

  const aeTitles = machineGroup.map(m => m.stationAeTitle).filter(Boolean) as string[];
  const nodes = aeTitles.length > 0
    ? await prisma.dicomNode.findMany({ where: { aeTitle: { in: aeTitles }, isActive: true }, select: { aeTitle: true, name: true } })
    : [];
    
  const nodeMap = Object.fromEntries(nodes.map(n => [n.aeTitle!, n.name]));

  return {
    doctorBacklog: doctorGroup.map(d => ({
      doctorId: d.assignedDoctorId,
      doctorName: d.assignedDoctorId ? doctorMap[d.assignedDoctorId] || "Unknown" : "Chưa gán bác sĩ",
      count: d._count
    })).sort((a, b) => b.count - a.count),
    machineBacklog: machineGroup.map(m => ({
      aeTitle: m.stationAeTitle,
      machineName: m.stationAeTitle ? nodeMap[m.stationAeTitle] || m.stationAeTitle : "Unknown",
      count: m._count
    })).sort((a, b) => b.count - a.count)
  };
}

export async function filterAlertsByScope(alerts: any[], user: AuthenticatedUser, filters: CommandCenterFilters, baseWhere: any) {
  const canSeeSystemAlerts = user.role === "ADMIN" || user.permissions?.includes("ops.health") || user.permissions?.includes("alerts.manage");
  const canSeePHI = user.role === "ADMIN" || user.permissions?.includes("studies.read");
  
  const reportIds = alerts.filter(a => a.entityType === 'Report').map(a => a.entityId).filter(Boolean) as string[];
  const crIds = alerts.filter(a => a.entityType === 'CriticalResult').map(a => a.entityId).filter(Boolean) as string[];

  const [reports, crs] = await Promise.all([
    reportIds.length > 0 ? prisma.report.findMany({ where: { id: { in: reportIds } }, select: { id: true, imagingStudyId: true, studyInstanceUid: true } }) : [],
    crIds.length > 0 ? prisma.criticalResult.findMany({ where: { id: { in: crIds } }, select: { id: true, imagingStudyId: true } }) : []
  ]);

  const reportMap = new Map<string, any>();
  for (const r of reports) reportMap.set(r.id, r);

  const crMap = new Map<string, string | null>();
  for (const c of crs) crMap.set(c.id, c.imagingStudyId);

  // Extract all study IDs that are referenced by alerts to avoid fetching all active studies into RAM
  const studyIdsToCheck = new Set<string>();
  const studyUidsToCheck = new Set<string>();

  for (const a of alerts) {
    if (a.entityType === 'ImagingStudy' && a.entityId) {
      studyIdsToCheck.add(a.entityId);
    } else if (a.entityType === 'Report' && a.entityId) {
      const r = reportMap.get(a.entityId);
      if (r) {
        if (r.imagingStudyId) studyIdsToCheck.add(r.imagingStudyId);
        if (r.studyInstanceUid) studyUidsToCheck.add(r.studyInstanceUid);
      }
    } else if (a.entityType === 'CriticalResult' && a.entityId) {
      const sId = crMap.get(a.entityId);
      if (sId) studyIdsToCheck.add(sId);
    }
  }

  // Find which of those referenced studies actually match the user's base scope
  const validStudies = await prisma.imagingStudy.findMany({
    where: {
      ...baseWhere,
      OR: [
        { id: { in: Array.from(studyIdsToCheck) } },
        { studyInstanceUid: { in: Array.from(studyUidsToCheck) } }
      ]
    },
    select: { id: true, studyInstanceUid: true }
  });
  
  const validStudyIds = new Set(validStudies.map(s => s.id));
  const validStudyUids = new Set(validStudies.map(s => s.studyInstanceUid));

  const filteredAlerts = alerts.filter(a => {
    if (!a.entityType || a.entityType === 'SYSTEM') {
      return canSeeSystemAlerts;
    }

    if (["ImagingStudy", "Report", "CriticalResult"].includes(a.entityType)) {
      if (!a.entityId) return false;
      
      let studyId = null;
      let studyUid = null;

      if (a.entityType === 'ImagingStudy') {
        studyId = a.entityId;
      } else if (a.entityType === 'Report') {
        const r = reportMap.get(a.entityId);
        if (r) {
          studyId = r.imagingStudyId;
          studyUid = r.studyInstanceUid;
        }
      } else if (a.entityType === 'CriticalResult') {
        studyId = crMap.get(a.entityId);
      }

      if (studyId && validStudyIds.has(studyId)) return true;
      if (studyUid && validStudyUids.has(studyUid)) return true;
      return false;
    }

    return canSeeSystemAlerts; // other random alerts go to system
  }).map(a => {
    if (["ImagingStudy", "Report", "CriticalResult"].includes(a.entityType) && !canSeePHI) {
      return { ...a, title: "***", message: "*** (Phi Masked)" };
    }
    return a;
  });

  return { filteredAlerts };
}

async function scanScopedOpenAlerts(
  user: AuthenticatedUser,
  filters: CommandCenterFilters,
  baseWhere: Prisma.ImagingStudyWhereInput,
  pagination?: PaginationParams
) {
  const pageStart = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
  const pageEnd = pagination ? pageStart + pagination.pageSize : 0;
  const data: any[] = [];
  const batchSize = 500;
  let total = 0;
  let cursorId: string | undefined;

  while (true) {
    const batch = await prisma.alertEvent.findMany({
      where: { status: "OPEN" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: batchSize,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });

    if (batch.length === 0) break;
    const { filteredAlerts } = await filterAlertsByScope(batch, user, filters, baseWhere);

    for (const alert of filteredAlerts) {
      if (pagination && total >= pageStart && total < pageEnd) data.push(alert);
      total += 1;
    }

    cursorId = batch[batch.length - 1].id;
    if (batch.length < batchSize) break;
  }

  return { data, total };
}

export async function getActiveAlerts(user: AuthenticatedUser, filters: CommandCenterFilters, pagination: PaginationParams) {
  const ctx = ScopeRequestContext.create();
  const baseWhere = await buildBaseWhere(user, filters, ctx);
  const result = await scanScopedOpenAlerts(user, filters, baseWhere, pagination);
  return { ...result, truncated: false };
}

interface SlaDataQualitySignal {
  studyId: string;
  studyInstanceUid: string;
  stage: SlaStage;
}

async function syncSlaDataQualityAlerts(studyIds: string[], signals: SlaDataQualitySignal[]) {
  if (studyIds.length === 0) return;

  const activeKeys = new Set(signals.map(signal => `DQ_SLA_${signal.studyId}_${signal.stage}`));
  const existingOpenAlerts = await prisma.alertEvent.findMany({
    where: {
      status: "OPEN",
      entityType: "ImagingStudy",
      entityId: { in: studyIds },
      idempotencyKey: { startsWith: "DQ_SLA_" },
    },
    select: { id: true, idempotencyKey: true },
  });

  const staleIds = existingOpenAlerts
    .filter(alert => !activeKeys.has(alert.idempotencyKey))
    .map(alert => alert.id);

  const writes = signals.map(signal => prisma.alertEvent.upsert({
    where: { idempotencyKey: `DQ_SLA_${signal.studyId}_${signal.stage}` },
    create: {
      idempotencyKey: `DQ_SLA_${signal.studyId}_${signal.stage}`,
      severity: "WARNING",
      title: "SLA Data Quality Issue",
      message: `Missing timestamp for stage ${signal.stage} on study ${signal.studyInstanceUid}`,
      entityType: "ImagingStudy",
      entityId: signal.studyId,
      status: "OPEN",
    },
    update: {
      status: "OPEN",
      severity: "WARNING",
      message: `Missing timestamp for stage ${signal.stage} on study ${signal.studyInstanceUid}`,
      acknowledgedByUserId: null,
      acknowledgedAt: null,
      resolvedByUserId: null,
      resolvedAt: null,
    },
  }));

  if (staleIds.length > 0) {
    await prisma.alertEvent.updateMany({
      where: { id: { in: staleIds }, status: "OPEN" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }

  for (let index = 0; index < writes.length; index += 100) {
    await prisma.$transaction(writes.slice(index, index + 100));
  }
}

export async function getSlaBreaches(user: AuthenticatedUser, filters: CommandCenterFilters, pagination: PaginationParams) {
  const ctx = ScopeRequestContext.create();
  const baseWhere = await buildBaseWhere(user, filters, ctx);
  const pageStart = (pagination.page - 1) * pagination.pageSize;
  const pageEnd = pageStart + pagination.pageSize;
  const activePolicies = await prisma.slaPolicy.findMany({ where: { isActive: true } });
  const canSeePHI = user.role === "ADMIN" || user.permissions?.includes("studies.read");
  const now = new Date();
  const data: any[] = [];
  const batchSize = 250;
  let total = 0;
  let cursorId: string | undefined;

  while (true) {
    const studies = await prisma.imagingStudy.findMany({
      where: {
        AND: [
          baseWhere,
          { status: { notIn: ["DELIVERED", "ARCHIVED", "DELETED_FROM_PACS", "ERROR", "QC_REJECTED"] as any[] } },
        ],
      },
      include: { order: { select: { createdAt: true } } },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });

    if (studies.length === 0) break;

    const procedureCodes = Array.from(new Set(studies.map(study => study.procedureCode).filter(Boolean) as string[]));
    const aeTitles = Array.from(new Set(studies.map(study => study.stationAeTitle).filter(Boolean) as string[]));
    const doctorIds = Array.from(new Set(studies.map(study => study.assignedDoctorId).filter(Boolean) as string[]));
    const [procedures, nodes, doctors] = await Promise.all([
      procedureCodes.length > 0
        ? prisma.procedureCatalog.findMany({ where: { code: { in: procedureCodes } }, select: { id: true, code: true } })
        : [],
      aeTitles.length > 0
        ? prisma.dicomNode.findMany({ where: { aeTitle: { in: aeTitles }, isActive: true }, select: { aeTitle: true, id: true, facilityId: true } })
        : [],
      doctorIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: doctorIds } }, select: { id: true, role: true } })
        : [],
    ]);

    const procedureMap = new Map<string, string>(
      procedures.map(item => [item.code, item.id] as [string, string])
    );
    const nodeMap = new Map<string, { id: string; facilityId: string | null }>(
      nodes
        .filter(item => item.aeTitle)
        .map(item => [item.aeTitle as string, { id: item.id, facilityId: item.facilityId }] as [string, { id: string; facilityId: string | null }])
    );
    const doctorRoleMap = new Map<string, string>(
      doctors.map(item => [item.id, item.role] as [string, string])
    );
    const signals: SlaDataQualitySignal[] = [];

    for (const study of studies) {
      const nodeData = study.stationAeTitle ? nodeMap.get(study.stationAeTitle) : undefined;
      const context = {
        procedureCatalogId: study.procedureCode ? procedureMap.get(study.procedureCode) ?? null : null,
        machineId: nodeData?.id ?? null,
        facilityId: nodeData?.facilityId ?? null,
        modality: study.modality,
        priority: study.priority,
        doctorId: study.assignedDoctorId,
        role: study.assignedDoctorId ? doctorRoleMap.get(study.assignedDoctorId) ?? null : null,
        module: "COMMAND_CENTER",
      };

      const stages: { stage: SlaStage; start: Date | null | undefined; end: Date | null | undefined }[] = [
        { stage: "ORDER_TO_CHECKIN", start: study.order?.createdAt, end: study.checkedInAt },
        { stage: "CHECKIN_TO_SCAN", start: study.checkedInAt, end: study.scanStartedAt },
        { stage: "SCAN_TO_RECEIVED", start: study.scanEndedAt, end: study.receivedAt },
        { stage: "RECEIVED_TO_FIRST_READ", start: study.receivedAt, end: study.firstOpenedAt },
        { stage: "FIRST_READ_TO_FINAL", start: study.firstOpenedAt, end: study.finalizedAt },
        { stage: "FINAL_TO_DELIVERED", start: study.finalizedAt, end: study.deliveredAt },
        { stage: "END_TO_END", start: study.order?.createdAt, end: study.deliveredAt },
      ];

      for (const { stage, start, end } of stages) {
        const duration = calculateSlaDuration(stage, start, end, study.status, now);
        if (duration.status === "MISSING_END" && isSlaStageCompleted(stage, study.status)) {
          signals.push({ studyId: study.id, studyInstanceUid: study.studyInstanceUid, stage });
        }

        const policy = resolveSlaPolicy(activePolicies, stage, context, now);
        if (evaluateSlaThreshold(duration.durationMinutes, policy.thresholdMinutes) !== "BREACH") continue;

        if (total >= pageStart && total < pageEnd) {
          data.push({
            studyInstanceUid: study.studyInstanceUid,
            patientName: canSeePHI ? study.patientName : "***",
            priority: study.priority,
            stage,
            durationMinutes: duration.durationMinutes,
            thresholdMinutes: policy.thresholdMinutes,
            policyCode: policy.policyCode,
            source: policy.source,
            status: duration.status,
          });
        }
        total += 1;
      }
    }

    await syncSlaDataQualityAlerts(studies.map(study => study.id), signals);
    cursorId = studies[studies.length - 1].id;
    if (studies.length < batchSize) break;
  }

  return { data, total };
}

export async function getStuckWorkflow(user: AuthenticatedUser, filters: CommandCenterFilters, pagination: PaginationParams) {
  const ctx = ScopeRequestContext.create();
  const baseWhere = await buildBaseWhere(user, filters, ctx);
  const skip = (pagination.page - 1) * pagination.pageSize;

  const canSeePHI = user.role === "ADMIN" || user.permissions?.includes("studies.read");
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  // To avoid complex DB queries that handle stage-specific timestamps, we fetch all non-final active studies
  // and evaluate them in memory.
  const [studies, worklists] = await Promise.all([
    prisma.imagingStudy.findMany({
      where: {
        ...baseWhere,
        status: { in: ["ORDERED", "READY_FOR_SCAN", "IN_PROGRESS", "STABLE", "NEEDS_QC", "RECEIVED", "READY_TO_READ", "READING"] as any[] }
      },
      include: { order: { select: { createdAt: true } } }
    }),
    prisma.worklistOrder.findMany({
      where: {
        ...(await buildWorklistWhere(user, filters, ctx)),
        orderStatus: { in: ["REQUESTED", "SCHEDULED", "ARRIVED"] }
      }
    })
  ]);

  const stuckItems: any[] = [];
  const now = Date.now();

  for (const s of studies) {
    const stageTime = getStudyStuckSince(s);
    if (stageTime && stageTime.getTime() < twoHoursAgo.getTime()) {
      stuckItems.push({
        id: s.id,
        studyInstanceUid: s.studyInstanceUid,
        accessionNumber: s.accessionNumber,
        patientName: canSeePHI ? s.patientName : "***",
        status: s.status,
        priority: s.priority,
        stuckSince: stageTime,
        hoursStuck: Math.floor((now - stageTime.getTime()) / (1000 * 60 * 60))
      });
    }
  }

  for (const w of worklists) {
    const stageTime = getWorklistStuckSince(w, new Date(now));
    if (stageTime && stageTime.getTime() < twoHoursAgo.getTime()) {
      stuckItems.push({
        id: w.id,
        studyInstanceUid: null,
        accessionNumber: w.accessionNumber,
        patientName: canSeePHI ? w.patientName : "***",
        status: w.orderStatus,
        priority: w.priority,
        stuckSince: stageTime,
        hoursStuck: Math.floor((now - stageTime.getTime()) / (1000 * 60 * 60))
      });
    }
  }

  stuckItems.sort((a, b) => b.hoursStuck - a.hoursStuck); // Longest stuck first

  const paginated = stuckItems.slice(skip, skip + pagination.pageSize);

  return { data: paginated, total: stuckItems.length }; 
}
