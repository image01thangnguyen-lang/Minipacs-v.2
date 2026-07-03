"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { recordStudyEventInTx } from "@/lib/studyEvents";
import { orthancClient } from "@/lib/orthancClient";
import type {
  StatisticsAlerts,
  StatisticsBreakdownRow,
  StatisticsBusinessAnalytics,
  StatisticsBusinessBreakdownRow,
  StatisticsBusinessTrendRow,
  StatisticsCriticalResultRow,
  StatisticsDoseOutlierRow,
  StatisticsDoctorOption,
  StatisticsDoctorRow,
  StatisticsDrilldown,
  StatisticsDrilldownRow,
  StatisticsDurationSummary,
  StatisticsFilterPreset,
  StatisticsFilters,
  StatisticsModalityCount,
  StatisticsOperations,
  StatisticsOperationRow,
  StatisticsPacsDuplicateAccessionRow,
  StatisticsPacsHealth,
  StatisticsPacsLastReceivedRow,
  StatisticsPacsMetadataIssueRow,
  StatisticsPacsNodeHealthRow,
  StatisticsPayload,
  StatisticsPerformance,
  StatisticsPerformanceOutlier,
  StatisticsProcedureMixRow,
  StatisticsQualityBreakdownRow,
  StatisticsQualityReasonRow,
  StatisticsQualitySafety,
  StatisticsQualityStudyRow,
  StatisticsQueueRow,
  StatisticsRoomUtilizationRow,
  StatisticsStatusCount,
  StatisticsStorage,
  StatisticsTrendPoint,
  StatisticsUtilization,
  StatisticsWorkload,
  StatisticsWorkloadDoctorRow,
  StatisticsWorkloadQueueRow,
} from "./types";

const statusLabels: Record<string, string> = {
  ORDERED: "Chờ chụp",
  READY_FOR_SCAN: "Sẵn sàng chụp",
  IN_PROGRESS: "Đang chụp",
  RECEIVED: "Đã nhận ảnh",
  STABLE: "Ảnh ổn định",
  NEEDS_QC: "Cần QC",
  QC_REJECTED: "Chụp lại",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  REPORTED: "Đã có báo cáo",
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ARCHIVED: "Lưu trữ",
  DELETED_FROM_PACS: "Đã xóa ảnh",
  ERROR: "Lỗi",
};

const AUTO_REFRESH_SECONDS = 30;
const SLA_MINUTES_BY_PRIORITY: Record<string, number> = {
  STAT: 30,
  URGENT: 120,
  ROUTINE: 1440,
};

const ROOM_CAPACITY_MINUTES_PER_DAY = 480;
const NODE_ECHO_WARNING_MINUTES = 30;
const NODE_ECHO_CRITICAL_MINUTES = 120;
const MODALITY_IDLE_WARNING_MINUTES = 24 * 60;
const STORAGE_WARNING_DAYS = 30;
const STORAGE_CRITICAL_DAYS = 7;
const DOSE_THRESHOLDS: Record<string, number> = {
  CTDIVOL: Number(process.env.DOSE_CTDI_VOL_THRESHOLD || 80),
  DLP: Number(process.env.DOSE_DLP_THRESHOLD || 1500),
  DOSE_AREA_PRODUCT: Number(process.env.DOSE_DAP_THRESHOLD || 50000),
  ENTRANCE_DOSE: Number(process.env.DOSE_ENTRANCE_THRESHOLD || 20),
};
const DEFAULT_SCAN_MINUTES_BY_MODALITY: Record<string, number> = {
  CT: 20,
  MR: 30,
  MRI: 30,
  US: 20,
  DX: 8,
  CR: 8,
  SRDX: 8,
};

const priorityRank: Record<string, number> = {
  STAT: 0,
  URGENT: 1,
  ROUTINE: 2,
};

async function requireStatisticsAccess() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "statistics.read", session.user.permissions)) redirect("/");
  return session.user;
}

function canManageAssignments(user: any) {
  return (
    hasPermission(user.role, "worklist.manage", user.permissions) ||
    hasPermission(user.role, "users.manage", user.permissions)
  );
}

function canManageOperationalAlerts(user: any) {
  return (
    hasPermission(user.role, "worklist.manage", user.permissions) ||
    hasPermission(user.role, "users.manage", user.permissions) ||
    hasPermission(user.role, "pacs.manage", user.permissions)
  );
}

function canManageQualitySafety(user: any) {
  return (
    hasPermission(user.role, "reports.write", user.permissions) ||
    hasPermission(user.role, "worklist.manage", user.permissions) ||
    hasPermission(user.role, "pacs.manage", user.permissions)
  );
}

function isDoctorOnlyWorkloadView(user: any) {
  return (user.baseRole || user.role) === "DOCTOR" && !canManageAssignments(user);
}

async function requireAssignmentAccess() {
  const user = await requireStatisticsAccess();
  if (!canManageAssignments(user)) throw new Error("Tài khoản không có quyền điều phối bác sĩ đọc phim.");
  return user;
}

async function requireAlertAccess() {
  const user = await requireStatisticsAccess();
  if (!canManageOperationalAlerts(user)) throw new Error("Tài khoản không có quyền xử lý alert vận hành.");
  return user;
}

