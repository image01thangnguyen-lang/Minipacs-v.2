"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  Loader2,
  RefreshCcw,
  Stethoscope,
  Timer,
  UserRoundCheck,
} from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { CustomDatePicker } from "@/app/components/CustomDatePicker";
import { CustomSelect } from "@/app/components/CustomSelect";
import {
  acknowledgeOperationalAlertAction,
  assignStudyDoctorAction,
  getStatisticsDashboardAction,
  resolveOperationalAlertAction,
} from "./actions";
import type {
  StatisticsAlertRow,
  StatisticsAlerts,
  StatisticsBreakdownRow,
  StatisticsDoctorOption,
  StatisticsDurationSummary,
  StatisticsFilters,
  StatisticsHourlyUtilizationRow,
  StatisticsOperationRow,
  StatisticsPayload,
  StatisticsPerformanceOutlier,
  StatisticsRoomUtilizationRow,
  StatisticsWorkload,
  StatisticsWorkloadDoctorRow,
  StatisticsWorkloadQueueRow,
} from "./types";

function todayInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return "-";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}p` : `${hours}h`;
}

function formatStorageMb(value: number) {
  if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`;
  return `${value} MB`;
}

function formatPercent(value: number | null) {
  return value === null ? "-" : `${value}%`;
}

const statusTone: Record<string, string> = {
  READY_TO_READ: "bg-emerald-400",
  READING: "bg-vin-status-warning-bg",
  REPORTED: "bg-vin-status-warning-bg",
  FINALIZED: "bg-vin-status-approved-bg",
  DELIVERED: "bg-vin-status-approved-bg",
  NEEDS_QC: "bg-vin-status-danger-bg",
  QC_REJECTED: "bg-vin-status-danger-bg",
  ERROR: "bg-vin-status-danger-bg",
};

const priorityTone: Record<string, string> = {
  STAT: "bg-vin-status-danger-bg text-white",
  URGENT: "bg-vin-status-warning-bg text-white",
  ROUTINE: "border border-vin-border bg-vin-panel text-vin-muted",
};

