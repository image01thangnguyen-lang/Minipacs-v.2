"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import type {
  StatisticsDoctorRow,
  StatisticsFilters,
  StatisticsModalityCount,
  StatisticsOperations,
  StatisticsOperationRow,
  StatisticsPayload,
  StatisticsQueueRow,
  StatisticsStatusCount,
  StatisticsStorage,
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
    storage,
  };
}
