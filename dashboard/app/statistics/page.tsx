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
import { getStatisticsDashboardAction } from "./actions";
import type { StatisticsFilters, StatisticsOperationRow, StatisticsPayload } from "./types";

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

  const maxModalityCount = useMemo(
    () => Math.max(1, ...(data?.modalityCounts || []).map(item => item.count)),
    [data?.modalityCounts]
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