async function requireQualitySafetyAccess() {
  const user = await requireStatisticsAccess();
  if (!canManageQualitySafety(user)) throw new Error("Tai khoan khong co quyen xu ly quality/safety.");
  return user;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function vietnamDateInput(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function readDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : vietnamDateInput();
}

function toVietnamRange(dateFrom?: string, dateTo?: string) {
  const from = readDate(dateFrom);
  const to = readDate(dateTo || dateFrom);
  return {
    dateFrom: from,
    dateTo: to,
    start: new Date(`${from}T00:00:00+07:00`),
    end: new Date(`${to}T00:00:00+07:00`),
  };
}

function plusOneDay(date: Date) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function rangeFilter(start: Date, endExclusive: Date) {
  return { gte: start, lt: endExclusive };
}

function studyDateWhere(start: Date, endExclusive: Date) {
  const range = rangeFilter(start, endExclusive);
  return {
    OR: [
      { receivedAt: range },
      { stableAt: range },
      { scheduledAt: range },
      { finalizedAt: range },
      { deliveredAt: range },
      { createdAt: range },
    ],
  };
}

function reportFinalWhere(start: Date, endExclusive: Date, doctorId?: string) {
  const range = rangeFilter(start, endExclusive);
  return {
    status: { in: ["FINAL"] as any[] },
    ...(doctorId ? { doctorId } : {}),
    OR: [
      { updatedAt: range },
      { imagingStudy: { is: { finalizedAt: range } } },
    ],
  };
}

function minutesBetween(start?: Date | null, end?: Date | null) {
  if (!start || !end) return null;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  return minutes >= 0 ? minutes : null;
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentile(values: number[], percentileValue: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function rate(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function clampPositive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function optionalIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function isHealthyStatus(value?: string | null) {
  const status = cleanText(value).toUpperCase();
  return Boolean(status && ["OK", "SUCCESS", "ONLINE", "UP", "PONG"].includes(status));
}

function warningLevelFromForecast(forecastDays: number | null): "normal" | "warning" | "critical" | "unknown" {
  if (forecastDays === null) return "unknown";
  if (forecastDays <= STORAGE_CRITICAL_DAYS) return "critical";
  if (forecastDays <= STORAGE_WARNING_DAYS) return "warning";
  return "normal";
}

function storageCapacityMb() {
  const value = Number(process.env.PACS_STORAGE_CAPACITY_MB || process.env.ORTHANC_STORAGE_CAPACITY_MB || 0);
  return clampPositive(value);
}

function vietnamDateKey(date?: Date | null) {
  return date ? vietnamDateInput(date) : "";
}

function vietnamHour(date?: Date | null) {
  if (!date) return 0;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(parts.find(part => part.type === "hour")?.value || 0);
}

function dateKeysInRange(start: Date, endExclusive: Date) {
  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor < endExclusive) {
    keys.push(vietnamDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function cleanText(value?: string | null) {
  return (value || "").trim();
}

function normalizeBucket(value?: string | null, fallback = "UNKNOWN") {
  return cleanText(value)
    .replace(/\s+/g, " ")
    .toUpperCase()
    || fallback;
}

function displayBucket(value?: string | null, fallback = "Unknown") {
  return cleanText(value).replace(/\s+/g, " ") || fallback;
}

function formatPatientName(value?: string | null) {
  return cleanText(value).replace(/\^/g, " ") || "Unknown Patient";
}

function decimalToNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows: string[][]) {
  return rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}

function serializeQueueRow(study: any): StatisticsQueueRow {
  const waitingSince = study.receivedAt || study.stableAt || study.scheduledAt || study.createdAt || null;
  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid,
    accessionNumber: study.accessionNumber || "-",
    patientName: formatPatientName(study.patientName),
    patientId: study.patientId || "-",
    modality: study.modality || "-",
    studyDescription: study.studyDescription || "-",
    status: study.status,
    priority: study.order?.priority || "ROUTINE",
    waitingMinutes: minutesBetween(waitingSince, new Date()) || 0,
    waitingSince: waitingSince ? waitingSince.toISOString() : null,
  };
}

function priorityOf(study: any) {
  return study.priority || study.order?.priority || "ROUTINE";
}

function stationOf(study: any) {
  return study.stationAeTitle || study.order?.scheduledStationAeTitle || "-";
}

function waitingSinceForStudy(study: any) {
  if (study.status === "FINALIZED") return study.finalizedAt || study.updatedAt || study.createdAt || null;
  return study.receivedAt || study.stableAt || study.scheduledAt || study.createdAt || null;
}

function slaThresholdForPriority(priority: string) {
  return SLA_MINUTES_BY_PRIORITY[priority] || SLA_MINUTES_BY_PRIORITY.ROUTINE;
}

function serializeOperationStudyRow(study: any, reason: string): StatisticsOperationRow {
  const waitingSince = waitingSinceForStudy(study);
  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid || "",
    accessionNumber: study.accessionNumber || "-",
    patientName: formatPatientName(study.patientName),
    patientId: study.patientId || "-",
    modality: study.modality || "-",
    studyDescription: study.studyDescription || "-",
    status: study.status,
    statusLabel: statusLabels[study.status] || study.status,
    priority: priorityOf(study),
    stationAeTitle: stationOf(study),
    waitingMinutes: minutesBetween(waitingSince, new Date()) || 0,
    waitingSince: waitingSince ? waitingSince.toISOString() : null,
    reason,
    href: study.studyInstanceUid ? `/report/${encodeURIComponent(study.studyInstanceUid)}` : "/worklist",
  };
}

function serializeNoStudyOrderRow(order: any): StatisticsOperationRow {
  const waitingSince = order.arrivedAt || order.scheduledDate || order.createdAt || null;
  return {
    id: `order-${order.id}`,
    studyInstanceUid: order.requestedStudyInstanceUid || "",
    accessionNumber: order.accessionNumber || "-",
    patientName: formatPatientName(order.patientName),
    patientId: order.patientId || "-",
    modality: order.modality || "-",
    studyDescription: order.procedureDescription || "-",
    status: order.orderStatus,
    statusLabel: orderStatusLabel(order.orderStatus),
    priority: order.priority || "ROUTINE",
    stationAeTitle: order.scheduledStationAeTitle || "-",
    waitingMinutes: minutesBetween(waitingSince, new Date()) || 0,
    waitingSince: waitingSince ? waitingSince.toISOString() : null,
    reason: "Có order/check-in nhưng chưa thấy study trong PACS/RIS.",
    href: "/worklist",
  };
}

function orderStatusLabel(status?: string) {
  if (status === "REQUESTED") return "Mới tạo";
  if (status === "SCHEDULED") return "Đã hẹn";
  if (status === "ARRIVED") return "Đã đến";
  if (status === "CANCELLED") return "Đã hủy";
  if (status === "EXPIRED") return "Quá hạn";
  return status || "-";
}

function stuckReason(study: any) {
  const row = serializeOperationStudyRow(study, "");
  const threshold = slaThresholdForPriority(row.priority);
  if ((study.status === "ORDERED" || study.status === "READY_FOR_SCAN") && row.waitingMinutes >= 60) {
    return "Đã có order/worklist nhưng chưa thấy ảnh về PACS.";
  }
  if ((study.status === "RECEIVED" || study.status === "STABLE" || study.status === "NEEDS_QC") && row.waitingMinutes >= 30) {
    return "Ảnh đã về nhưng chưa sẵn sàng đọc hoặc chưa hoàn tất QC.";
  }
  if ((study.status === "READY_TO_READ" || study.status === "READING") && row.waitingMinutes >= threshold) {
    return "Ca đọc đang vượt ngưỡng SLA theo mức ưu tiên.";
  }
  if (study.status === "FINALIZED" && row.waitingMinutes >= 120) {
    return "Đã ký nhưng chưa ghi nhận trả kết quả.";
  }
  return "";
}

function sortOperationRows(rows: StatisticsOperationRow[]) {
  return rows.sort((a, b) => {
    const priorityDelta = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
    if (priorityDelta !== 0) return priorityDelta;
    return b.waitingMinutes - a.waitingMinutes;
  });
}

function durationSummary(key: string, label: string, values: number[], targetMinutes: number | null): StatisticsDurationSummary {
  const breachCount = targetMinutes === null ? 0 : values.filter(value => value > targetMinutes).length;
  return {
    key,
    label,
    targetMinutes,
    count: values.length,
    averageMinutes: average(values),
    p50Minutes: percentile(values, 50),
    p90Minutes: percentile(values, 90),
    p95Minutes: percentile(values, 95),
    breachCount,
    breachRate: rate(breachCount, values.length),
  };
}

function breakdownRow(key: string, label: string, rows: Array<{ turnaroundMinutes: number; thresholdMinutes: number }>): StatisticsBreakdownRow {
  const values = rows.map(row => row.turnaroundMinutes);
  const breachCount = rows.filter(row => row.turnaroundMinutes > row.thresholdMinutes).length;
  return {
    key,
    label,
    count: rows.length,
    averageTatMinutes: average(values),
    p90TatMinutes: percentile(values, 90),
    breachCount,
    breachRate: rate(breachCount, rows.length),
  };
}

function scanDurationMinutes(study: any) {
  const actual = minutesBetween(study.scanStartedAt, study.scanEndedAt);
  if (actual !== null) return Math.max(1, actual);

  const scheduledToReceived = minutesBetween(study.scheduledAt || study.order?.scheduledDate, study.receivedAt);
  if (scheduledToReceived !== null) return Math.min(Math.max(scheduledToReceived, 1), 180);

  const modality = cleanText(study.modality || study.order?.modality).toUpperCase();
  return DEFAULT_SCAN_MINUTES_BY_MODALITY[modality] || 15;
}

function operationDateForStudy(study: any) {
  return study.scanStartedAt || study.receivedAt || study.scheduledAt || study.order?.scheduledDate || study.createdAt || null;
}

function serializePerformanceOutlier(row: {
  study: any;
  turnaroundMinutes: number;
  thresholdMinutes: number;
  finalizedAt: Date | null;
}): StatisticsPerformanceOutlier {
  const study = row.study;
  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid || "",
    patientName: formatPatientName(study.patientName),
    patientId: study.patientId || "-",
    accessionNumber: study.accessionNumber || "-",
    modality: study.modality || "-",
    priority: priorityOf(study),
    stationAeTitle: stationOf(study),
    turnaroundMinutes: row.turnaroundMinutes,
    thresholdMinutes: row.thresholdMinutes,
    finalizedAt: row.finalizedAt ? row.finalizedAt.toISOString() : null,
    href: study.studyInstanceUid ? `/report/${encodeURIComponent(study.studyInstanceUid)}` : "/worklist",
  };
}

type AlertCandidate = {
  alertType: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  entityType: string;
  entityId?: string | null;
  ruleKey: string;
  imagingStudyId?: string | null;
  worklistOrderId?: string | null;
  dicomNodeId?: string | null;
  studyInstanceUid?: string | null;
  patientName?: string | null;
  priority?: string | null;
  assignedToUserId?: string | null;
  metadata?: Record<string, unknown>;
};

const managedAlertTypes = ["SLA_BREACH", "STUCK_WORKFLOW", "UNASSIGNED_READING", "DICOM_NODE_DOWN"];

function serializeMetadata(metadata?: Record<string, unknown>) {
  return metadata ? JSON.stringify(metadata) : null;
}

function alertHref(alert: any) {
  if (alert.studyInstanceUid) return `/report/${encodeURIComponent(alert.studyInstanceUid)}`;
  if (alert.entityType === "DICOM_NODE") return "/admin/pacs/nodes";
  if (alert.entityType === "WORKLIST_ORDER") return "/worklist";
  return "/statistics";
}

function severityRank(severity?: string | null) {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

async function upsertOperationalAlert(candidate: AlertCandidate) {
  const existing = await prisma.operationalAlert.findFirst({
    where: {
      alertType: candidate.alertType,
      ruleKey: candidate.ruleKey,
      status: { in: ["OPEN", "ACKNOWLEDGED"] },
    },
    select: { id: true, status: true },
  });

  const data = {
    alertType: candidate.alertType,
    severity: candidate.severity,
    title: candidate.title,
    message: candidate.message,
    entityType: candidate.entityType,
    entityId: candidate.entityId || null,
    ruleKey: candidate.ruleKey,
    imagingStudyId: candidate.imagingStudyId || null,
    worklistOrderId: candidate.worklistOrderId || null,
    dicomNodeId: candidate.dicomNodeId || null,
    studyInstanceUid: candidate.studyInstanceUid || null,
    patientName: candidate.patientName || null,
    priority: candidate.priority || null,
    assignedToUserId: candidate.assignedToUserId || null,
    metadataJson: serializeMetadata(candidate.metadata),
  };

  if (existing) {
    await prisma.operationalAlert.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  const manuallyResolved = await prisma.operationalAlert.findFirst({
    where: {
      alertType: candidate.alertType,
      ruleKey: candidate.ruleKey,
      status: "RESOLVED",
      resolvedByUserId: { not: null },
    },
    select: { id: true },
  });
  if (manuallyResolved) return;

  await prisma.operationalAlert.create({
    data: {
      ...data,
      status: "OPEN",
    },
  });
}

async function syncOperationalAlerts() {
  const now = new Date();
  const [readingStudies, activeStudies, nodes] = await Promise.all([
    prisma.imagingStudy.findMany({
      where: { status: { in: ["READY_TO_READ", "READING"] as any[] } },
      include: { order: true },
      take: 200,
    }),
    prisma.imagingStudy.findMany({
      where: { status: { in: ["ORDERED", "READY_FOR_SCAN", "RECEIVED", "STABLE", "NEEDS_QC", "READY_TO_READ", "READING", "FINALIZED"] as any[] } },
      include: { order: true },
      take: 200,
    }),
    prisma.dicomNode.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        aeTitle: true,
        modality: true,
        lastEchoStatus: true,
        lastEchoMessage: true,
        lastEchoAt: true,
      },
    }),
  ]);

  const candidates: AlertCandidate[] = [];

  readingStudies.forEach(study => {
    const row = serializeOperationStudyRow(study, "");
    const threshold = slaThresholdForPriority(row.priority);
    if (row.waitingMinutes >= threshold) {
      candidates.push({
        alertType: "SLA_BREACH",
        severity: row.priority === "STAT" ? "critical" : "warning",
        title: `${row.priority} quá SLA đọc phim`,
        message: `${row.patientName} đã chờ ${row.waitingMinutes} phút, ngưỡng ${threshold} phút.`,
        entityType: "IMAGING_STUDY",
        entityId: study.id,
        ruleKey: `SLA_BREACH:${study.id}`,
        imagingStudyId: study.id,
        studyInstanceUid: study.studyInstanceUid,
        patientName: row.patientName,
        priority: row.priority,
        assignedToUserId: study.assignedDoctorId,
        metadata: {
          waitingMinutes: row.waitingMinutes,
          thresholdMinutes: threshold,
          status: study.status,
          stationAeTitle: row.stationAeTitle,
        },
      });
    }

    if (!study.assignedDoctorId) {
      candidates.push({
        alertType: "UNASSIGNED_READING",
        severity: row.priority === "STAT" ? "critical" : row.priority === "URGENT" ? "warning" : "info",
        title: "Ca chờ đọc chưa assign bác sĩ",
        message: `${row.patientName} đang ở trạng thái ${row.statusLabel} nhưng chưa có bác sĩ phụ trách.`,
        entityType: "IMAGING_STUDY",
        entityId: study.id,
        ruleKey: `UNASSIGNED_READING:${study.id}`,
        imagingStudyId: study.id,
        studyInstanceUid: study.studyInstanceUid,
        patientName: row.patientName,
        priority: row.priority,
        metadata: {
          waitingMinutes: row.waitingMinutes,
          status: study.status,
          stationAeTitle: row.stationAeTitle,
        },
      });
    }
  });

  activeStudies.forEach(study => {
    const reason = stuckReason(study);
    if (!reason) return;
    const row = serializeOperationStudyRow(study, reason);
    candidates.push({
      alertType: "STUCK_WORKFLOW",
      severity: row.priority === "STAT" ? "critical" : "warning",
      title: "Ca kẹt workflow",
      message: reason,
      entityType: "IMAGING_STUDY",
      entityId: study.id,
      ruleKey: `STUCK_WORKFLOW:${study.id}:${study.status}`,
      imagingStudyId: study.id,
      studyInstanceUid: study.studyInstanceUid,
      patientName: row.patientName,
      priority: row.priority,
      assignedToUserId: study.assignedDoctorId,
      metadata: {
        waitingMinutes: row.waitingMinutes,
        status: study.status,
        stationAeTitle: row.stationAeTitle,
      },
    });
  });

  nodes.forEach(node => {
    const status = cleanText(node.lastEchoStatus).toUpperCase();
    if (!status || ["OK", "SUCCESS", "ONLINE", "UP"].includes(status)) return;
    candidates.push({
      alertType: "DICOM_NODE_DOWN",
      severity: "critical",
      title: `DICOM node bất thường: ${node.name}`,
      message: node.lastEchoMessage || `C-ECHO status hiện tại: ${node.lastEchoStatus}`,
      entityType: "DICOM_NODE",
      entityId: node.id,
      ruleKey: `DICOM_NODE_DOWN:${node.id}`,
      dicomNodeId: node.id,
      metadata: {
        aeTitle: node.aeTitle,
        modality: node.modality,
        lastEchoStatus: node.lastEchoStatus,
        lastEchoAt: node.lastEchoAt?.toISOString() || null,
      },
    });
  });

  for (const candidate of candidates) {
    await upsertOperationalAlert(candidate);
  }

  const activeRuleKeys = Array.from(new Set(candidates.map(candidate => candidate.ruleKey)));
  const staleWhere: any = {
    alertType: { in: managedAlertTypes },
    status: { in: ["OPEN", "ACKNOWLEDGED"] },
  };
  if (activeRuleKeys.length) {
    staleWhere.ruleKey = { notIn: activeRuleKeys };
  }

  await prisma.operationalAlert.updateMany({
    where: staleWhere,
    data: {
      status: "RESOLVED",
      resolvedAt: now,
      resolvedByUserId: null,
    },
  });
}

async function getOrthancStorage(): Promise<StatisticsStorage> {
  try {
    const [data, snapshots] = await Promise.all([
      orthancClient.getStatistics(),
      prisma.pacsHealthSnapshot.findMany({
        where: { nodeId: null, orthancOnline: true },
        orderBy: { createdAt: "desc" },
        take: 14,
      }),
    ]);
    const diskSizeMb = Number(data.TotalDiskSizeMB || 0);
    const uncompressedSizeMb = Number(data.TotalUncompressedSizeMB || 0);
    const newestSnapshot = snapshots[0] || null;
    const oldestSnapshot = snapshots[snapshots.length - 1] || null;
    const daysBetweenSnapshots =
      newestSnapshot && oldestSnapshot
        ? Math.max(0, (newestSnapshot.createdAt.getTime() - oldestSnapshot.createdAt.getTime()) / 86400000)
        : 0;
    const historicalGrowth =
      daysBetweenSnapshots > 0.05 && newestSnapshot && oldestSnapshot
        ? (newestSnapshot.storageDiskSizeMb - oldestSnapshot.storageDiskSizeMb) / daysBetweenSnapshots
        : null;
    const currentGrowth =
      oldestSnapshot && (Date.now() - oldestSnapshot.createdAt.getTime()) > 3600000
        ? (diskSizeMb - oldestSnapshot.storageDiskSizeMb) / Math.max(1 / 24, (Date.now() - oldestSnapshot.createdAt.getTime()) / 86400000)
        : null;
    const growthMbPerDay = clampPositive(Math.round(currentGrowth || historicalGrowth || 0));
    const capacityMb = storageCapacityMb();
    const forecastDays =
      capacityMb && growthMbPerDay
        ? Math.max(0, Math.round((capacityMb - diskSizeMb) / growthMbPerDay))
        : null;
    const forecastLevel = warningLevelFromForecast(forecastDays);
    const warningLevel =
      forecastLevel !== "unknown" ? forecastLevel :
      diskSizeMb >= 102400 ? "critical" :
      diskSizeMb >= 51200 ? "warning" :
      "normal";

    return {
      available: true,
      patients: Number(data.CountPatients || 0),
      studies: Number(data.CountStudies || 0),
      series: Number(data.CountSeries || 0),
      instances: Number(data.CountInstances || 0),
      diskSizeMb,
      uncompressedSizeMb,
      growthMbPerDay,
      forecastDays,
      latestSnapshotAt: newestSnapshot?.createdAt.toISOString() || null,
      warningLevel,
      message: "Dung lượng PACS từ Orthanc statistics. Chưa bao gồm free disk của host.",
    };
  } catch (error: any) {
    return {
      available: false,
      patients: 0,
      studies: 0,
      series: 0,
      instances: 0,
      diskSizeMb: 0,
      uncompressedSizeMb: 0,
      growthMbPerDay: null,
      forecastDays: null,
      latestSnapshotAt: null,
      warningLevel: "unknown",
      message: `Không đọc được Orthanc statistics: ${error?.message || "unknown error"}`,
    };
  }
}

function studyHref(study: any) {
  return study.studyInstanceUid ? `/report/${encodeURIComponent(study.studyInstanceUid)}` : "/worklist";
}

function serializeMetadataIssueStudy(study: any, issue: string): StatisticsPacsMetadataIssueRow {
  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid || "",
    patientName: formatPatientName(study.patientName),
    patientId: study.patientId || "-",
    accessionNumber: study.accessionNumber || "-",
    modality: study.modality || "-",
    stationAeTitle: stationOf(study),
    issue,
    href: studyHref(study),
  };
}