export default function StatisticsPage() {
  const [filters, setFilters] = useState<StatisticsFilters>({
    dateFrom: todayInput(),
    dateTo: todayInput(),
  });
  const [data, setData] = useState<StatisticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyActionId, setBusyActionId] = useState("");

  const loadData = async (nextFilters = filters, options: { silent?: boolean } = {}) => {
    if (options.silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");
    try {
      const result = await getStatisticsDashboardAction(nextFilters);
      setData(result);
      setFilters({ dateFrom: result.dateFrom, dateTo: result.dateTo });
    } catch (err: any) {
      setError(err?.message || "Không tải được dashboard thống kê.");
    } finally {
      if (options.silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    document.title = "Dashboard thống kê RIS/PACS";
    loadData();
  }, []);

  useEffect(() => {
    if (!data?.operations.autoRefreshSeconds) return undefined;

    const timer = window.setInterval(() => {
      loadData(filters, { silent: true });
    }, data.operations.autoRefreshSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [data?.operations.autoRefreshSeconds, filters.dateFrom, filters.dateTo]);

  const runDashboardAction = async (actionId: string, action: () => Promise<unknown>) => {
    setBusyActionId(actionId);
    setError("");
    try {
      await action();
      await loadData(filters, { silent: true });
    } catch (err: any) {
      setError(err?.message || "Không thực hiện được thao tác.");
    } finally {
      setBusyActionId("");
    }
  };

  const handleAssignDoctor = (studyId: string, doctorId: string) => {
    runDashboardAction(`assign:${studyId}`, () => assignStudyDoctorAction(studyId, doctorId));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    runDashboardAction(`ack:${alertId}`, () => acknowledgeOperationalAlertAction(alertId));
  };

  const handleResolveAlert = (alertId: string) => {
    runDashboardAction(`resolve:${alertId}`, () => resolveOperationalAlertAction(alertId));
  };

  const maxModalityCount = useMemo(
    () => Math.max(1, ...(data?.modalityCounts || []).map(item => item.count)),
    [data?.modalityCounts]
  );

  const maxTatMinutes = useMemo(
    () => Math.max(1, ...(data?.performance.dailyTrend || []).map(item => item.p90TatMinutes || item.averageTatMinutes || 0)),
    [data?.performance.dailyTrend]
  );

  const maxHourlyBusyMinutes = useMemo(
    () => Math.max(1, ...(data?.utilization.hourly || []).map(item => item.busyMinutes)),
    [data?.utilization.hourly]
  );

  const kpiItems = data
    ? [
        { label: "Ca trong kỳ", value: data.kpis.studiesInPeriod, icon: Activity, tone: "text-vin-accent" },
        { label: "Chờ đọc", value: data.kpis.readyToRead, icon: Clock3, tone: "text-emerald-300" },
        { label: "Đang đọc / nháp", value: data.kpis.readingOrDraft, icon: Stethoscope, tone: "text-amber-300" },
        { label: "Đã ký", value: data.kpis.finalizedInPeriod, icon: FileCheck2, tone: "text-emerald-300" },
        { label: "Đã trả", value: data.kpis.deliveredInPeriod, icon: CheckCircle2, tone: "text-emerald-300" },
        { label: "QC / lỗi", value: data.kpis.qcIssues, icon: AlertTriangle, tone: "text-red-300" },
      ]
    : [];

  const operationItems = data
    ? [
        { label: "Đã hẹn", value: data.operations.kpis.scheduled, icon: Clock3, tone: "text-sky-300" },
        { label: "Đã đến", value: data.operations.kpis.arrived, icon: UserRoundCheck, tone: "text-emerald-300" },
        { label: "Sẵn sàng chụp", value: data.operations.kpis.readyForScan, icon: Activity, tone: "text-cyan-300" },
        { label: "Đã nhận ảnh", value: data.operations.kpis.received, icon: Database, tone: "text-vin-accent" },
        { label: "Chờ đọc", value: data.operations.kpis.readyToRead, icon: Clock3, tone: "text-amber-300" },
        { label: "Đang đọc", value: data.operations.kpis.reading, icon: Stethoscope, tone: "text-purple-300" },
        { label: "Quá SLA", value: data.operations.kpis.slaBreaches, icon: AlertTriangle, tone: "text-red-300" },
        { label: "Kẹt luồng", value: data.operations.kpis.stuckWorkflow, icon: Timer, tone: "text-orange-300" },
      ]
    : [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="statistics" />

      <section className="flex h-full min-w-0 flex-1 flex-col bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
                <BarChart3 className="h-4 w-4 text-vin-accent" />
                Dashboard thống kê
              </h1>
              <div className="mt-1 text-[11px] text-vin-muted">
                {data ? `Cập nhật ${formatDateTime(data.generatedAt)}` : "Đang tải dữ liệu"}
                {isRefreshing && <span className="ml-2 text-vin-accent">Đang làm mới...</span>}
              </div>
            </div>

            <form
              onSubmit={event => {
                event.preventDefault();
                loadData(filters);
              }}
              className="flex items-center gap-2"
            >
              <CustomDatePicker
                value={filters.dateFrom || ""}
                onChange={val => setFilters(current => ({ ...current, dateFrom: val }))}
                compact
              />
              <CustomDatePicker
                value={filters.dateTo || ""}
                onChange={val => setFilters(current => ({ ...current, dateTo: val }))}
                compact
              />
              <button
                type="submit"
                disabled={isLoading || isRefreshing}
                className="flex h-9 items-center gap-1.5 rounded border border-vin-accent/50 bg-vin-accent px-3 text-[11px] font-bold text-white transition hover:bg-vin-accentHover disabled:opacity-40"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? "animate-spin" : ""}`} />
                Cập nhật
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-3 rounded border border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 px-3 py-2 text-[11px] font-semibold text-red-200">
              {error}
            </div>
          )}
        </div>

        {isLoading && !data ? (
          <div className="flex flex-1 flex-col items-center justify-center text-vin-muted">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-vin-accent" />
            Đang tổng hợp số liệu...
          </div>
        ) : data ? (
          <main className="min-h-0 flex-1 overflow-auto p-4 scr-dark">
            <section className="rounded border border-vin-border bg-vin-panel">
              <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                <div>
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">Điều hành realtime</h2>
                  <div className="mt-0.5 text-[10px] text-vin-muted">
                    Luồng order, nhận ảnh, đọc phim và các ca cần can thiệp.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-vin-muted">
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    Auto {data.operations.autoRefreshSeconds}s
                  </span>
                  {isRefreshing && <Loader2 className="h-3.5 w-3.5 animate-spin text-vin-accent" />}
                </div>
              </div>

              <div className="grid grid-cols-2 border-b border-white/5 md:grid-cols-4 xl:grid-cols-8">
                {operationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="border-r border-b border-white/5 px-3 py-2 last:border-r-0 xl:border-b-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-vin-muted">{item.label}</span>
                        <Icon className={`h-3.5 w-3.5 ${item.tone}`} />
                      </div>
                      <div className="mt-1 text-xl font-bold text-white">{item.value}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 p-3 xl:grid-cols-3">
                <OperationList
                  title="Quá SLA"
                  rows={data.operations.slaBreaches}
                  emptyText="Không có ca quá SLA."
                  tone="danger"
                />
                <OperationList
                  title="Kẹt workflow"
                  rows={data.operations.stuckWorkflow}
                  emptyText="Chưa phát hiện ca kẹt luồng."
                  tone="warning"
                />
                <OperationList
                  title="Live queue"
                  rows={data.operations.liveQueue}
                  emptyText="Không có ca chờ đọc."
                  tone="normal"
                />
              </div>
            </section>

            <div className="mt-3 grid gap-3 xl:grid-cols-[0.95fr_1.25fr]">
              <AlertEscalationPanel
                alerts={data.alerts}
                busyActionId={busyActionId}
                onAcknowledge={handleAcknowledgeAlert}
                onResolve={handleResolveAlert}
              />
              <WorkloadCenter
                workload={data.workload}
                busyActionId={busyActionId}
                onAssignDoctor={handleAssignDoctor}
              />
            </div>

            <section className="mt-3 rounded border border-vin-border bg-vin-panel">
              <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                <div>
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">SLA / TAT analytics</h2>
                  <div className="mt-0.5 text-[10px] text-vin-muted">
                    P50, P90, P95 theo từng chặng workflow và outlier vượt SLA.
                  </div>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-vin-muted">
                  {data.performance.outliers.length} outlier
                </span>
              </div>

              <div className="grid gap-3 p-3 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {data.performance.segments.map(segment => (
                    <TatSegmentCard key={segment.key} segment={segment} />
                  ))}
                </div>

                <div className="rounded border border-white/10 bg-vin-shell px-3 py-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">TAT theo ngày</h3>
                    <span className="text-[10px] text-vin-muted">Avg / P90</span>
                  </div>
                  <DailyTatChart rows={data.performance.dailyTrend} maxMinutes={maxTatMinutes} />
                </div>
              </div>

              <div className="grid gap-3 px-3 pb-3 xl:grid-cols-[0.9fr_0.7fr_1.1fr]">
                <BreakdownTable title="Theo modality" rows={data.performance.modalityBreakdown} />
                <BreakdownTable title="Theo priority" rows={data.performance.priorityBreakdown} />
                <PerformanceOutlierList rows={data.performance.outliers} />
              </div>
            </section>

            <section className="mt-3 rounded border border-vin-border bg-vin-panel">
              <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                <div>
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">Utilization phòng / máy</h2>
                  <div className="mt-0.5 text-[10px] text-vin-muted">
                    Tải máy theo AE title, khung giờ cao điểm, no-show/cancel và QC reject.
                  </div>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-vin-muted">
                  Peak {data.utilization.kpis.peakHour}
                </span>
              </div>

              <div className="grid grid-cols-2 border-b border-white/5 md:grid-cols-3 xl:grid-cols-6">
                <MiniMetric label="Ca vận hành" value={data.utilization.kpis.totalStudies} />
                <MiniMetric label="Phòng active" value={data.utilization.kpis.activeRooms} />
                <MiniMetric label="Utilization" value={formatPercent(data.utilization.kpis.estimatedUtilizationPercent)} />
                <MiniMetric label="Busy time" value={formatDuration(data.utilization.kpis.estimatedBusyMinutes)} />
                <MiniMetric label="No-show / cancel" value={`${data.utilization.kpis.noShow} / ${data.utilization.kpis.cancelled}`} />
                <MiniMetric label="QC reject" value={data.utilization.kpis.qcRejected} />
              </div>

              <div className="grid gap-3 p-3 xl:grid-cols-[0.75fr_1.25fr]">
                <HourlyUtilizationChart rows={data.utilization.hourly} maxBusyMinutes={maxHourlyBusyMinutes} />
                <RoomUtilizationTable rows={data.utilization.rooms} />
              </div>
            </section>

            <div className="mt-3 grid grid-cols-6 gap-3">
              {kpiItems.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded border border-vin-border bg-vin-panel px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-vin-muted">{item.label}</div>
                      <Icon className={`h-4 w-4 ${item.tone}`} />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">{item.value}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-[1fr_360px] gap-3">
              <section className="rounded border border-vin-border bg-vin-panel">
                <div className="flex items-center justify-between border-b border-vin-border px-3 py-2">
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">Ca theo modality</h2>
                  <span className="text-[10px] text-vin-muted">{data.dateFrom} → {data.dateTo}</span>
                </div>
                <div className="space-y-3 p-3">
                  {data.modalityCounts.length === 0 ? (
                    <EmptyLine text="Chưa có ca trong kỳ." />
                  ) : (
                    data.modalityCounts.map(item => (
                      <div key={item.modality} className="grid grid-cols-[4rem_1fr_4rem] items-center gap-3 text-[11px]">
                        <div className="font-mono font-bold text-vin-accent">{item.modality}</div>
                        <div className="h-5 overflow-hidden rounded bg-vin-shell">
                          <div
                            className="h-full rounded bg-vin-accent"
                            style={{ width: `${Math.max(5, (item.count / maxModalityCount) * 100)}%` }}
                          />
                        </div>
                        <div className="text-right font-semibold text-white">{item.count} <span className="text-vin-muted">({item.percent}%)</span></div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded border border-vin-border bg-vin-panel">
                <div className="flex items-center justify-between border-b border-vin-border px-3 py-2">
                  <h2 className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-vin-text2">
                    <Database className="h-3.5 w-3.5 text-vin-accent" />
                    PACS Storage
                  </h2>
                  <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                    data.storage.warningLevel === "critical"
                      ? "bg-vin-status-danger-bg text-white"
                      : data.storage.warningLevel === "warning"
                        ? "bg-vin-status-warning-bg text-white"
                        : "bg-vin-status-approved-bg text-white"
                  }`}>
                    {data.storage.available ? data.storage.warningLevel.toUpperCase() : "UNKNOWN"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 text-[11px]">
                  <StorageMetric label="Patients" value={data.storage.patients} />
                  <StorageMetric label="Studies" value={data.storage.studies} />
                  <StorageMetric label="Series" value={data.storage.series} />
                  <StorageMetric label="Instances" value={data.storage.instances} />
                  <StorageMetric label="Disk" value={formatStorageMb(data.storage.diskSizeMb)} />
                  <StorageMetric label="Uncompressed" value={formatStorageMb(data.storage.uncompressedSizeMb)} />
                  <div className="col-span-2 rounded border border-vin-border bg-vin-shell px-3 py-2 text-vin-muted">
                    {data.storage.message}
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_1fr] gap-3">
              <section className="rounded border border-vin-border bg-vin-panel">
                <div className="flex items-center justify-between border-b border-vin-border px-3 py-2">
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">Trạng thái hiện tại</h2>
                  <span className="text-[10px] text-vin-muted">{data.statusCounts.reduce((sum, row) => sum + row.count, 0)} ca</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {data.statusCounts.length === 0 ? (
                    <div className="col-span-2"><EmptyLine text="Chưa có trạng thái." /></div>
                  ) : (
                    data.statusCounts.map(item => (
                      <div key={item.status} className="flex items-center justify-between rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px]">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusTone[item.status] || "bg-vin-text-muted"}`} />
                          <span className="truncate text-vin-text2">{item.label}</span>
                        </div>
                        <span className="font-bold text-white">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded border border-vin-border bg-vin-panel">
                <div className="flex items-center justify-between border-b border-vin-border px-3 py-2">
                  <h2 className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-vin-text2">
                    <Timer className="h-3.5 w-3.5 text-vin-accent" />
                    SLA đọc phim
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  <div className="rounded border border-vin-border bg-vin-shell px-3 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-vin-muted">Nhận ảnh → Ký</div>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {formatDuration(data.kpis.averageReceivedToFinalizedMinutes)}
                    </div>
                  </div>
                  <div className="rounded border border-vin-border bg-vin-shell px-3 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-vin-muted">Backlog chờ đọc</div>
                    <div className="mt-2 text-2xl font-bold text-white">{data.kpis.readyToRead}</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] gap-3">
              <section className="rounded border border-vin-border bg-vin-panel">
                <div className="flex items-center justify-between border-b border-vin-border px-3 py-2">
                  <h2 className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-vin-text2">
                    <UserRoundCheck className="h-3.5 w-3.5 text-vin-accent" />
                    Số ca theo bác sĩ
                  </h2>
                  <span className="text-[10px] text-vin-muted">{data.canViewDoctorStats ? "Final trong kỳ / tháng" : "Ẩn theo phân quyền"}</span>
                </div>
                <div className="min-h-[180px] p-3">
                  {!data.canViewDoctorStats ? (
                    <EmptyLine text="Tài khoản lễ tân/kỹ thuật chỉ xem thống kê vận hành." />
                  ) : data.doctorRows.length === 0 ? (
                    <EmptyLine text="Chưa có báo cáo final trong kỳ." />
                  ) : (
                    <table className="w-full text-left text-[11px]">
                      <thead className="border-b border-vin-border text-[10px] uppercase tracking-wide text-vin-muted">
                        <tr>
                          <th className="pb-2">Bác sĩ</th>
                          <th className="pb-2 text-right">Trong kỳ</th>
                          <th className="pb-2 text-right">Tháng này</th>
                          <th className="pb-2 text-right">Nháp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vin-border/45">
                        {data.doctorRows.map(row => (
                          <tr key={row.doctorId}>
                            <td className="py-2 font-semibold text-white">{row.doctorName}</td>
                            <td className="py-2 text-right text-vin-text2">{row.finalInPeriod}</td>
                            <td className="py-2 text-right text-vin-text2">{row.finalThisMonth}</td>
                            <td className="py-2 text-right text-vin-muted">{row.draftCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              <section className="rounded border border-vin-border bg-vin-panel">
                <div className="flex items-center justify-between border-b border-vin-border px-3 py-2">
                  <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">Queue chờ đọc</h2>
                  <span className="text-[10px] text-vin-muted">{data.pendingQueue.length} ca</span>
                </div>
                <div className="max-h-[340px] overflow-auto p-3 scr-dark">
                  {data.pendingQueue.length === 0 ? (
                    <EmptyLine text="Không có ca đang chờ đọc." />
                  ) : (
                    <div className="space-y-2">
                      {data.pendingQueue.map(row => (
                        <a
                          key={row.id}
                          href={`/report/${encodeURIComponent(row.studyInstanceUid)}`}
                          className="block rounded border border-vin-border bg-vin-shell px-3 py-2 transition hover:border-vin-accent"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-[12px] font-bold text-white">{row.patientName}</div>
                              <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
                                {row.patientId} · {row.accessionNumber}
                              </div>
                            </div>
                            <span className={`shrink-0 rounded px-1.5 py-px text-[9px] font-bold ${priorityTone[row.priority] || priorityTone.ROUTINE}`}>
                              {row.priority}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-vin-muted">
                            <span className="truncate">{row.modality} · {row.studyDescription}</span>
                            <span className="whitespace-nowrap">{formatDuration(row.waitingMinutes)}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <style>{`
              .field-input { height: 2.25rem; border-radius: 0.25rem; border: 1px solid var(--vin-border-subtle); background: var(--vin-bg-sidebar); padding: 0.45rem 0.65rem; font-size: 0.75rem; color: var(--vin-text-primary); outline: none; }
              .field-input:focus { border-color: var(--vin-accent); }
              .scr-dark::-webkit-scrollbar { width: 5px; height: 5px; }
              .scr-dark::-webkit-scrollbar-track { background: transparent; }
              .scr-dark::-webkit-scrollbar-thumb { background: var(--vin-border-subtle); border-radius: 10px; }
              .scr-dark::-webkit-scrollbar-thumb:hover { background: var(--vin-border-strong); }
            `}</style>
          </main>
        ) : null}
      </section>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded border border-vin-border bg-vin-shell px-3 py-6 text-center text-[11px] text-vin-muted">
      {text}
    </div>
  );
}

function StorageMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-vin-border bg-vin-shell px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-vin-muted">{label}</div>
      <div className="mt-1 font-mono text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-r border-b border-white/5 px-3 py-2 last:border-r-0 xl:border-b-0">
      <div className="truncate text-[10px] font-bold uppercase tracking-wide text-vin-muted">{label}</div>
      <div className="mt-1 truncate text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function TatSegmentCard({ segment }: { segment: StatisticsDurationSummary }) {
  return (
    <div className="rounded border border-white/10 bg-vin-shell px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold uppercase tracking-wide text-vin-text2">{segment.label}</div>
          <div className="mt-0.5 text-[10px] text-vin-muted">{segment.count} ca</div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
          segment.breachRate > 20 ? "bg-vin-status-danger-bg text-white" : "border border-white/10 text-vin-muted"
        }`}>
          {formatPercent(segment.breachRate)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <StatCell label="Avg" value={formatDuration(segment.averageMinutes)} />
        <StatCell label="P90" value={formatDuration(segment.p90Minutes)} />
        <StatCell label="P95" value={formatDuration(segment.p95Minutes)} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-vin-muted">
        <span>Target {segment.targetMinutes === null ? "theo priority" : formatDuration(segment.targetMinutes)}</span>
        <span>{segment.breachCount} breach</span>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-vin-muted">{label}</div>
      <div className="mt-0.5 font-mono font-bold text-white">{value}</div>
    </div>
  );
}

function DailyTatChart({ rows, maxMinutes }: { rows: Array<{ date: string; count: number; averageTatMinutes: number | null; p90TatMinutes: number | null; breachRate: number }>; maxMinutes: number }) {
  if (rows.every(row => row.count === 0)) {
    return <div className="py-8 text-center text-[11px] text-vin-muted">Chưa có ca final trong kỳ.</div>;
  }

  return (
    <div className="space-y-2">
      {rows.map(row => {
        const avgWidth = Math.max(2, ((row.averageTatMinutes || 0) / maxMinutes) * 100);
        const p90Width = Math.max(2, ((row.p90TatMinutes || 0) / maxMinutes) * 100);
        return (
          <div key={row.date} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-2 text-[10px]">
            <div className="font-mono text-vin-muted">{row.date.slice(5)}</div>
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-vin-panel">
                <div className="h-full rounded-full bg-vin-accent" style={{ width: `${avgWidth}%` }} />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-vin-panel">
                <div className="h-full rounded-full bg-amber-300" style={{ width: `${p90Width}%` }} />
              </div>
            </div>
            <div className="text-right text-vin-muted">{row.count} ca · {formatPercent(row.breachRate)}</div>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: StatisticsBreakdownRow[] }) {
  return (
    <section className="overflow-hidden rounded border border-white/10 bg-vin-shell">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">{title}</h3>
        <span className="text-[10px] text-vin-muted">{rows.length} nhóm</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-8 text-center text-[11px] text-vin-muted">Chưa có dữ liệu.</div>
      ) : (
        <table className="w-full text-left text-[10px]">
          <thead className="border-b border-white/5 text-vin-muted">
            <tr>
              <th className="px-3 py-2">Nhóm</th>
              <th className="px-2 py-2 text-right">Ca</th>
              <th className="px-2 py-2 text-right">Avg</th>
              <th className="px-2 py-2 text-right">P90</th>
              <th className="px-3 py-2 text-right">Breach</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b border-white/5 last:border-b-0">
                <td className="px-3 py-2 font-mono font-bold text-vin-accent">{row.label}</td>
                <td className="px-2 py-2 text-right text-white">{row.count}</td>
                <td className="px-2 py-2 text-right text-vin-text2">{formatDuration(row.averageTatMinutes)}</td>
                <td className="px-2 py-2 text-right text-vin-text2">{formatDuration(row.p90TatMinutes)}</td>
                <td className="px-3 py-2 text-right text-vin-muted">{row.breachCount} · {formatPercent(row.breachRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function PerformanceOutlierList({ rows }: { rows: StatisticsPerformanceOutlier[] }) {
  return (
    <section className="overflow-hidden rounded border border-red-400/20 bg-vin-shell">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">Outlier vượt SLA</h3>
        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white">{rows.length}</span>
      </div>
      <div className="max-h-[280px] overflow-auto scr-dark">
        {rows.length === 0 ? (
          <div className="px-3 py-8 text-center text-[11px] text-vin-muted">Không có outlier trong kỳ.</div>
        ) : (
          rows.map(row => (
            <a key={row.id} href={row.href} className="block border-b border-white/5 px-3 py-2 transition hover:bg-white/[0.03] last:border-b-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-bold uppercase text-white">{row.patientName}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">{row.patientId} · {row.accessionNumber}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${priorityTone[row.priority] || priorityTone.ROUTINE}`}>
                  {row.priority}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-vin-muted">
                <span className="truncate">{row.modality} · {row.stationAeTitle}</span>
                <span className="whitespace-nowrap text-red-200">
                  {formatDuration(row.turnaroundMinutes)} / {formatDuration(row.thresholdMinutes)}
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
}

function HourlyUtilizationChart({ rows, maxBusyMinutes }: { rows: StatisticsHourlyUtilizationRow[]; maxBusyMinutes: number }) {
  return (
    <section className="rounded border border-white/10 bg-vin-shell px-3 py-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">Theo giờ</h3>
        <span className="text-[10px] text-vin-muted">Busy minutes</span>
      </div>
      <div className="grid h-44 grid-cols-[repeat(24,minmax(0,1fr))] items-end gap-1">
        {rows.map(row => {
          const height = Math.max(4, (row.busyMinutes / maxBusyMinutes) * 100);
          return (
            <div key={row.hour} className="flex h-full min-w-0 flex-col justify-end gap-1">
              <div className="flex flex-1 items-end rounded bg-vin-panel">
                <div
                  className="w-full rounded bg-vin-accent"
                  style={{ height: row.busyMinutes ? `${height}%` : "4px" }}
                  title={`${row.label}: ${formatDuration(row.busyMinutes)} · ${row.studyCount} ca`}
                />
              </div>
              <div className="text-center font-mono text-[8px] text-vin-muted">{row.hour % 3 === 0 ? row.hour : ""}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RoomUtilizationTable({ rows }: { rows: StatisticsRoomUtilizationRow[] }) {
  return (
    <section className="overflow-hidden rounded border border-white/10 bg-vin-shell">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">Ranking phòng / máy</h3>
        <span className="text-[10px] text-vin-muted">{rows.length} phòng</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-8 text-center text-[11px] text-vin-muted">Chưa có dữ liệu phòng máy.</div>
      ) : (
        <div className="max-h-[320px] overflow-auto scr-dark">
          <table className="w-full text-left text-[10px]">
            <thead className="sticky top-0 border-b border-white/5 bg-vin-shell text-vin-muted">
              <tr>
                <th className="px-3 py-2">Phòng / AE</th>
                <th className="px-2 py-2 text-right">Ca</th>
                <th className="px-2 py-2 text-right">Final</th>
                <th className="px-2 py-2 text-right">Busy</th>
                <th className="px-2 py-2 text-right">Util</th>
                <th className="px-3 py-2 text-right">No-show / QC</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.stationAeTitle} className="border-b border-white/5 last:border-b-0">
                  <td className="px-3 py-2">
                    <div className="truncate font-bold text-white">{row.roomName}</div>
                    <div className="mt-0.5 font-mono text-[9px] text-vin-muted">{row.stationAeTitle} · {row.modality}</div>
                  </td>
                  <td className="px-2 py-2 text-right text-white">{row.studyCount}</td>
                  <td className="px-2 py-2 text-right text-vin-text2">{row.finalizedCount}</td>
                  <td className="px-2 py-2 text-right text-vin-text2">{formatDuration(row.estimatedBusyMinutes)}</td>
                  <td className="px-2 py-2 text-right text-vin-text2">{formatPercent(row.utilizationPercent)}</td>
                  <td className="px-3 py-2 text-right text-vin-muted">{row.noShowCount} / {row.qcRejectedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AlertEscalationPanel({
  alerts,
  busyActionId,
  onAcknowledge,
  onResolve,
}: {
  alerts: StatisticsAlerts;
  busyActionId: string;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded border border-vin-border bg-vin-panel">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <div>
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">Alert & escalation</h2>
          <div className="mt-0.5 text-[10px] text-vin-muted">Alert đang mở từ rule SLA, workflow, assign và DICOM node.</div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-vin-muted">
          {alerts.canManageAlerts ? "Có quyền xử lý" : "Chỉ xem"}
        </span>
      </div>

      <div className="grid grid-cols-3 border-b border-white/5">
        <MiniMetric label="Open" value={alerts.open} />
        <MiniMetric label="Ack" value={alerts.acknowledged} />
        <MiniMetric label="Critical" value={alerts.critical} />
      </div>

      <div className="max-h-[420px] overflow-auto scr-dark">
        {alerts.rows.length === 0 ? (
          <div className="px-3 py-10 text-center text-[11px] text-vin-muted">Không có alert đang mở.</div>
        ) : (
          alerts.rows.map(alert => (
            <AlertRowItem
              key={alert.id}
              alert={alert}
              canManage={alerts.canManageAlerts}
              busyActionId={busyActionId}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AlertRowItem({
  alert,
  canManage,
  busyActionId,
  onAcknowledge,
  onResolve,
}: {
  alert: StatisticsAlertRow;
  canManage: boolean;
  busyActionId: string;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}) {
  const severityClass =
    alert.severity === "critical"
      ? "bg-vin-status-danger-bg text-white"
      : alert.severity === "warning"
        ? "bg-vin-status-warning-bg text-white"
        : "border border-white/10 text-vin-muted";
  const ackBusy = busyActionId === `ack:${alert.id}`;
  const resolveBusy = busyActionId === `resolve:${alert.id}`;

  return (
    <div className="border-b border-white/5 px-3 py-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <a href={alert.href} className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${severityClass}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="truncate text-[12px] font-bold text-white">{alert.title}</span>
          </div>
          <div className="mt-1 line-clamp-2 text-[10px] text-vin-muted">{alert.message}</div>
        </a>
        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] text-vin-muted">
          {alert.status}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-vin-muted">
        <span className="truncate">
          {alert.patientName || alert.entityType}
          {alert.priority ? ` · ${alert.priority}` : ""}
        </span>
        <span className="whitespace-nowrap">{formatDuration(alert.ageMinutes)} trước</span>
      </div>

      {canManage && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={ackBusy || resolveBusy || alert.status === "ACKNOWLEDGED"}
            onClick={() => onAcknowledge(alert.id)}
            className="inline-flex h-7 items-center gap-1 rounded border border-white/10 px-2 text-[10px] font-bold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40"
          >
            {ackBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserRoundCheck className="h-3 w-3" />}
            Ack
          </button>
          <button
            type="button"
            disabled={ackBusy || resolveBusy}
            onClick={() => onResolve(alert.id)}
            className="inline-flex h-7 items-center gap-1 rounded border border-emerald-400/30 px-2 text-[10px] font-bold text-emerald-200 transition hover:border-emerald-300 disabled:opacity-40"
          >
            {resolveBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Resolve
          </button>
          <a href={alert.href} className="ml-auto text-[10px] font-semibold text-vin-accent hover:text-white">
            Mở
          </a>
        </div>
      )}
    </div>
  );
}

function WorkloadCenter({
  workload,
  busyActionId,
  onAssignDoctor,
}: {
  workload: StatisticsWorkload;
  busyActionId: string;
  onAssignDoctor: (studyId: string, doctorId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded border border-vin-border bg-vin-panel">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <div>
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-vin-text2">Radiologist workload</h2>
          <div className="mt-0.5 text-[10px] text-vin-muted">
            Backlog theo bác sĩ, ca chưa assign và TAT theo người đọc.
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-vin-muted">
          {workload.currentDoctorOnly ? "Queue của tôi" : "Điều phối chung"}
        </span>
      </div>

      <div className="grid grid-cols-3 border-b border-white/5">
        <MiniMetric label="Assigned" value={workload.totalAssignedActive} />
        <MiniMetric label="Unassigned" value={workload.unassignedCount} />
        <MiniMetric label="Queue" value={workload.queue.length} />
      </div>

      <div className="grid gap-3 p-3 xl:grid-cols-[0.9fr_1.1fr]">
        <WorkloadDoctorTable rows={workload.rows} />
        <WorkloadQueueList
          rows={workload.queue}
          doctors={workload.doctors}
          canManage={workload.canManageAssignments}
          busyActionId={busyActionId}
          onAssignDoctor={onAssignDoctor}
        />
      </div>
    </section>
  );
}

function WorkloadDoctorTable({ rows }: { rows: StatisticsWorkloadDoctorRow[] }) {
  return (
    <section className="overflow-hidden rounded border border-white/10 bg-vin-shell">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">Theo bác sĩ</h3>
        <span className="text-[10px] text-vin-muted">{rows.length} dòng</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-8 text-center text-[11px] text-vin-muted">Chưa có dữ liệu workload.</div>
      ) : (
        <div className="max-h-[320px] overflow-auto scr-dark">
          <table className="w-full text-left text-[10px]">
            <thead className="sticky top-0 border-b border-white/5 bg-vin-shell text-vin-muted">
              <tr>
                <th className="px-3 py-2">Bác sĩ</th>
                <th className="px-2 py-2 text-right">Backlog</th>
                <th className="px-2 py-2 text-right">Draft</th>
                <th className="px-2 py-2 text-right">Final</th>
                <th className="px-3 py-2 text-right">P90</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.doctorId} className="border-b border-white/5 last:border-b-0">
                  <td className="px-3 py-2">
                    <div className="truncate font-bold text-white">{row.doctorName}</div>
                    <div className="mt-0.5 text-[9px] text-vin-muted">{row.slaBreaches} breach SLA</div>
                  </td>
                  <td className="px-2 py-2 text-right text-vin-text2">{row.readyToRead + row.reading}</td>
                  <td className="px-2 py-2 text-right text-vin-text2">{row.draftReports}</td>
                  <td className="px-2 py-2 text-right text-vin-text2">{row.finalizedInPeriod}</td>
                  <td className="px-3 py-2 text-right text-vin-muted">{formatDuration(row.p90TatMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function WorkloadQueueList({
  rows,
  doctors,
  canManage,
  busyActionId,
  onAssignDoctor,
}: {
  rows: StatisticsWorkloadQueueRow[];
  doctors: StatisticsDoctorOption[];
  canManage: boolean;
  busyActionId: string;
  onAssignDoctor: (studyId: string, doctorId: string) => void;
}) {
  const doctorOptions = [
    { value: "UNASSIGNED", label: "Chưa assign" },
    ...doctors.map(doctor => ({ value: doctor.id, label: doctor.name })),
  ];

  return (
    <section className="overflow-hidden rounded border border-white/10 bg-vin-shell">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">Queue assign</h3>
        <span className="text-[10px] text-vin-muted">{canManage ? "Có thể assign" : "Chỉ xem"}</span>
      </div>
      <div className="max-h-[320px] overflow-auto scr-dark">
        {rows.length === 0 ? (
          <div className="px-3 py-8 text-center text-[11px] text-vin-muted">Không có ca trong queue.</div>
        ) : (
          rows.map(row => {
            const busy = busyActionId === `assign:${row.id}`;
            return (
              <div key={row.id} className="border-b border-white/5 px-3 py-2.5 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <a href={row.href} className="min-w-0">
                    <div className="truncate text-[12px] font-bold uppercase text-white">{row.patientName}</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
                      {row.patientId} · {row.accessionNumber}
                    </div>
                  </a>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${priorityTone[row.priority] || priorityTone.ROUTINE}`}>
                    {row.priority}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-vin-muted">
                  <span className="truncate">{row.modality} · {row.statusLabel} · {formatDuration(row.waitingMinutes)}</span>
                  <a href={row.href} className="shrink-0 font-semibold text-vin-accent hover:text-white">Mở</a>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <CustomSelect
                    options={doctorOptions}
                    value={row.assignedDoctorId || "UNASSIGNED"}
                    onChange={value => onAssignDoctor(row.id, value)}
                    disabled={!canManage || busy}
                    compact
                    className="min-w-[180px] flex-1"
                  />
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-vin-accent" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function OperationList({
  title,
  rows,
  emptyText,
  tone,
}: {
  title: string;
  rows: StatisticsOperationRow[];
  emptyText: string;
  tone: "danger" | "warning" | "normal";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-400/25"
      : tone === "warning"
        ? "border-amber-300/25"
        : "border-white/10";

  return (
    <section className={`min-h-[260px] overflow-hidden rounded border bg-vin-shell ${toneClass}`}>
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-vin-text2">{title}</h3>
        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
          {rows.length}
        </span>
      </div>
      <div className="max-h-[340px] overflow-auto scr-dark">
        {rows.length === 0 ? (
          <div className="px-3 py-8 text-center text-[11px] text-vin-muted">{emptyText}</div>
        ) : (
          rows.map(row => <OperationRowItem key={row.id} row={row} />)
        )}
      </div>
    </section>
  );
}

function OperationRowItem({ row }: { row: StatisticsOperationRow }) {
  return (
    <a
      href={row.href}
      className="block border-b border-white/5 px-3 py-2.5 transition hover:bg-white/[0.03] last:border-b-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-bold uppercase text-white">{row.patientName}</div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
            {row.patientId} · {row.accessionNumber}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${priorityTone[row.priority] || priorityTone.ROUTINE}`}>
          {row.priority}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-vin-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusTone[row.status] || "bg-vin-border"}`} />
          <span className="truncate">{row.statusLabel}</span>
        </span>
        <span className="whitespace-nowrap font-semibold text-vin-text2">{formatDuration(row.waitingMinutes)}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-vin-muted">
        <span className="rounded-full border border-white/10 px-1.5 py-px font-mono text-[9px] font-bold text-vin-text2">
          {row.modality}
        </span>
        <span className="min-w-0 truncate">{row.studyDescription}</span>
      </div>

      <div className="mt-1.5 truncate text-[10px] text-vin-muted">
        {row.stationAeTitle !== "-" && <span>{row.stationAeTitle} · </span>}
        {row.reason}
      </div>
    </a>
  );
}
