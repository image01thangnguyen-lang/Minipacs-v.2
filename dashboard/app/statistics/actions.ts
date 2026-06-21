"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import type {
  StatisticsBreakdownRow,
  StatisticsDoctorRow,
  StatisticsDurationSummary,
  StatisticsFilters,
  StatisticsModalityCount,
  StatisticsOperations,
  StatisticsOperationRow,
  StatisticsPayload,
  StatisticsPerformance,
  StatisticsPerformanceOutlier,
  StatisticsQueueRow,
  StatisticsRoomUtilizationRow,
  StatisticsStatusCount,
  StatisticsStorage,
  StatisticsTrendPoint,
  StatisticsUtilization,
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
    status: { in: ["FINAL", "COMPLETED"] as any[] },
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

function formatPatientName(value?: string | null) {
  return cleanText(value).replace(/\^/g, " ") || "Unknown Patient";
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

async function getOrthancStorage(): Promise<StatisticsStorage> {
  const orthancUrl = process.env.ORTHANC_API_URL || "http://orthanc:8042";
  const username = process.env.ORTHANC_USERNAME || "admin";
  const password = process.env.ORTHANC_PASSWORD || "admin_password";

  try {
    const response = await fetch(`${orthancUrl}/statistics`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const data = await response.json();
    const diskSizeMb = Number(data.TotalDiskSizeMB || 0);
    const uncompressedSizeMb = Number(data.TotalUncompressedSizeMB || 0);
    const warningLevel =
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
      warningLevel: "unknown",
      message: `Không đọc được Orthanc statistics: ${error?.message || "unknown error"}`,
    };
  }
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
        status: { in: ["DRAFT", "DRAFTING"] as any[] },
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

export async function getStatisticsDashboardAction(filters: StatisticsFilters = {}): Promise<StatisticsPayload> {
  const user = await requireStatisticsAccess();
  const range = toVietnamRange(filters.dateFrom, filters.dateTo);
  const endExclusive = plusOneDay(range.end);

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
    storage,
  ] = await Promise.all([
    prisma.imagingStudy.count({ where: studyDateWhere(range.start, endExclusive) }),
    prisma.imagingStudy.count({ where: { status: "READY_TO_READ" } }),
    prisma.imagingStudy.count({ where: { status: { in: ["READING", "REPORTED"] } } }),
    prisma.report.count({ where: { status: { in: ["DRAFT", "DRAFTING"] as any[] } } }),
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
    getOrthancStorage(),
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
    storage,
  };
}