function serializeQualityStudy(study: any, status: string, reason: string, createdAt?: Date | null): StatisticsQualityStudyRow {
  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid || "",
    patientName: formatPatientName(study.patientName),
    patientId: study.patientId || "-",
    accessionNumber: study.accessionNumber || "-",
    modality: study.modality || "-",
    stationAeTitle: stationOf(study),
    status,
    reason,
    createdAt: optionalIso(createdAt || study.updatedAt || study.createdAt),
    href: studyHref(study),
  };
}

function nodeWarningLevel(node: any, lastStudyAt: Date | null): "normal" | "warning" | "critical" | "unknown" {
  if (!cleanText(node.lastEchoStatus)) return "unknown";
  if (!isHealthyStatus(node.lastEchoStatus)) return "critical";
  const minutesSinceEcho = minutesBetween(node.lastEchoAt, new Date());
  if (minutesSinceEcho !== null && minutesSinceEcho >= NODE_ECHO_CRITICAL_MINUTES) return "critical";
  if (minutesSinceEcho !== null && minutesSinceEcho >= NODE_ECHO_WARNING_MINUTES) return "warning";
  if (!lastStudyAt) return "unknown";
  return "normal";
}

async function runDicomEchoHealthChecks(nodes: any[]) {
  return Promise.all(nodes.map(async node => {
    const checkedAt = new Date();
    try {
      await orthancClient.pingModality(node.orthancAlias);
      return prisma.dicomNode.update({
        where: { id: node.id },
        data: {
          lastEchoStatus: "OK",
          lastEchoMessage: "C-ECHO OK",
          lastEchoAt: checkedAt,
        },
      });
    } catch (error: any) {
      return prisma.dicomNode.update({
        where: { id: node.id },
        data: {
          lastEchoStatus: "FAIL",
          lastEchoMessage: error?.message || "C-ECHO failed",
          lastEchoAt: checkedAt,
        },
      });
    }
  }));
}

async function writePacsHealthSnapshots(params: {
  storage: StatisticsStorage;
  system: StatisticsPacsHealth["system"];
  nodes: StatisticsPacsNodeHealthRow[];
  missingMetadataCount: number;
  duplicateAccessionCount: number;
}) {
  const latest = await prisma.pacsHealthSnapshot.findFirst({
    where: { nodeId: null },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < 5 * 60000) return;

  const capacityMb = storageCapacityMb();
  const storageFreeMb = capacityMb ? Math.max(0, capacityMb - params.storage.diskSizeMb) : null;
  const metadataJson = JSON.stringify({
    message: params.system.message,
    warningLevel: params.storage.warningLevel,
  });

  await prisma.pacsHealthSnapshot.create({
    data: {
      orthancOnline: params.system.orthancOnline,
      orthancVersion: params.system.version,
      dicomReceiveStatus: params.system.orthancOnline ? "ONLINE" : "OFFLINE",
      patients: params.storage.patients,
      studies: params.storage.studies,
      series: params.storage.series,
      instances: params.storage.instances,
      storageDiskSizeMb: params.storage.diskSizeMb,
      storageUncompressedMb: params.storage.uncompressedSizeMb,
      storageFreeMb,
      storageGrowthMbPerDay: params.storage.growthMbPerDay,
      storageForecastDays: params.storage.forecastDays,
      missingMetadataCount: params.missingMetadataCount,
      duplicateAccessionCount: params.duplicateAccessionCount,
      metadataJson,
    },
  });

  if (params.nodes.length) {
    await prisma.pacsHealthSnapshot.createMany({
      data: params.nodes.map(node => ({
        orthancOnline: params.system.orthancOnline,
        dicomReceiveStatus: node.warningLevel === "critical" ? "NODE_DOWN" : "ONLINE",
        nodeId: node.id,
        nodeEchoStatus: node.echoStatus,
        nodeEchoMessage: node.echoMessage,
        lastStudyReceivedAt: node.lastStudyReceivedAt ? new Date(node.lastStudyReceivedAt) : null,
        metadataJson: JSON.stringify({
          aeTitle: node.aeTitle,
          modality: node.modality,
          room: node.room,
          warningLevel: node.warningLevel,
        }),
      })),
    });
  }
}

async function getPacsHealthDashboard(start: Date, endExclusive: Date, storage: StatisticsStorage): Promise<StatisticsPacsHealth> {
  const now = new Date();
  const [systemResult, activeNodes, receivedStudies, metadataStudies] = await Promise.all([
    orthancClient.getSystem()
      .then(system => ({
        orthancOnline: true,
        version: system.Version || "-",
        dicomAet: system.DicomAet || "-",
        dicomPort: typeof system.DicomPort === "number" ? system.DicomPort : null,
        message: "Orthanc API online",
      }))
      .catch((error: any) => ({
        orthancOnline: false,
        version: "-",
        dicomAet: "-",
        dicomPort: null,
        message: error?.message || "Orthanc API offline",
      })),
    prisma.dicomNode.findMany({
      where: { isActive: true },
      orderBy: [{ modality: "asc" }, { name: "asc" }],
      take: 50,
    }),
    prisma.imagingStudy.findMany({
      where: { receivedAt: { not: null } },
      select: {
        id: true,
        studyInstanceUid: true,
        patientName: true,
        patientId: true,
        accessionNumber: true,
        modality: true,
        stationAeTitle: true,
        receivedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { receivedAt: "desc" },
      take: 1000,
    }),
    prisma.imagingStudy.findMany({
      where: studyDateWhere(start, endExclusive),
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
  ]);

  const checkedNodes = await runDicomEchoHealthChecks(activeNodes);
  const lastByStation = new Map<string, Date>();
  const receivedByModality = new Map<string, StatisticsPacsLastReceivedRow>();

  receivedStudies.forEach(study => {
    const station = stationOf(study);
    const modality = study.modality || "UNKNOWN";
    const receivedAt = study.receivedAt || null;
    if (!receivedAt) return;

    if (station !== "-" && (!lastByStation.has(station) || lastByStation.get(station)!.getTime() < receivedAt.getTime())) {
      lastByStation.set(station, receivedAt);
    }

    const key = `${modality}::${station}`;
    const existing = receivedByModality.get(key);
    const inRange = receivedAt >= start && receivedAt < endExclusive;
    if (!existing) {
      receivedByModality.set(key, {
        modality,
        stationAeTitle: station,
        studyCount: inRange ? 1 : 0,
        lastReceivedAt: receivedAt.toISOString(),
        minutesSinceLastStudy: minutesBetween(receivedAt, now),
        warningLevel: "normal",
      });
    } else {
      if (inRange) existing.studyCount += 1;
      if (!existing.lastReceivedAt || new Date(existing.lastReceivedAt).getTime() < receivedAt.getTime()) {
        existing.lastReceivedAt = receivedAt.toISOString();
        existing.minutesSinceLastStudy = minutesBetween(receivedAt, now);
      }
    }
  });

  const lastReceivedByModality = Array.from(receivedByModality.values())
    .map(row => ({
      ...row,
      warningLevel:
        row.minutesSinceLastStudy === null ? "unknown" :
        row.minutesSinceLastStudy >= MODALITY_IDLE_WARNING_MINUTES ? "warning" :
        "normal" as StatisticsPacsLastReceivedRow["warningLevel"],
    }))
    .sort((a, b) => (b.lastReceivedAt || "").localeCompare(a.lastReceivedAt || ""))
    .slice(0, 12);

  const nodes: StatisticsPacsNodeHealthRow[] = checkedNodes.map(node => {
    const lastStudyAt = lastByStation.get(node.aeTitle) || null;
    const minutesSinceLastEcho = minutesBetween(node.lastEchoAt, now);
    const minutesSinceLastStudy = minutesBetween(lastStudyAt, now);
    return {
      id: node.id,
      name: node.name,
      aeTitle: node.aeTitle,
      modality: node.modality || "-",
      room: node.room || "-",
      orthancAlias: node.orthancAlias,
      echoStatus: node.lastEchoStatus || "UNKNOWN",
      echoMessage: node.lastEchoMessage || "-",
      lastEchoAt: optionalIso(node.lastEchoAt),
      minutesSinceLastEcho,
      lastStudyReceivedAt: optionalIso(lastStudyAt),
      minutesSinceLastStudy,
      warningLevel: nodeWarningLevel(node, lastStudyAt),
    };
  });

  let missingPatientId = 0;
  let missingAccession = 0;
  let missingModality = 0;
  const metadataIssueRows: StatisticsPacsMetadataIssueRow[] = [];
  const accessionMap = new Map<string, any[]>();

  metadataStudies.forEach(study => {
    const issues: string[] = [];
    if (!cleanText(study.patientId)) {
      missingPatientId += 1;
      issues.push("Missing PID");
    }
    if (!cleanText(study.accessionNumber)) {
      missingAccession += 1;
      issues.push("Missing accession");
    }
    if (!cleanText(study.modality)) {
      missingModality += 1;
      issues.push("Missing modality");
    }

    if (issues.length && metadataIssueRows.length < 20) {
      metadataIssueRows.push(serializeMetadataIssueStudy(study, issues.join(", ")));
    }

    const accession = cleanText(study.accessionNumber);
    if (accession) {
      const rows = accessionMap.get(accession) || [];
      rows.push(study);
      accessionMap.set(accession, rows);
    }
  });

  const duplicateRows: StatisticsPacsDuplicateAccessionRow[] = Array.from(accessionMap.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([accessionNumber, rows]) => ({
      accessionNumber,
      count: rows.length,
      patientNames: Array.from(new Set(rows.map(row => formatPatientName(row.patientName)))).slice(0, 3).join(", "),
      modalities: Array.from(new Set(rows.map(row => row.modality || "UNKNOWN"))).join(", "),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const metadataIssueCount = missingPatientId + missingAccession + missingModality;
  await writePacsHealthSnapshots({
    storage,
    system: systemResult,
    nodes,
    missingMetadataCount: metadataIssueCount,
    duplicateAccessionCount: duplicateRows.length,
  });

  return {
    system: systemResult,
    nodes,
    lastReceivedByModality,
    metadataIssues: {
      missingPatientId,
      missingAccession,
      missingModality,
      duplicateAccessions: duplicateRows.length,
      rows: metadataIssueRows,
      duplicateRows,
    },
    storageForecast: {
      growthMbPerDay: storage.growthMbPerDay,
      forecastDays: storage.forecastDays,
      warningLevel: storage.warningLevel,
    },
  };
}

function isRejectedQcStatus(status?: string | null) {
  const value = cleanText(status).toUpperCase();
  return value.includes("REJECT") || value.includes("FAIL");
}

function qualityReasonLabel(value?: string | null) {
  return cleanText(value) || "NO_REASON";
}

function doseThreshold(metricType?: string | null) {
  const key = normalizeBucket(metricType);
  return DOSE_THRESHOLDS[key] ?? null;
}

async function getQualitySafetyDashboard(start: Date, endExclusive: Date): Promise<StatisticsQualitySafety> {
  const [studies, qcEvents, criticalResults, criticalPending, addenda, finalizedStudies, finalizedReports, doseObservations] = await Promise.all([
    prisma.imagingStudy.findMany({
      where: studyDateWhere(start, endExclusive),
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    prisma.studyQcEvent.findMany({
      where: { createdAt: rangeFilter(start, endExclusive) },
      include: { imagingStudy: { include: { order: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.criticalResult.findMany({
      where: {
        OR: [
          { createdAt: rangeFilter(start, endExclusive) },
          { communicationStatus: { notIn: ["COMMUNICATED", "RESOLVED", "CLOSED"] } },
        ],
      },
      include: { imagingStudy: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.criticalResult.count({
      where: { communicationStatus: { notIn: ["COMMUNICATED", "RESOLVED", "CLOSED"] } },
    }),
    prisma.reportAddendum.findMany({
      where: { createdAt: rangeFilter(start, endExclusive) },
      include: {
        imagingStudy: true,
        report: { select: { doctorId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    prisma.imagingStudy.findMany({
      where: { finalizedAt: rangeFilter(start, endExclusive) },
      include: { reports: { select: { doctorId: true } } },
      take: 1000,
    }),
    prisma.report.findMany({
      where: reportFinalWhere(start, endExclusive),
      select: { doctorId: true, imagingStudy: { select: { modality: true } } },
      take: 1000,
    }),
    prisma.doseObservation.findMany({
      where: { createdAt: rangeFilter(start, endExclusive) },
      include: { imagingStudy: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const totalStudies = studies.length;
  const rejectedStudyIds = new Set<string>();
  const reasonCounts = new Map<string, number>();
  const qcRecent: StatisticsQualityStudyRow[] = [];

  qcEvents.forEach(event => {
    if (!isRejectedQcStatus(event.status)) return;
    rejectedStudyIds.add(event.imagingStudyId);
    const reason = qualityReasonLabel(event.reasonCode || event.note);
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    if (event.imagingStudy && qcRecent.length < 12) {
      qcRecent.push(serializeQualityStudy(event.imagingStudy, event.status, reason, event.createdAt));
    }
  });

  studies
    .filter(study => study.status === "QC_REJECTED")
    .forEach(study => {
      if (!rejectedStudyIds.has(study.id)) {
        rejectedStudyIds.add(study.id);
        const reason = "LEGACY_NO_REASON";
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        if (qcRecent.length < 12) {
          qcRecent.push(serializeQualityStudy(study, "QC_REJECTED", reason, study.updatedAt));
        }
      }
    });

  const missingCriticalDataRows = studies
    .map(study => {
      const issues: string[] = [];
      if (!cleanText(study.patientId)) issues.push("Missing PID");
      if (!cleanText(study.accessionNumber)) issues.push("Missing accession");
      if (!cleanText(study.modality)) issues.push("Missing modality");
      if (study.order && !study.order.dob) issues.push("Missing DOB");
      if (study.order && !cleanText(study.order.gender)) issues.push("Missing sex");
      return issues.length ? serializeQualityStudy(study, study.status, issues.join(", "), study.updatedAt) : null;
    })
    .filter((row): row is StatisticsQualityStudyRow => Boolean(row))
    .slice(0, 20);

  const qcReasons: StatisticsQualityReasonRow[] = Array.from(reasonCounts.entries())
    .map(([key, count]) => ({
      key,
      label: key,
      count,
      percent: rate(count, rejectedStudyIds.size),
    }))
    .sort((a, b) => b.count - a.count);

  const criticalRows: StatisticsCriticalResultRow[] = criticalResults.map(result => ({
    id: result.id,
    studyInstanceUid: result.imagingStudy.studyInstanceUid || "",
    patientName: formatPatientName(result.imagingStudy.patientName),
    patientId: result.imagingStudy.patientId || "-",
    accessionNumber: result.imagingStudy.accessionNumber || "-",
    modality: result.imagingStudy.modality || "-",
    severity: result.severity,
    communicationStatus: result.communicationStatus,
    finding: result.finding,
    createdAt: result.createdAt.toISOString(),
    communicatedAt: optionalIso(result.communicatedAt),
    href: studyHref(result.imagingStudy),
  }));

  const doctorIds = Array.from(new Set(addenda.map(row => row.doctorId || row.report?.doctorId).filter(Boolean))) as string[];
  const doctors = doctorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, fullName: true, username: true },
      })
    : [];
  const doctorNames = new Map(doctors.map(doctor => [doctor.id, doctor.fullName || doctor.username]));
  const addendaByDoctor = new Map<string, number>();
  const finalByDoctor = new Map<string, number>();
  const addendaByModality = new Map<string, number>();
  const studiesByModality = new Map<string, number>();

  addenda.forEach(row => {
    const doctorId = row.doctorId || row.report?.doctorId || "UNKNOWN";
    addendaByDoctor.set(doctorId, (addendaByDoctor.get(doctorId) || 0) + 1);
    const modality = row.imagingStudy?.modality || "UNKNOWN";
    addendaByModality.set(modality, (addendaByModality.get(modality) || 0) + 1);
  });

  finalizedReports.forEach(report => {
    const doctorId = report.doctorId || "UNKNOWN";
    finalByDoctor.set(doctorId, (finalByDoctor.get(doctorId) || 0) + 1);
  });

  studies.forEach(study => {
    const modality = study.modality || "UNKNOWN";
    studiesByModality.set(modality, (studiesByModality.get(modality) || 0) + 1);
  });

  const addendumByDoctor: StatisticsQualityBreakdownRow[] = Array.from(addendaByDoctor.entries())
    .map(([doctorId, count]) => ({
      key: doctorId,
      label: doctorId === "UNKNOWN" ? "Unknown doctor" : doctorNames.get(doctorId) || "Unknown doctor",
      count,
      rate: rate(count, finalByDoctor.get(doctorId) || count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const addendumByModality: StatisticsQualityBreakdownRow[] = Array.from(addendaByModality.entries())
    .map(([modality, count]) => ({
      key: modality,
      label: modality,
      count,
      rate: rate(count, studiesByModality.get(modality) || count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const doseOutliers: StatisticsDoseOutlierRow[] = doseObservations
    .map(row => {
      const threshold = doseThreshold(row.metricType);
      if (threshold === null || row.value <= threshold) return null;
      return {
        id: row.id,
        studyInstanceUid: row.imagingStudy.studyInstanceUid || "",
        patientName: formatPatientName(row.imagingStudy.patientName),
        patientId: row.imagingStudy.patientId || "-",
        accessionNumber: row.imagingStudy.accessionNumber || "-",
        modality: row.imagingStudy.modality || "-",
        metricType: row.metricType,
        value: row.value,
        unit: row.unit || "",
        threshold,
        createdAt: row.createdAt.toISOString(),
        href: studyHref(row.imagingStudy),
      };
    })
    .filter((row): row is StatisticsDoseOutlierRow => Boolean(row))
    .slice(0, 20);

  return {
    kpis: {
      qcEvents: qcEvents.length,
      qcRejected: rejectedStudyIds.size,
      qcRejectRate: rate(rejectedStudyIds.size, totalStudies),
      repeatStudyRate: rate(rejectedStudyIds.size, totalStudies),
      missingCriticalData: missingCriticalDataRows.length,
      criticalPending,
      addendumCount: addenda.length,
      addendumRate: rate(addenda.length, finalizedStudies.length),
      doseOutliers: doseOutliers.length,
    },
    qcReasons,
    qcRecent,
    missingCriticalDataRows,
    criticalResults: criticalRows,
    doseOutliers,
    addendumByDoctor,
    addendumByModality,
  };
}

function orderEstimatedRevenue(order: any, catalogByCode: Map<string, any>) {
  const direct = decimalToNumber(order.price);
  if (direct !== null) return direct;
  const code = normalizeBucket(order.procedureCode, "");
  if (!code) return null;
  return decimalToNumber(catalogByCode.get(code)?.defaultPrice);
}

function addBusinessRow(
  map: Map<string, StatisticsBusinessBreakdownRow>,
  keyInput: string | null | undefined,
  labelInput: string | null | undefined,
  total: number,
  order: any,
  revenue: number | null,
  now: Date,
) {
  const key = normalizeBucket(keyInput);
  const row = map.get(key) || {
    key,
    label: displayBucket(labelInput || keyInput),
    count: 0,
    percent: 0,
    cancelled: 0,
    noShow: 0,
    estimatedRevenue: null,
  };
  row.count += 1;
  row.percent = rate(row.count, total);
  if (order.cancelledAt || order.orderStatus === "CANCELLED") row.cancelled += 1;
  const hasStudy = Boolean(order.imagingStudies?.length);
  const isNoShow =
    !hasStudy &&
    !order.arrivedAt &&
    !order.cancelledAt &&
    order.scheduledDate < now &&
    ["REQUESTED", "SCHEDULED"].includes(String(order.orderStatus));
  if (isNoShow) row.noShow += 1;
  if (revenue !== null) row.estimatedRevenue = (row.estimatedRevenue || 0) + revenue;
  map.set(key, row);
}

async function getBusinessAnalytics(start: Date, endExclusive: Date): Promise<StatisticsBusinessAnalytics> {
  const now = new Date();
  const [orders, studies, catalogs] = await Promise.all([
    prisma.worklistOrder.findMany({
      where: { scheduledDate: rangeFilter(start, endExclusive) },
      include: {
        imagingStudies: {
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { scheduledDate: "asc" },
      take: 2000,
    }),
    prisma.imagingStudy.findMany({
      where: studyDateWhere(start, endExclusive),
      select: {
        id: true,
        modality: true,
        order: {
          select: {
            modality: true,
            sourceFacility: true,
            referringPhysician: true,
            referringDepartment: true,
            procedureCode: true,
            procedureDescription: true,
            price: true,
          },
        },
        createdAt: true,
      },
      take: 2000,
    }),
    prisma.procedureCatalog.findMany({
      where: { isActive: true },
      take: 1000,
    }),
  ]);

  const catalogByCode = new Map(catalogs.map(catalog => [normalizeBucket(catalog.code, ""), catalog]));
  const byReferringPhysician = new Map<string, StatisticsBusinessBreakdownRow>();
  const byDepartment = new Map<string, StatisticsBusinessBreakdownRow>();
  const bySourceFacility = new Map<string, StatisticsBusinessBreakdownRow>();
  const modalityMix = new Map<string, StatisticsBusinessBreakdownRow>();
  const procedureMix = new Map<string, StatisticsProcedureMixRow>();
  const daily = new Map<string, StatisticsBusinessTrendRow>();
  const totalOrders = orders.length;
  let totalRevenue: number | null = null;
  let noShow = 0;
  let cancelled = 0;

  dateKeysInRange(start, endExclusive).forEach(date => {
    daily.set(date, { date, studyCount: 0, orderCount: 0, estimatedRevenue: null });
  });

  orders.forEach(order => {
    const revenue = orderEstimatedRevenue(order, catalogByCode);
    if (revenue !== null) totalRevenue = (totalRevenue || 0) + revenue;
    if (order.cancelledAt || order.orderStatus === "CANCELLED") cancelled += 1;
    const hasStudy = Boolean(order.imagingStudies?.length);
    const isNoShow =
      !hasStudy &&
      !order.arrivedAt &&
      !order.cancelledAt &&
      order.scheduledDate < now &&
      ["REQUESTED", "SCHEDULED"].includes(String(order.orderStatus));
    if (isNoShow) noShow += 1;

    addBusinessRow(byReferringPhysician, order.referringPhysician, order.referringPhysician, totalOrders, order, revenue, now);
    addBusinessRow(byDepartment, order.referringDepartment, order.referringDepartment, totalOrders, order, revenue, now);
    addBusinessRow(bySourceFacility, order.sourceFacility, order.sourceFacility, totalOrders, order, revenue, now);
    addBusinessRow(modalityMix, order.modality, order.modality, totalOrders, order, revenue, now);

    const procedureKey = normalizeBucket(order.procedureCode || order.procedureDescription);
    const catalog = order.procedureCode ? catalogByCode.get(normalizeBucket(order.procedureCode, "")) : null;
    const procedureRow = procedureMix.get(procedureKey) || {
      code: cleanText(order.procedureCode) || "-",
      label: catalog?.name || displayBucket(order.procedureDescription || order.procedureCode, "Unknown procedure"),
      modality: order.modality || catalog?.modality || "-",
      count: 0,
      percent: 0,
      estimatedRevenue: null,
    };
    procedureRow.count += 1;
    procedureRow.percent = rate(procedureRow.count, totalOrders);
    if (revenue !== null) procedureRow.estimatedRevenue = (procedureRow.estimatedRevenue || 0) + revenue;
    procedureMix.set(procedureKey, procedureRow);

    const key = vietnamDateKey(order.scheduledDate);
    const trend = daily.get(key);
    if (trend) {
      trend.orderCount += 1;
      if (revenue !== null) trend.estimatedRevenue = (trend.estimatedRevenue || 0) + revenue;
    }
  });

  studies.forEach(study => {
    const key = vietnamDateKey(study.createdAt);
    const trend = daily.get(key);
    if (trend) trend.studyCount += 1;
  });

  const sortBreakdown = (rows: Iterable<StatisticsBusinessBreakdownRow>) =>
    Array.from(rows)
      .map(row => ({ ...row, percent: rate(row.count, totalOrders) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

  return {
    kpis: {
      ordersInPeriod: orders.length,
      studiesInPeriod: studies.length,
      referringSources: byReferringPhysician.size,
      departments: byDepartment.size,
      noShow,
      cancelled,
      estimatedRevenue: totalRevenue,
    },
    byReferringPhysician: sortBreakdown(byReferringPhysician.values()),
    byDepartment: sortBreakdown(byDepartment.values()),
    bySourceFacility: sortBreakdown(bySourceFacility.values()),
    modalityMix: sortBreakdown(modalityMix.values()),
    procedureMix: Array.from(procedureMix.values())
      .map(row => ({ ...row, percent: rate(row.count, totalOrders) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    dailyTrend: Array.from(daily.values()),
  };
}

function serializeDrilldownStudy(study: any): StatisticsDrilldownRow {
  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid || "",
    patientName: formatPatientName(study.patientName),
    patientId: study.patientId || "-",
    accessionNumber: study.accessionNumber || "-",
    modality: study.modality || study.order?.modality || "-",
    status: study.status,
    statusLabel: statusLabels[study.status] || study.status,
    priority: priorityOf(study),
    stationAeTitle: stationOf(study),
    referringPhysician: displayBucket(study.order?.referringPhysician, "-"),
    sourceFacility: displayBucket(study.order?.sourceFacility, "-"),
    procedureCode: cleanText(study.order?.procedureCode) || "-",
    procedureDescription: displayBucket(study.order?.procedureDescription || study.studyDescription, "-"),
    scheduledAt: optionalIso(study.scheduledAt || study.order?.scheduledDate),
    receivedAt: optionalIso(study.receivedAt),
    finalizedAt: optionalIso(study.finalizedAt),
    href: studyHref(study),
  };
}

function drilldownTitle(filter?: string, value?: string) {
  const label = displayBucket(value, "");
  switch (filter) {
    case "readyToRead": return "Ca chờ đọc";
    case "reading": return "Ca đang đọc / nháp";
    case "finalized": return "Ca đã ký trong kỳ";
    case "delivered": return "Ca đã trả trong kỳ";
    case "qcIssues": return "Ca QC / lỗi";
    case "slaBreaches": return "Ca quá SLA";
    case "stuckWorkflow": return "Ca kẹt workflow";
    case "modality": return `Ca modality ${label}`;
    case "status": return `Ca trạng thái ${label}`;
    case "priority": return `Ca priority ${label}`;
    case "doctor": return `Ca của bác sĩ ${label}`;
    case "referringPhysician": return `Nguồn gửi ${label}`;
    case "department": return `Khoa/phòng ${label}`;
    case "sourceFacility": return `Cơ sở/đối tác ${label}`;
    case "procedure": return `Dịch vụ ${label}`;
    default: return "Tất cả ca trong kỳ";
  }
}

function buildDrilldownWhere(start: Date, endExclusive: Date, filters: StatisticsFilters) {
  const filter = filters.drilldown || "all";
  const value = cleanText(filters.drilldownValue);
  const where: any = studyDateWhere(start, endExclusive);

  if (filter === "readyToRead") where.status = "READY_TO_READ";
  if (filter === "reading") where.status = { in: ["READING", "REPORTED"] as any[] };
  if (filter === "finalized") {
    delete where.OR;
    where.finalizedAt = rangeFilter(start, endExclusive);
  }
  if (filter === "delivered") {
    delete where.OR;
    where.deliveredAt = rangeFilter(start, endExclusive);
  }
  if (filter === "qcIssues") where.status = { in: ["NEEDS_QC", "QC_REJECTED", "ERROR"] as any[] };
  if (filter === "modality" && value) where.modality = value;
  if (filter === "status" && value) where.status = value;
  if (filter === "priority" && value) {
    const dateOr = where.OR;
    delete where.OR;
    where.AND = [
      { OR: dateOr },
      {
        OR: [
          { priority: value },
          { order: { is: { priority: value } } },
        ],
      },
    ];
  }
  if (filter === "doctor" && value) {
    where.assignedDoctorId = value;
  }
  if (filter === "referringPhysician" && value) {
    where.order = { is: { referringPhysician: { equals: value, mode: "insensitive" } } };
  }
  if (filter === "department" && value) {
    where.order = { is: { referringDepartment: { equals: value, mode: "insensitive" } } };
  }
  if (filter === "sourceFacility" && value) {
    where.order = { is: { sourceFacility: { equals: value, mode: "insensitive" } } };
  }
  if (filter === "procedure" && value) {
    where.order = {
      is: {
        OR: [
          { procedureCode: { equals: value, mode: "insensitive" } },
          { procedureDescription: { equals: value, mode: "insensitive" } },
        ],
      },
    };
  }

  return where;
}

async function getDrilldownDashboard(start: Date, endExclusive: Date, filters: StatisticsFilters): Promise<StatisticsDrilldown> {
  const activeFilter = filters.drilldown || "all";
  const activeValue = cleanText(filters.drilldownValue);
  const computedFilter = ["slaBreaches", "stuckWorkflow"].includes(activeFilter);
  const where = computedFilter
    ? {
        status: { in: ["ORDERED", "READY_FOR_SCAN", "RECEIVED", "STABLE", "NEEDS_QC", "READY_TO_READ", "READING", "FINALIZED"] as any[] },
      }
    : buildDrilldownWhere(start, endExclusive, filters);

  const studies = await prisma.imagingStudy.findMany({
    where,
    include: { order: true },
    orderBy: [
      { receivedAt: "desc" },
      { scheduledAt: "desc" },
      { createdAt: "desc" },
    ],
    take: computedFilter ? 500 : 150,
  });

  const filtered = computedFilter
    ? studies
        .filter(study => {
          if (activeFilter === "slaBreaches") {
            const row = serializeOperationStudyRow(study, "");
            return ["READY_TO_READ", "READING"].includes(study.status) && row.waitingMinutes >= slaThresholdForPriority(row.priority);
          }
          return Boolean(stuckReason(study));
        })
        .slice(0, 150)
    : studies;

  const rows = filtered.map(serializeDrilldownStudy);
  return {
    activeFilter,
    activeValue,
    title: drilldownTitle(activeFilter, activeValue),
    rows,
    total: rows.length,
    csvUrl: "",
  };
}

async function getFilterPresets(user: any): Promise<StatisticsFilterPreset[]> {
  const presets = await prisma.dashboardFilterPreset.findMany({
    where: {
      dashboard: "statistics",
      OR: [
        { userId: user.id },
        { isShared: true },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return presets.map(preset => ({
    id: preset.id,
    name: preset.name,
    filters: JSON.parse(preset.filtersJson || "{}"),
    isShared: preset.isShared,
    createdAt: preset.createdAt.toISOString(),
  }));
}

function exportRows(rows: StatisticsDrilldownRow[], includeSensitive: boolean) {
  const header = [
    "Patient Name",
    "Patient ID",
    "Accession",
    "Modality",
    "Status",
    "Priority",
    "Station",
    "Referring Physician",
    "Source Facility",
    "Procedure Code",
    "Procedure",
    "Scheduled At",
    "Received At",
    "Finalized At",
    "URL",
  ];
  const body = rows.map(row => [
    includeSensitive ? row.patientName : "",
    includeSensitive ? row.patientId : "",
    includeSensitive ? row.accessionNumber : "",
    row.modality,
    row.statusLabel,
    row.priority,
    row.stationAeTitle,
    row.referringPhysician,
    row.sourceFacility,
    row.procedureCode,
    row.procedureDescription,
    row.scheduledAt || "",
    row.receivedAt || "",
    row.finalizedAt || "",
    row.href,
  ]);
  return [header, ...body];
}

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function crc32(buffer: Buffer) {
  const table = Array.from({ length: 256 }, (_, index) => {
    let c = index;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = table[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function zipStore(files: Array<{ name: string; data: string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  files.forEach(file => {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.from(file.data, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function rowsToXlsxBase64(rows: string[][]) {
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const col = String.fromCharCode(65 + colIndex);
      return `<c r="${col}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  const files = [
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Drilldown" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
    },
  ];

  return zipStore(files).toString("base64");
}

async function getAverageTurnaround(start: Date, endExclusive: Date) {
  const studies = await prisma.imagingStudy.findMany({
    where: {
      finalizedAt: rangeFilter(start, endExclusive),
    },
    select: {
      receivedAt: true,
      finalizedAt: true,
      statusHistory: {
        where: { toStatus: { in: ["RECEIVED", "FINALIZED"] } },
        orderBy: { createdAt: "asc" },
        select: {
          toStatus: true,
          createdAt: true,
        },
      },
    },
    take: 500,
  });

  const values = studies
    .map(study => {
      const receivedHistory = study.statusHistory.find(history => history.toStatus === "RECEIVED")?.createdAt;
      const finalizedHistory = study.statusHistory.find(history => history.toStatus === "FINALIZED")?.createdAt;
      return minutesBetween(receivedHistory || study.receivedAt, finalizedHistory || study.finalizedAt);
    })
    .filter((value): value is number => typeof value === "number");

  return average(values);
}

async function getDoctorRows(start: Date, endExclusive: Date, role: string, userId: string, permissions?: string[], baseRole?: string): Promise<StatisticsDoctorRow[]> {
  if (!hasPermission(role, "statistics.doctorStats", permissions)) return [];

  const thisMonthInput = vietnamDateInput();
  const [year, month] = thisMonthInput.split("-").map(Number);
  const monthStart = new Date(`${year}-${pad2(month)}-01T00:00:00+07:00`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const doctorId = (baseRole || role) === "DOCTOR" ? userId : undefined;
  const [periodReports, monthReports, draftReports] = await Promise.all([
    prisma.report.groupBy({
      by: ["doctorId"],
      where: reportFinalWhere(start, endExclusive, doctorId),
      _count: { _all: true },
    }),
    prisma.report.groupBy({
      by: ["doctorId"],
      where: reportFinalWhere(monthStart, monthEnd, doctorId),
      _count: { _all: true },
    }),
    prisma.report.groupBy({
      by: ["doctorId"],
      where: {
        status: { in: ["DRAFT", "PENDING_APPROVAL"] as any[] },
        ...(doctorId ? { doctorId } : {}),
      },
      _count: { _all: true },
    }),
  ]);

  const ids = Array.from(new Set([
    ...periodReports.map(row => row.doctorId).filter(Boolean),
    ...monthReports.map(row => row.doctorId).filter(Boolean),
    ...draftReports.map(row => row.doctorId).filter(Boolean),
  ])) as string[];

  if (!ids.length) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, fullName: true, username: true },
  });
  const userNames = new Map(users.map(user => [user.id, user.fullName || user.username]));
  const periodMap = new Map(periodReports.filter(row => row.doctorId).map(row => [row.doctorId!, row._count._all]));
  const monthMap = new Map(monthReports.filter(row => row.doctorId).map(row => [row.doctorId!, row._count._all]));
  const draftMap = new Map(draftReports.filter(row => row.doctorId).map(row => [row.doctorId!, row._count._all]));

  return ids
    .map(id => ({
      doctorId: id,
      doctorName: userNames.get(id) || "Unknown doctor",
      finalInPeriod: periodMap.get(id) || 0,
      finalThisMonth: monthMap.get(id) || 0,
      draftCount: draftMap.get(id) || 0,
    }))
    .sort((a, b) => b.finalInPeriod - a.finalInPeriod || b.finalThisMonth - a.finalThisMonth);
}

async function getOperationsDashboard(start: Date, endExclusive: Date): Promise<StatisticsOperations> {
  const activeStatuses = ["ORDERED", "READY_FOR_SCAN", "RECEIVED", "STABLE", "NEEDS_QC", "READY_TO_READ", "READING", "FINALIZED"] as any[];

  const [
    scheduled,
    arrived,
    readyForScan,
    received,
    readyToRead,
    reading,
    finalized,
    delivered,
    liveQueueStudies,
    activeStudies,
    noStudyOrders,
  ] = await Promise.all([
    prisma.worklistOrder.count({
      where: {
        scheduledDate: rangeFilter(start, endExclusive),
        orderStatus: "SCHEDULED",
      },
    }),
    prisma.worklistOrder.count({
      where: {
        arrivedAt: rangeFilter(start, endExclusive),
      },
    }),
    prisma.imagingStudy.count({ where: { status: "READY_FOR_SCAN" } }),
    prisma.imagingStudy.count({ where: { receivedAt: rangeFilter(start, endExclusive) } }),
    prisma.imagingStudy.count({ where: { status: "READY_TO_READ" } }),
    prisma.imagingStudy.count({ where: { status: { in: ["READING", "REPORTED"] as any[] } } }),
    prisma.imagingStudy.count({ where: { finalizedAt: rangeFilter(start, endExclusive) } }),
    prisma.imagingStudy.count({ where: { deliveredAt: rangeFilter(start, endExclusive) } }),
    prisma.imagingStudy.findMany({
      where: { status: { in: ["READY_TO_READ", "READING"] as any[] } },
      include: { order: true },
      orderBy: [
        { receivedAt: "asc" },
        { stableAt: "asc" },
        { scheduledAt: "asc" },
        { createdAt: "asc" },
      ],
      take: 30,
    }),
    prisma.imagingStudy.findMany({
      where: { status: { in: activeStatuses } },
      include: { order: true },
      orderBy: [
        { receivedAt: "asc" },
        { stableAt: "asc" },
        { scheduledAt: "asc" },
        { createdAt: "asc" },
      ],
      take: 100,
    }),
    prisma.worklistOrder.findMany({
      where: {
        orderStatus: { in: ["SCHEDULED", "ARRIVED"] as any[] },
        imagingStudies: { none: {} },
        scheduledDate: { lt: endExclusive },
      },
      orderBy: [
        { arrivedAt: "asc" },
        { scheduledDate: "asc" },
        { createdAt: "asc" },
      ],
      take: 20,
    }),
  ]);

  const liveQueueRows = sortOperationRows(
    liveQueueStudies.map(study => serializeOperationStudyRow(study, "Đang chờ hoặc đang được bác sĩ đọc."))
  );

  const slaBreaches = sortOperationRows(
    liveQueueRows.filter(row => row.waitingMinutes >= slaThresholdForPriority(row.priority))
  ).slice(0, 12);

  const liveQueue = liveQueueRows.slice(0, 12);

  const studyStuckRows = activeStudies
    .map(study => {
      const reason = stuckReason(study);
      return reason ? serializeOperationStudyRow(study, reason) : null;
    })
    .filter((row): row is StatisticsOperationRow => Boolean(row));

  const orderStuckRows = noStudyOrders
    .map(serializeNoStudyOrderRow)
    .filter(row => row.waitingMinutes >= (row.status === "ARRIVED" ? 30 : 120));

  const stuckWorkflow = sortOperationRows([...studyStuckRows, ...orderStuckRows]).slice(0, 12);

  return {
    generatedAt: new Date().toISOString(),
    autoRefreshSeconds: AUTO_REFRESH_SECONDS,
    kpis: {
      scheduled,
      arrived,
      readyForScan,
      received,
      readyToRead,
      reading,
      finalized,
      delivered,
      slaBreaches: slaBreaches.length,
      stuckWorkflow: stuckWorkflow.length,
    },
    slaBreaches,
    stuckWorkflow,
    liveQueue,
  };
}

async function getPerformanceAnalytics(start: Date, endExclusive: Date): Promise<StatisticsPerformance> {
  const studies = await prisma.imagingStudy.findMany({
    where: {
      finalizedAt: rangeFilter(start, endExclusive),
    },
    include: { order: true },
    orderBy: { finalizedAt: "desc" },
    take: 1000,
  });

  const segmentDefinitions = [
    {
      key: "checkin_to_received",
      label: "Check-in -> nhận ảnh",
      targetMinutes: 120,
      startAt: (study: any) => study.checkedInAt || study.order?.arrivedAt || study.scheduledAt || study.createdAt,
      endAt: (study: any) => study.receivedAt,
    },
    {
      key: "received_to_ready",
      label: "Nhận ảnh -> sẵn sàng đọc",
      targetMinutes: 30,
      startAt: (study: any) => study.receivedAt,
      endAt: (study: any) => study.stableAt || study.qcCompletedAt,
    },
    {
      key: "received_to_first_open",
      label: "Nhận ảnh -> mở đọc đầu tiên",
      targetMinutes: 60,
      startAt: (study: any) => study.receivedAt || study.stableAt,
      endAt: (study: any) => study.firstOpenedAt,
    },
    {
      key: "first_open_to_final",
      label: "Mở đọc -> ký",
      targetMinutes: 120,
      startAt: (study: any) => study.firstOpenedAt,
      endAt: (study: any) => study.finalizedAt,
    },
    {
      key: "received_to_final",
      label: "Nhận ảnh -> ký",
      targetMinutes: null,
      startAt: (study: any) => study.receivedAt || study.stableAt,
      endAt: (study: any) => study.finalizedAt,
    },
    {
      key: "final_to_delivery",
      label: "Ký -> trả kết quả",
      targetMinutes: 120,
      startAt: (study: any) => study.finalizedAt,
      endAt: (study: any) => study.deliveredAt,
    },
  ];

  const segments = segmentDefinitions.map(definition => {
    const values = studies
      .map(study => minutesBetween(definition.startAt(study), definition.endAt(study)))
      .filter((value): value is number => typeof value === "number");
    return durationSummary(definition.key, definition.label, values, definition.targetMinutes);
  });

  const tatRows = studies
    .map(study => {
      const startAt = study.receivedAt || study.stableAt || study.scanEndedAt || study.scheduledAt || null;
      const finalizedAt = study.finalizedAt || null;
      const turnaroundMinutes = minutesBetween(startAt, finalizedAt);
      if (turnaroundMinutes === null) return null;
      const priority = priorityOf(study);
      return {
        study,
        priority,
        modality: study.modality || "UNKNOWN",
        finalizedAt,
        turnaroundMinutes,
        thresholdMinutes: slaThresholdForPriority(priority),
      };
    })
    .filter((row): row is {
      study: any;
      priority: string;
      modality: string;
      finalizedAt: Date;
      turnaroundMinutes: number;
      thresholdMinutes: number;
    } => Boolean(row));

  const dailyTrend: StatisticsTrendPoint[] = dateKeysInRange(start, endExclusive).map(date => {
    const rows = tatRows.filter(row => vietnamDateKey(row.finalizedAt) === date);
    const values = rows.map(row => row.turnaroundMinutes);
    const breachCount = rows.filter(row => row.turnaroundMinutes > row.thresholdMinutes).length;
    return {
      date,
      count: rows.length,
      averageTatMinutes: average(values),
      p90TatMinutes: percentile(values, 90),
      breachRate: rate(breachCount, rows.length),
    };
  });

  const modalityMap = new Map<string, typeof tatRows>();
  const priorityMap = new Map<string, typeof tatRows>();
  tatRows.forEach(row => {
    const modalityKey = row.modality || "UNKNOWN";
    const priorityKey = row.priority || "ROUTINE";
    modalityMap.set(modalityKey, [...(modalityMap.get(modalityKey) || []), row]);
    priorityMap.set(priorityKey, [...(priorityMap.get(priorityKey) || []), row]);
  });

  const modalityBreakdown = Array.from(modalityMap.entries())
    .map(([key, rows]) => breakdownRow(key, key, rows))
    .sort((a, b) => b.count - a.count || b.breachRate - a.breachRate)
    .slice(0, 8);

  const priorityBreakdown = Array.from(priorityMap.entries())
    .map(([key, rows]) => breakdownRow(key, key, rows))
    .sort((a, b) => (priorityRank[a.key] ?? 9) - (priorityRank[b.key] ?? 9));

  const outliers = tatRows
    .filter(row => row.turnaroundMinutes > row.thresholdMinutes)
    .sort((a, b) => (b.turnaroundMinutes - b.thresholdMinutes) - (a.turnaroundMinutes - a.thresholdMinutes))
    .slice(0, 12)
    .map(serializePerformanceOutlier);

  return {
    segments,
    dailyTrend,
    modalityBreakdown,
    priorityBreakdown,
    outliers,
  };
}

async function getUtilizationAnalytics(start: Date, endExclusive: Date): Promise<StatisticsUtilization> {
  const range = rangeFilter(start, endExclusive);
  const dateCount = Math.max(1, dateKeysInRange(start, endExclusive).length);
  const now = new Date();

  const [nodes, studies, orders] = await Promise.all([
    prisma.dicomNode.findMany({
      where: { isActive: true },
      select: {
        aeTitle: true,
        name: true,
        modality: true,
        room: true,
      },
      orderBy: [
        { modality: "asc" },
        { name: "asc" },
      ],
    }),
    prisma.imagingStudy.findMany({
      where: studyDateWhere(start, endExclusive),
      include: { order: true },
      orderBy: [
        { receivedAt: "desc" },
        { scheduledAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 1000,
    }),
    prisma.worklistOrder.findMany({
      where: {
        OR: [
          { scheduledDate: range },
          { arrivedAt: range },
          { cancelledAt: range },
        ],
      },
      select: {
        id: true,
        modality: true,
        scheduledStationAeTitle: true,
        scheduledStationName: true,
        scheduledDate: true,
        arrivedAt: true,
        cancelledAt: true,
        orderStatus: true,
        imagingStudies: { select: { id: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 1000,
    }),
  ]);

  const nodeMap = new Map(nodes.map(node => [node.aeTitle.toUpperCase(), node]));
  const rooms = new Map<string, StatisticsRoomUtilizationRow>();

  function stationKey(value?: string | null) {
    const key = cleanText(value).toUpperCase();
    return key && key !== "-" ? key : "UNKNOWN";
  }

  function getRoomRow(stationAeTitle?: string | null, fallback?: { roomName?: string | null; modality?: string | null }) {
    const key = stationKey(stationAeTitle);
    const node = nodeMap.get(key);
    const existing = rooms.get(key);
    if (existing) return existing;

    const row: StatisticsRoomUtilizationRow = {
      stationAeTitle: key,
      roomName: node?.room || node?.name || fallback?.roomName || key,
      modality: node?.modality || fallback?.modality || "-",
      studyCount: 0,
      scheduledCount: 0,
      finalizedCount: 0,
      qcRejectedCount: 0,
      noShowCount: 0,
      cancelledCount: 0,
      averageScanMinutes: null,
      estimatedBusyMinutes: 0,
      utilizationPercent: null,
      lastActivityAt: null,
    };
    rooms.set(key, row);
    return row;
  }

  nodes.forEach(node => getRoomRow(node.aeTitle, { roomName: node.room || node.name, modality: node.modality }));

  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    studyCount: 0,
    scheduledCount: 0,
    arrivedCount: 0,
    finalizedCount: 0,
    busyMinutes: 0,
  }));

  function isInRange(value?: Date | null) {
    return Boolean(value && value >= start && value < endExclusive);
  }

  function markActivity(row: StatisticsRoomUtilizationRow, value?: Date | null) {
    if (!value) return;
    if (!row.lastActivityAt || new Date(row.lastActivityAt).getTime() < value.getTime()) {
      row.lastActivityAt = value.toISOString();
    }
  }

  studies.forEach(study => {
    const station = stationOf(study);
    const room = getRoomRow(station, {
      roomName: study.order?.scheduledStationName,
      modality: study.modality || study.order?.modality,
    });
    const activityAt = operationDateForStudy(study);
    const busyMinutes = scanDurationMinutes(study);

    room.studyCount += 1;
    room.estimatedBusyMinutes += busyMinutes;
    if (isInRange(study.finalizedAt)) room.finalizedCount += 1;
    if (study.status === "QC_REJECTED") room.qcRejectedCount += 1;
    markActivity(room, activityAt);

    if (isInRange(activityAt)) {
      const hour = hourly[vietnamHour(activityAt)];
      hour.studyCount += 1;
      hour.busyMinutes += busyMinutes;
    }
    if (isInRange(study.finalizedAt)) {
      hourly[vietnamHour(study.finalizedAt)].finalizedCount += 1;
    }
  });

  orders.forEach(order => {
    const room = getRoomRow(order.scheduledStationAeTitle, {
      roomName: order.scheduledStationName,
      modality: order.modality,
    });
    const hasStudy = order.imagingStudies.length > 0;
    const isCancelled = Boolean(order.cancelledAt && isInRange(order.cancelledAt));
    const isNoShow =
      !hasStudy &&
      !order.arrivedAt &&
      !order.cancelledAt &&
      order.scheduledDate < now &&
      ["REQUESTED", "SCHEDULED"].includes(String(order.orderStatus));

    if (isInRange(order.scheduledDate)) {
      room.scheduledCount += 1;
      hourly[vietnamHour(order.scheduledDate)].scheduledCount += 1;
    }
    if (isInRange(order.arrivedAt)) {
      hourly[vietnamHour(order.arrivedAt)].arrivedCount += 1;
    }
    if (isCancelled) {
      room.cancelledCount += 1;
    }
    if (isNoShow) {
      room.noShowCount += 1;
    }
    markActivity(room, order.arrivedAt || order.scheduledDate);
  });

  const capacityPerRoom = ROOM_CAPACITY_MINUTES_PER_DAY * dateCount;
  const roomRows = Array.from(rooms.values()).map(row => ({
    ...row,
    averageScanMinutes: row.studyCount ? Math.round(row.estimatedBusyMinutes / row.studyCount) : null,
    utilizationPercent: capacityPerRoom ? Math.round((row.estimatedBusyMinutes / capacityPerRoom) * 100) : null,
  })).sort((a, b) => b.estimatedBusyMinutes - a.estimatedBusyMinutes || b.studyCount - a.studyCount);

  const activeRooms = Math.max(nodes.length, roomRows.filter(row => row.studyCount || row.scheduledCount).length);
  const estimatedBusyMinutes = roomRows.reduce((sum, row) => sum + row.estimatedBusyMinutes, 0);
  const totalCapacity = activeRooms * capacityPerRoom;
  const peakHour = [...hourly].sort((a, b) => b.studyCount - a.studyCount || b.busyMinutes - a.busyMinutes)[0];

  return {
    kpis: {
      totalStudies: studies.length,
      activeRooms,
      noShow: roomRows.reduce((sum, row) => sum + row.noShowCount, 0),
      cancelled: roomRows.reduce((sum, row) => sum + row.cancelledCount, 0),
      qcRejected: roomRows.reduce((sum, row) => sum + row.qcRejectedCount, 0),
      estimatedBusyMinutes,
      estimatedUtilizationPercent: totalCapacity ? Math.round((estimatedBusyMinutes / totalCapacity) * 100) : null,
      peakHour: peakHour?.studyCount ? peakHour.label : "-",
    },
    rooms: roomRows.slice(0, 12),
    hourly,
  };
}

function serializeWorkloadQueueRow(study: any, doctorNames: Map<string, string>): StatisticsWorkloadQueueRow {
  const waitingSince = waitingSinceForStudy(study);
  const assignedDoctorId = study.assignedDoctorId || null;
  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid || "",
    patientName: formatPatientName(study.patientName),
    patientId: study.patientId || "-",
    accessionNumber: study.accessionNumber || "-",
    modality: study.modality || "-",
    studyDescription: study.studyDescription || "-",
    status: study.status,
    statusLabel: statusLabels[study.status] || study.status,
    priority: priorityOf(study),
    stationAeTitle: stationOf(study),
    assignedDoctorId,
    assignedDoctorName: assignedDoctorId ? doctorNames.get(assignedDoctorId) || "Unknown doctor" : "Chưa assign",
    waitingMinutes: minutesBetween(waitingSince, new Date()) || 0,
    href: study.studyInstanceUid ? `/report/${encodeURIComponent(study.studyInstanceUid)}` : "/worklist",
  };
}

async function getRadiologistWorkload(start: Date, endExclusive: Date, user: any): Promise<StatisticsWorkload> {
  const canManage = canManageAssignments(user);
  const doctorOnly = isDoctorOnlyWorkloadView(user);

  const [doctors, activeStudies, draftReports, finalizedStudies] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["DOCTOR", "ADMIN"] as any[] },
      },
      select: { id: true, fullName: true, username: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.imagingStudy.findMany({
      where: {
        status: { in: ["READY_TO_READ", "READING", "REPORTED"] as any[] },
        ...(doctorOnly ? { assignedDoctorId: user.id } : {}),
      },
      include: { order: true },
      orderBy: [
        { receivedAt: "asc" },
        { stableAt: "asc" },
        { createdAt: "asc" },
      ],
      take: 300,
    }),
    prisma.report.groupBy({
      by: ["doctorId"],
      where: { status: { in: ["DRAFT", "PENDING_APPROVAL"] as any[] } },
      _count: { _all: true },
    }),
    prisma.imagingStudy.findMany({
      where: { finalizedAt: rangeFilter(start, endExclusive) },
      include: {
        order: true,
        reports: {
          select: { doctorId: true },
        },
      },
      take: 1000,
    }),
  ]);

  const visibleDoctors = doctorOnly ? doctors.filter(doctor => doctor.id === user.id) : doctors;
  const doctorOptions: StatisticsDoctorOption[] = visibleDoctors.map(doctor => ({
    id: doctor.id,
    name: doctor.fullName || doctor.username,
  }));
  const doctorNames = new Map(doctors.map(doctor => [doctor.id, doctor.fullName || doctor.username]));
  const rowMap = new Map<string, StatisticsWorkloadDoctorRow>();

  function ensureRow(doctorId: string, doctorName: string) {
    const existing = rowMap.get(doctorId);
    if (existing) return existing;
    const row: StatisticsWorkloadDoctorRow = {
      doctorId,
      doctorName,
      assignedActive: 0,
      readyToRead: 0,
      reading: 0,
      draftReports: 0,
      finalizedInPeriod: 0,
      averageTatMinutes: null,
      p90TatMinutes: null,
      slaBreaches: 0,
    };
    rowMap.set(doctorId, row);
    return row;
  }

  visibleDoctors.forEach(doctor => ensureRow(doctor.id, doctor.fullName || doctor.username));
  if (!doctorOnly) ensureRow("UNASSIGNED", "Chưa assign");

  const tatMap = new Map<string, number[]>();
  activeStudies.forEach(study => {
    const doctorId = study.assignedDoctorId || "UNASSIGNED";
    if (doctorOnly && doctorId !== user.id) return;
    const row = ensureRow(doctorId, doctorId === "UNASSIGNED" ? "Chưa assign" : doctorNames.get(doctorId) || "Unknown doctor");
    const queueRow = serializeWorkloadQueueRow(study, doctorNames);
    row.assignedActive += doctorId === "UNASSIGNED" ? 0 : 1;
    if (study.status === "READY_TO_READ") row.readyToRead += 1;
    if (study.status === "READING" || study.status === "REPORTED") row.reading += 1;
    if (queueRow.waitingMinutes >= slaThresholdForPriority(queueRow.priority)) row.slaBreaches += 1;
  });

  draftReports.forEach(group => {
    if (!group.doctorId) return;
    if (doctorOnly && group.doctorId !== user.id) return;
    const row = ensureRow(group.doctorId, doctorNames.get(group.doctorId) || "Unknown doctor");
    row.draftReports = group._count._all;
  });

  finalizedStudies.forEach(study => {
    const reportDoctorId = study.reports.find(report => report.doctorId)?.doctorId || null;
    const doctorId = study.assignedDoctorId || reportDoctorId || "UNASSIGNED";
    if (doctorOnly && doctorId !== user.id) return;
    const row = ensureRow(doctorId, doctorId === "UNASSIGNED" ? "Chưa assign" : doctorNames.get(doctorId) || "Unknown doctor");
    row.finalizedInPeriod += 1;

    const startAt = study.receivedAt || study.stableAt || study.scanEndedAt || study.scheduledAt || null;
    const tat = minutesBetween(startAt, study.finalizedAt);
    if (tat !== null) {
      const values = tatMap.get(doctorId) || [];
      values.push(tat);
      tatMap.set(doctorId, values);
    }
  });

  tatMap.forEach((values, doctorId) => {
    const row = rowMap.get(doctorId);
    if (!row) return;
    row.averageTatMinutes = average(values);
    row.p90TatMinutes = percentile(values, 90);
  });

  const queue = sortOperationRows(activeStudies.map(study => serializeOperationStudyRow(study, "")))
    .map(row => {
      const study = activeStudies.find(item => item.id === row.id);
      return study ? serializeWorkloadQueueRow(study, doctorNames) : null;
    })
    .filter((row): row is StatisticsWorkloadQueueRow => Boolean(row))
    .slice(0, 24);

  const rows = Array.from(rowMap.values())
    .filter(row => !doctorOnly || row.doctorId === user.id)
    .sort((a, b) => {
      if (a.doctorId === "UNASSIGNED") return -1;
      if (b.doctorId === "UNASSIGNED") return 1;
      return b.slaBreaches - a.slaBreaches || b.readyToRead + b.reading - (a.readyToRead + a.reading);
    });

  return {
    canManageAssignments: canManage,
    currentDoctorOnly: doctorOnly,
    doctors: doctorOptions,
    rows,
    queue,
    unassignedCount: activeStudies.filter(study => !study.assignedDoctorId).length,
    totalAssignedActive: activeStudies.filter(study => Boolean(study.assignedDoctorId)).length,
  };
}

function serializeAlertRow(alert: any): StatisticsAlerts["rows"][number] {
  return {
    id: alert.id,
    alertType: alert.alertType,
    severity: alert.severity,
    status: alert.status,
    title: alert.title,
    message: alert.message || "",
    entityType: alert.entityType,
    entityId: alert.entityId || null,
    studyInstanceUid: alert.studyInstanceUid || null,
    patientName: alert.patientName || null,
    priority: alert.priority || null,
    ageMinutes: minutesBetween(alert.createdAt, new Date()) || 0,
    createdAt: alert.createdAt.toISOString(),
    updatedAt: alert.updatedAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt ? alert.acknowledgedAt.toISOString() : null,
    resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
    href: alertHref(alert),
  };
}

async function getOperationalAlerts(user: any): Promise<StatisticsAlerts> {
  const alerts = await prisma.operationalAlert.findMany({
    where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    orderBy: [
      { createdAt: "desc" },
    ],
    take: 40,
  });

  const rows = alerts
    .map(serializeAlertRow)
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.ageMinutes - a.ageMinutes);

  return {
    canManageAlerts: canManageOperationalAlerts(user),
    open: rows.filter(row => row.status === "OPEN").length,
    acknowledged: rows.filter(row => row.status === "ACKNOWLEDGED").length,
    critical: rows.filter(row => row.severity === "critical").length,
    rows,
  };
}

async function backfillStudyEventsFromExistingData(start: Date, endExclusive: Date) {
  const studies = await prisma.imagingStudy.findMany({
    where: studyDateWhere(start, endExclusive),
    select: {
      id: true,
      status: true,
      createdAt: true,
      scheduledAt: true,
      checkedInAt: true,
      scanStartedAt: true,
      scanEndedAt: true,
      receivedAt: true,
      stableAt: true,
      qcCompletedAt: true,
      firstOpenedAt: true,
      finalizedAt: true,
      deliveredAt: true,
      events: {
        select: { eventType: true },
      },
    },
    take: 1000,
  });

  const rows: any[] = [];
  studies.forEach(study => {
    const existing = new Set(study.events.map(event => event.eventType));
    const candidates: Array<{ eventType: string; createdAt?: Date | null; toStatus?: any }> = [
      { eventType: "ORDER_CREATED", createdAt: study.scheduledAt || study.createdAt, toStatus: "ORDERED" },
      { eventType: "PATIENT_CHECKED_IN", createdAt: study.checkedInAt, toStatus: study.status },
      { eventType: "SCAN_STARTED", createdAt: study.scanStartedAt, toStatus: "IN_PROGRESS" },
      { eventType: "SCAN_ENDED", createdAt: study.scanEndedAt, toStatus: "RECEIVED" },
      { eventType: "DICOM_RECEIVED", createdAt: study.receivedAt, toStatus: "RECEIVED" },
      { eventType: "STUDY_STABLE", createdAt: study.stableAt, toStatus: "READY_TO_READ" },
      { eventType: "QC_PASSED", createdAt: study.qcCompletedAt, toStatus: "READY_TO_READ" },
      { eventType: "REPORT_OPENED", createdAt: study.firstOpenedAt, toStatus: "READING" },
      { eventType: "REPORT_FINALIZED", createdAt: study.finalizedAt, toStatus: "FINALIZED" },
      { eventType: "RESULT_DELIVERED", createdAt: study.deliveredAt, toStatus: "DELIVERED" },
    ];

    candidates.forEach(candidate => {
      if (!candidate.createdAt || existing.has(candidate.eventType)) return;
      rows.push({
        imagingStudyId: study.id,
        eventType: candidate.eventType,
        toStatus: candidate.toStatus,
        source: "BACKFILL",
        metadataJson: JSON.stringify({ backfilled: true }),
        createdAt: candidate.createdAt,
      });
    });
  });

  if (!rows.length) return 0;
  await prisma.imagingStudyEvent.createMany({ data: rows });
  return rows.length;
}

export async function assignStudyDoctorAction(studyId: string, doctorId: string | null) {
  const user = await requireAssignmentAccess();
  const normalizedDoctorId = doctorId && doctorId !== "UNASSIGNED" ? doctorId : null;

  const study = await prisma.imagingStudy.findUnique({
    where: { id: studyId },
    select: {
      id: true,
      studyInstanceUid: true,
      patientName: true,
      assignedDoctorId: true,
    },
  });
  if (!study) throw new Error("Không tìm thấy study để assign.");

  let doctorName: string | null = null;
  if (normalizedDoctorId) {
    const doctor = await prisma.user.findFirst({
      where: {
        id: normalizedDoctorId,
        isActive: true,
        role: { in: ["DOCTOR", "ADMIN"] as any[] },
      },
      select: { id: true, fullName: true, username: true },
    });
    if (!doctor) throw new Error("Không tìm thấy bác sĩ hợp lệ để assign.");
    doctorName = doctor.fullName || doctor.username;
  }

  if (study.assignedDoctorId === normalizedDoctorId) {
    return { success: true, assignedDoctorId: normalizedDoctorId };
  }

  await prisma.$transaction(async tx => {
    await tx.imagingStudy.update({
      where: { id: study.id },
      data: { assignedDoctorId: normalizedDoctorId },
    });
    await recordStudyEventInTx(tx, {
      imagingStudyId: study.id,
      eventType: "ASSIGNED_DOCTOR_CHANGED",
      actorUserId: user.id,
      source: "WORKLOAD",
      metadata: {
        fromDoctorId: study.assignedDoctorId,
        toDoctorId: normalizedDoctorId,
        toDoctorName: doctorName,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "IMAGING_STUDY_ASSIGNED_DOCTOR",
        entityType: "ImagingStudy",
        entityId: study.id,
        message: `Assigned study ${study.studyInstanceUid} to ${doctorName || "unassigned"}`,
        metadataJson: JSON.stringify({
          studyInstanceUid: study.studyInstanceUid,
          patientName: study.patientName,
          fromDoctorId: study.assignedDoctorId,
          toDoctorId: normalizedDoctorId,
        }),
      },
    });
  });

  return { success: true, assignedDoctorId: normalizedDoctorId };
}

export async function acknowledgeOperationalAlertAction(alertId: string) {
  const user = await requireAlertAccess();
  const alert = await prisma.operationalAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error("Không tìm thấy alert.");
  if (alert.status === "RESOLVED") return { success: true };

  await prisma.$transaction([
    prisma.operationalAlert.update({
      where: { id: alertId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: alert.acknowledgedAt || new Date(),
        acknowledgedByUserId: alert.acknowledgedByUserId || user.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "OPERATIONAL_ALERT_ACKNOWLEDGED",
        entityType: "OperationalAlert",
        entityId: alertId,
        message: `Acknowledged alert ${alert.title}`,
        metadataJson: JSON.stringify({ alertType: alert.alertType, ruleKey: alert.ruleKey }),
      },
    }),
  ]);

  return { success: true };
}

export async function resolveOperationalAlertAction(alertId: string) {
  const user = await requireAlertAccess();
  const alert = await prisma.operationalAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error("Không tìm thấy alert.");
  if (alert.status === "RESOLVED") return { success: true };

  await prisma.$transaction([
    prisma.operationalAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedByUserId: user.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "OPERATIONAL_ALERT_RESOLVED",
        entityType: "OperationalAlert",
        entityId: alertId,
        message: `Resolved alert ${alert.title}`,
        metadataJson: JSON.stringify({ alertType: alert.alertType, ruleKey: alert.ruleKey }),
      },
    }),
  ]);

  return { success: true };
}

export async function recordScanTimingAction(input: {
  studyId: string;
  scanStartedAt?: string;
  scanEndedAt?: string;
}) {
  const user = await requireQualitySafetyAccess();
  const study = await prisma.imagingStudy.findUnique({ where: { id: input.studyId } });
  if (!study) throw new Error("Khong tim thay study de ghi moc chup.");

  const scanStartedAt = input.scanStartedAt ? new Date(input.scanStartedAt) : null;
  const scanEndedAt = input.scanEndedAt ? new Date(input.scanEndedAt) : null;
  if (scanStartedAt && Number.isNaN(scanStartedAt.getTime())) throw new Error("Moc scanStartedAt khong hop le.");
  if (scanEndedAt && Number.isNaN(scanEndedAt.getTime())) throw new Error("Moc scanEndedAt khong hop le.");
  if (scanStartedAt && scanEndedAt && scanEndedAt < scanStartedAt) throw new Error("Scan end khong duoc truoc scan start.");

  await prisma.$transaction(async tx => {
    const nextStatus =
      scanEndedAt ? study.status === "ORDERED" || study.status === "READY_FOR_SCAN" || study.status === "IN_PROGRESS" ? "RECEIVED" : study.status :
      scanStartedAt ? "IN_PROGRESS" :
      study.status;

    await tx.imagingStudy.update({
      where: { id: study.id },
      data: {
        scanStartedAt: scanStartedAt || study.scanStartedAt,
        scanEndedAt: scanEndedAt || study.scanEndedAt,
        status: nextStatus as any,
      },
    });

    if (scanStartedAt && !study.scanStartedAt) {
      await recordStudyEventInTx(tx, {
        imagingStudyId: study.id,
        eventType: "SCAN_STARTED",
        fromStatus: study.status as any,
        toStatus: "IN_PROGRESS",
        actorUserId: user.id,
        source: "MANUAL_SCAN",
        createdAt: scanStartedAt,
      });
    }

    if (scanEndedAt && !study.scanEndedAt) {
      await recordStudyEventInTx(tx, {
        imagingStudyId: study.id,
        eventType: "SCAN_ENDED",
        fromStatus: study.status as any,
        toStatus: nextStatus as any,
        actorUserId: user.id,
        source: "MANUAL_SCAN",
        createdAt: scanEndedAt,
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "STUDY_SCAN_TIMING_RECORDED",
        entityType: "ImagingStudy",
        entityId: study.id,
        message: `Recorded scan timing for ${study.studyInstanceUid}`,
        metadataJson: JSON.stringify({
          scanStartedAt: scanStartedAt?.toISOString() || null,
          scanEndedAt: scanEndedAt?.toISOString() || null,
        }),
      },
    });
  });

  return { success: true };
}

export async function recordDoseObservationAction(input: {
  studyId: string;
  metricType: string;
  value: number;
  unit?: string;
  source?: string;
  seriesInstanceUid?: string;
  sopInstanceUid?: string;
  metadata?: Record<string, unknown>;
}) {
  const user = await requireQualitySafetyAccess();
  const metricType = normalizeBucket(input.metricType);
  const value = Number(input.value);
  if (!metricType || metricType === "UNKNOWN") throw new Error("Dose metricType bat buoc.");
  if (!Number.isFinite(value) || value < 0) throw new Error("Dose value khong hop le.");

  const study = await prisma.imagingStudy.findUnique({ where: { id: input.studyId } });
  if (!study) throw new Error("Khong tim thay study de ghi dose.");

  const observation = await prisma.doseObservation.create({
    data: {
      imagingStudyId: study.id,
      metricType,
      value,
      unit: cleanText(input.unit) || null,
      source: cleanText(input.source) || "DICOM",
      seriesInstanceUid: cleanText(input.seriesInstanceUid) || null,
      sopInstanceUid: cleanText(input.sopInstanceUid) || null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "DOSE_OBSERVATION_RECORDED",
      entityType: "DoseObservation",
      entityId: observation.id,
      message: `Recorded dose ${metricType} for ${study.studyInstanceUid}`,
      metadataJson: JSON.stringify({ value, unit: input.unit, source: input.source }),
    },
  });

  return { success: true, id: observation.id };
}

export async function recordStudyQcAction(input: {
  studyId: string;
  status: "QC_PASSED" | "QC_REJECTED" | "NEEDS_QC";
  reasonCode?: string;
  note?: string;
}) {
  const user = await requireQualitySafetyAccess();
  const reasonCode = cleanText(input.reasonCode);
  if (input.status === "QC_REJECTED" && !reasonCode) {
    throw new Error("QC reject bat buoc co ly do.");
  }

  const study = await prisma.imagingStudy.findUnique({ where: { id: input.studyId } });
  if (!study) throw new Error("Khong tim thay study de ghi QC.");

  const nextStatus =
    input.status === "QC_REJECTED" ? "QC_REJECTED" :
    input.status === "QC_PASSED" ? "READY_TO_READ" :
    "NEEDS_QC";
  const now = new Date();

  await prisma.$transaction(async tx => {
    await tx.imagingStudy.update({
      where: { id: study.id },
      data: {
        status: nextStatus as any,
        qcCompletedAt: input.status === "NEEDS_QC" ? study.qcCompletedAt : now,
      },
    });
    await tx.studyQcEvent.create({
      data: {
        imagingStudyId: study.id,
        status: input.status,
        reasonCode: reasonCode || null,
        note: cleanText(input.note) || null,
        actorUserId: user.id,
        createdAt: now,
      },
    });
    await recordStudyEventInTx(tx, {
      imagingStudyId: study.id,
      eventType: input.status === "QC_REJECTED" ? "QC_REJECTED" : input.status === "QC_PASSED" ? "QC_PASSED" : "STATUS_CHANGED",
      fromStatus: study.status as any,
      toStatus: nextStatus as any,
      actorUserId: user.id,
      source: "QC",
      createdAt: now,
      metadata: {
        reasonCode: reasonCode || null,
        note: cleanText(input.note) || null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "STUDY_QC_RECORDED",
        entityType: "ImagingStudy",
        entityId: study.id,
        message: `Recorded ${input.status} for ${study.studyInstanceUid}`,
        metadataJson: JSON.stringify({ reasonCode, note: input.note }),
      },
    });
  });

  return { success: true };
}

export async function createCriticalResultAction(input: {
  studyId: string;
  finding: string;
  severity?: string;
}) {
  const user = await requireQualitySafetyAccess();
  const finding = cleanText(input.finding);
  if (!finding) throw new Error("Critical result bat buoc co noi dung.");

  const study = await prisma.imagingStudy.findUnique({ where: { id: input.studyId } });
  if (!study) throw new Error("Khong tim thay study de ghi critical result.");

  const result = await prisma.criticalResult.create({
    data: {
      imagingStudyId: study.id,
      severity: cleanText(input.severity) || "critical",
      finding,
      communicationStatus: "PENDING",
      createdByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CRITICAL_RESULT_CREATED",
      entityType: "CriticalResult",
      entityId: result.id,
      message: `Created critical result for ${study.studyInstanceUid}`,
      metadataJson: JSON.stringify({ severity: result.severity }),
    },
  });

  return { success: true, id: result.id };
}

export async function communicateCriticalResultAction(resultId: string, communicatedTo: string) {
  const user = await requireQualitySafetyAccess();
  const target = cleanText(communicatedTo);
  if (!target) throw new Error("Can ghi nguoi/bo phan da nhan thong bao.");

  const result = await prisma.criticalResult.update({
    where: { id: resultId },
    data: {
      communicationStatus: "COMMUNICATED",
      communicatedTo: target,
      communicatedAt: new Date(),
      communicatedByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CRITICAL_RESULT_COMMUNICATED",
      entityType: "CriticalResult",
      entityId: result.id,
      message: `Communicated critical result to ${target}`,
    },
  });

  return { success: true };
}

export async function saveStatisticsFilterPresetAction(name: string, filters: StatisticsFilters, isShared = false) {
  const user = await requireStatisticsAccess();
  const presetName = cleanText(name);
  if (!presetName) throw new Error("Ten preset bat buoc.");

  const preset = await prisma.dashboardFilterPreset.create({
    data: {
      userId: user.id,
      name: presetName,
      dashboard: "statistics",
      filtersJson: JSON.stringify(filters),
      isShared: Boolean(isShared && hasPermission(user.role, "users.manage", user.permissions)),
    },
  });

  return {
    success: true,
    preset: {
      id: preset.id,
      name: preset.name,
      filters,
      isShared: preset.isShared,
      createdAt: preset.createdAt.toISOString(),
    },
  };
}

export async function deleteStatisticsFilterPresetAction(presetId: string) {
  const user = await requireStatisticsAccess();
  const preset = await prisma.dashboardFilterPreset.findUnique({ where: { id: presetId } });
  if (!preset) return { success: true };
  if (preset.userId !== user.id && !hasPermission(user.role, "users.manage", user.permissions)) {
    throw new Error("Khong co quyen xoa preset nay.");
  }
  await prisma.dashboardFilterPreset.delete({ where: { id: presetId } });
  return { success: true };
}

export async function exportStatisticsDrilldownAction(filters: StatisticsFilters = {}, format: "csv" | "xlsx" = "csv") {
  const user = await requireStatisticsAccess();
  const range = toVietnamRange(filters.dateFrom, filters.dateTo);
  const endExclusive = plusOneDay(range.end);
  const drilldown = await getDrilldownDashboard(range.start, endExclusive, filters);
  const rows = exportRows(drilldown.rows, hasPermission(user.role, "reports.read", user.permissions));
  const suffix = `${range.dateFrom}_${range.dateTo}_${drilldown.activeFilter}`;

  if (format === "xlsx") {
    return {
      filename: `statistics_${suffix}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      encoding: "base64",
      content: rowsToXlsxBase64(rows),
    };
  }

  return {
    filename: `statistics_${suffix}.csv`,
    mimeType: "text/csv;charset=utf-8",
    encoding: "utf8",
    content: buildCsv(rows),
  };
}

export async function upsertProcedureCatalogAction(input: {
  code: string;
  name: string;
  modality?: string;
  bodyPart?: string;
  defaultPrice?: number | null;
}) {
  const user = await requireStatisticsAccess();
  if (!hasPermission(user.role, "clinic.manage", user.permissions) && !hasPermission(user.role, "users.manage", user.permissions)) {
    throw new Error("Khong co quyen cap nhat procedure catalog.");
  }
  const code = normalizeBucket(input.code, "");
  const name = cleanText(input.name);
  if (!code || !name) throw new Error("Procedure code va name bat buoc.");

  const saved = await prisma.procedureCatalog.upsert({
    where: { code },
    update: {
      name,
      modality: cleanText(input.modality) || null,
      bodyPart: cleanText(input.bodyPart) || null,
      defaultPrice: input.defaultPrice === null || input.defaultPrice === undefined ? null : input.defaultPrice,
      isActive: true,
    },
    create: {
      code,
      name,
      modality: cleanText(input.modality) || null,
      bodyPart: cleanText(input.bodyPart) || null,
      defaultPrice: input.defaultPrice === null || input.defaultPrice === undefined ? null : input.defaultPrice,
      isActive: true,
    },
  });

  return { success: true, id: saved.id };
}

export async function getStatisticsDashboardAction(filters: StatisticsFilters = {}): Promise<StatisticsPayload> {
  const user = await requireStatisticsAccess();
  const range = toVietnamRange(filters.dateFrom, filters.dateTo);
  const endExclusive = plusOneDay(range.end);
  const storagePromise = getOrthancStorage();

  await backfillStudyEventsFromExistingData(range.start, endExclusive);
  await syncOperationalAlerts();

  const [
    studiesInPeriod,
    readyToRead,
    readingStudies,
    draftReports,
    finalizedInPeriod,
    deliveredInPeriod,
    qcIssues,
    statusGroups,
    modalityGroups,
    averageReceivedToFinalizedMinutes,
    doctorRows,
    pendingStudies,
    operations,
    performance,
    utilization,
    workload,
    alerts,
    storage,
    pacsHealth,
    qualitySafety,
    business,
    drilldown,
    filterPresets,
  ] = await Promise.all([
    prisma.imagingStudy.count({ where: studyDateWhere(range.start, endExclusive) }),
    prisma.imagingStudy.count({ where: { status: "READY_TO_READ" } }),
    prisma.imagingStudy.count({ where: { status: { in: ["READING", "REPORTED"] } } }),
    prisma.report.count({ where: { status: { in: ["DRAFT", "PENDING_APPROVAL"] as any[] } } }),
    prisma.imagingStudy.count({ where: { finalizedAt: rangeFilter(range.start, endExclusive) } }),
    prisma.imagingStudy.count({ where: { deliveredAt: rangeFilter(range.start, endExclusive) } }),
    prisma.imagingStudy.count({ where: { status: { in: ["NEEDS_QC", "QC_REJECTED", "ERROR"] } } }),
    prisma.imagingStudy.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.imagingStudy.groupBy({
      by: ["modality"],
      where: studyDateWhere(range.start, endExclusive),
      _count: { _all: true },
    }),
    getAverageTurnaround(range.start, endExclusive),
    getDoctorRows(range.start, endExclusive, user.role, user.id, user.permissions, user.baseRole),
    prisma.imagingStudy.findMany({
      where: { status: { in: ["READY_TO_READ", "READING"] } },
      include: { order: true },
      orderBy: [
        { receivedAt: "asc" },
        { stableAt: "asc" },
        { scheduledAt: "asc" },
        { createdAt: "asc" },
      ],
      take: 20,
    }),
    getOperationsDashboard(range.start, endExclusive),
    getPerformanceAnalytics(range.start, endExclusive),
    getUtilizationAnalytics(range.start, endExclusive),
    getRadiologistWorkload(range.start, endExclusive, user),
    getOperationalAlerts(user),
    storagePromise,
    storagePromise.then(storage => getPacsHealthDashboard(range.start, endExclusive, storage)),
    getQualitySafetyDashboard(range.start, endExclusive),
    getBusinessAnalytics(range.start, endExclusive),
    getDrilldownDashboard(range.start, endExclusive, filters),
    getFilterPresets(user),
  ]);

  const totalModality = modalityGroups.reduce((sum, row) => sum + row._count._all, 0);
  const modalityCounts: StatisticsModalityCount[] = modalityGroups
    .map(row => ({
      modality: row.modality || "UNKNOWN",
      count: row._count._all,
      percent: totalModality ? Math.round((row._count._all / totalModality) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const statusCounts: StatisticsStatusCount[] = statusGroups
    .map(row => ({
      status: row.status,
      label: statusLabels[row.status] || row.status,
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    generatedAt: new Date().toISOString(),
    role: user.role,
    canViewDoctorStats: hasPermission(user.role, "statistics.doctorStats", user.permissions),
    kpis: {
      studiesInPeriod,
      readyToRead,
      readingOrDraft: readingStudies + draftReports,
      finalizedInPeriod,
      deliveredInPeriod,
      qcIssues,
      averageReceivedToFinalizedMinutes,
    },
    statusCounts,
    modalityCounts,
    doctorRows,
    pendingQueue: pendingStudies.map(serializeQueueRow),
    operations,
    performance,
    utilization,
    workload,
    alerts,
    storage,
    pacsHealth,
    qualitySafety,
    business,
    drilldown,
    filterPresets,
  };
}
