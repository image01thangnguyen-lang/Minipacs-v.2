"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
  Printer,
  RefreshCcw,
  Search,
} from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { CustomSelect, type SelectOption } from "@/app/components/CustomSelect";
import { CustomDatePicker } from "@/app/components/CustomDatePicker";
import { PrintTemplateViewer } from "@/app/report/[studyInstanceUid]/components/PrintTemplateViewer";
import {
  getArchiveDoctorsAction,
  getArchiveReportAction,
  logArchivePrintAction,
  markArchiveDeliveredAction,
  searchArchiveStudiesAction,
} from "./actions";
import type { ArchiveDoctorOption, ArchiveReportDetail, ArchiveSearchFilters, ArchiveStudyRow } from "./types";

const modalitySelectOptions: SelectOption[] = [
  { value: "ALL", label: "Modality" },
  { value: "DX", label: "DX" },
  { value: "CR", label: "CR" },
  { value: "US", label: "US" },
  { value: "CT", label: "CT" },
  { value: "MR", label: "MR" },
  { value: "MG", label: "MG" },
];

const statusOptions = [
  { value: "ALL", label: "Tất cả" },
  { value: "REPORT_FINAL", label: "Report final" },
  { value: "FINALIZED", label: "Đã ký" },
  { value: "DELIVERED", label: "Đã trả" },
  { value: "ARCHIVED", label: "Lưu trữ" },
  { value: "DELETED_FROM_PACS", label: "Đã xóa ảnh" },
];

const studyStatusLabels: Record<string, string> = {
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ARCHIVED: "Lưu trữ",
  DELETED_FROM_PACS: "Đã xóa ảnh",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  REPORTED: "Đã có báo cáo",
};

const reportStatusLabels: Record<string, string> = {
  PENDING_APPROVAL: "Chờ duyệt",
  DRAFT: "Nháp",
  FINAL: "Đã duyệt",
};

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

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function statusClass(status: string) {
  if (status === "DELIVERED" || status === "FINALIZED") return "bg-vin-status-approved-bg text-white";
  if (status === "ARCHIVED") return "bg-vin-accentSoft text-white";
  if (status === "DELETED_FROM_PACS") return "bg-vin-status-danger-bg text-white";
  return "bg-vin-status-new-bg text-white";
}

function normalizeFilterValue(value?: string) {
  return value === "ALL" ? "" : value || "";
}

function buildPrintStudyDate(detail: ArchiveReportDetail | null) {
  if (!detail) return "-";
  return formatDate(detail.studyDate || detail.finalizedAt);
}

export default function ArchivePage() {
  const [filters, setFilters] = useState<ArchiveSearchFilters>({
    patientName: "",
    patientId: "",
    accessionNumber: "",
    dateFrom: "",
    dateTo: "",
    modality: "ALL",
    doctorId: "ALL",
    status: "ALL",
  });
  const [rows, setRows] = useState<ArchiveStudyRow[]>([]);
  const [doctors, setDoctors] = useState<ArchiveDoctorOption[]>([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [detail, setDetail] = useState<ArchiveReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: detail ? `Ket_Qua_CDHA_${detail.patientId}_${detail.accessionNumber}` : "Ket_Qua_CDHA",
  });

  useEffect(() => {
    document.title = "Archive - Lịch sử & in lại";
  }, []);

  const viewerLink = useMemo(() => {
    if (!detail?.canOpenViewer) return "";
    return `/viewer/minipacs?StudyInstanceUIDs=${encodeURIComponent(detail.studyInstanceUid)}`;
  }, [detail?.canOpenViewer, detail?.studyInstanceUid]);

  const runSearch = async (nextFilters = filters, keepSelection = false) => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const normalized = {
        ...nextFilters,
        modality: normalizeFilterValue(nextFilters.modality),
        doctorId: normalizeFilterValue(nextFilters.doctorId),
        status: nextFilters.status || "ALL",
      };
      const [resultRows, doctorOptions] = await Promise.all([
        searchArchiveStudiesAction(normalized),
        doctors.length ? Promise.resolve(doctors) : getArchiveDoctorsAction(),
      ]);
      setRows(resultRows);
      setDoctors(doctorOptions);

      if (!keepSelection) {
        setSelectedUid("");
        setDetail(null);
      } else if (selectedUid && !resultRows.some(row => row.studyInstanceUid === selectedUid)) {
        setSelectedUid("");
        setDetail(null);
      }
    } catch (err: any) {
      setError(err?.message || "Không tải được danh sách archive.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
  }, []);

  const loadDetail = async (studyInstanceUid: string) => {
    setSelectedUid(studyInstanceUid);
    setIsDetailLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await getArchiveReportAction(studyInstanceUid);
      if (res.success && res.detail) {
        setDetail(res.detail);
      } else {
        setDetail(null);
        setError(res.error || "Không tải được báo cáo.");
      }
    } catch (err: any) {
      setDetail(null);
      setError(err?.message || "Không tải được báo cáo.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ArchiveSearchFilters, value: string) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const handleSubmitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    runSearch(filters);
  };

  const runPrintAction = async (mode: "PRINT" | "PDF") => {
    if (!detail) return;
    setIsActionBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await logArchivePrintAction(detail.studyInstanceUid, mode);
      if (!res.success) {
        setError(res.error || "Không ghi được log thao tác.");
        return;
      }
      setMessage(mode === "PDF" ? "Đã ghi log xuất PDF." : "Đã ghi log in lại.");
      handlePrint();
    } catch (err: any) {
      setError(err?.message || "Không thực hiện được thao tác in.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const markDelivered = async () => {
    if (!detail) return;
    setIsActionBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await markArchiveDeliveredAction(detail.studyInstanceUid);
      if (!res.success) {
        setError(res.error || "Không ghi nhận được trạng thái đã trả.");
        return;
      }
      await Promise.all([loadDetail(detail.studyInstanceUid), runSearch(filters, true)]);
      setMessage("Đã ghi nhận trả kết quả.");
    } catch (err: any) {
      setError(err?.message || "Không ghi nhận được trạng thái đã trả.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const printContext = detail
    ? {
        patientName: detail.patientName,
        patientId: detail.patientId,
        studyDate: buildPrintStudyDate(detail),
        studyDesc: detail.studyDescription,
        reportContent: detail.findings,
        conclusion: detail.conclusion,
        recommendation: detail.recommendation,
        ...detail.clinicProfile,
        ...detail.doctorPrintInfo,
      }
    : {
        patientName: "",
        patientId: "",
        studyDate: "",
        studyDesc: "",
        reportContent: "",
        conclusion: "",
        recommendation: "",
      };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="archive" />

      <section className="flex h-full min-w-0 flex-1 flex-col bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
                <FileText className="h-4 w-4 text-vin-accent" />
                Lịch sử & In lại / Archive
              </h1>
              <div className="mt-1 text-[11px] text-vin-muted">{rows.length} ca trong danh sách</div>
            </div>
            <button
              type="button"
              onClick={() => runSearch(filters, true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded border border-vin-border bg-vin-panel px-3 py-1.5 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          {(message || error) && (
            <div
              className={`mt-3 rounded border px-3 py-2 text-[11px] font-semibold ${
                error
                  ? "border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 text-red-200"
                  : "border-vin-status-approved-bg/60 bg-vin-status-approved-bg/15 text-emerald-100"
              }`}
            >
              {error || message}
            </div>
          )}

          <form onSubmit={handleSubmitSearch} className="mt-3 grid grid-cols-[1fr_9rem_9rem_8rem_9rem_10rem_10rem_auto] gap-2">
            <div className="grid grid-cols-3 gap-2">
              <input value={filters.patientName || ""} onChange={event => handleFilterChange("patientName", event.target.value)} className="field-input" placeholder="Tên bệnh nhân" />
              <input value={filters.patientId || ""} onChange={event => handleFilterChange("patientId", event.target.value)} className="field-input font-mono" placeholder="Patient ID" />
              <input value={filters.accessionNumber || ""} onChange={event => handleFilterChange("accessionNumber", event.target.value)} className="field-input font-mono" placeholder="Accession / Study UID" />
            </div>
            <CustomDatePicker value={filters.dateFrom || ""} onChange={val => handleFilterChange("dateFrom", val)} title="Từ ngày" compact />
            <CustomDatePicker value={filters.dateTo || ""} onChange={val => handleFilterChange("dateTo", val)} title="Đến ngày" compact />
            <CustomSelect
              options={modalitySelectOptions}
              value={filters.modality || "ALL"}
              onChange={val => handleFilterChange("modality", val)}
              compact
              mono
            />
            <CustomSelect
              options={[
                { value: "ALL", label: "Bác sĩ" },
                ...doctors.map(d => ({ value: d.id, label: d.name })),
              ]}
              value={filters.doctorId || "ALL"}
              onChange={val => handleFilterChange("doctorId", val)}
              compact
            />
            <CustomSelect
              options={statusOptions}
              value={filters.status || "ALL"}
              onChange={val => handleFilterChange("status", val)}
              compact
            />
            <button type="submit" disabled={isLoading} className="flex h-9 items-center justify-center gap-1.5 rounded border-0 bg-vin-accent px-3 text-[11px] font-bold text-white transition hover:bg-vin-accentHover disabled:opacity-40">
              <Search className="h-3.5 w-3.5" />
              Tìm
            </button>
          </form>
        </div>

        <main className="grid min-h-0 flex-1 grid-cols-[minmax(680px,1fr)_420px] overflow-hidden">
          <section className="min-h-0 overflow-auto border-r border-vin-border scr-dark">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-vin-border bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
                <tr>
                  <th className="px-4 py-3">Bệnh nhân</th>
                  <th className="px-3 py-3">Ca chụp</th>
                  <th className="px-3 py-3 text-center">Mod</th>
                  <th className="px-3 py-3">Bác sĩ</th>
                  <th className="px-3 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vin-border/45 text-[11px]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-vin-muted">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
                      Đang tải archive...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-vin-muted">Chưa có ca final/delivered phù hợp.</td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const isSelected = selectedUid === row.studyInstanceUid;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => loadDetail(row.studyInstanceUid)}
                        className={`cursor-pointer transition ${isSelected ? "bg-vin-tableSelected text-white" : "odd:bg-vin-table even:bg-vin-tableAlt hover:bg-vin-tableHover"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="max-w-[220px] truncate font-semibold text-white">{row.patientName}</div>
                          <div className="mt-1 truncate font-mono text-[10px] text-vin-muted">PID: {row.patientId}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[260px] truncate text-vin-text2" title={row.procedureDescription || row.studyDescription}>
                            {row.procedureName || row.procedureDescription || row.studyDescription}
                          </div>
                          <div className="mt-1 truncate font-mono text-[10px] text-vin-muted">{row.procedureCode || row.accessionNumber}</div>
                          <div className="mt-1 max-w-[260px] truncate text-[10px] text-vin-muted">
                            {row.serviceTypeName || row.machineName || "Fallback DICOM"}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex min-w-9 justify-center rounded border border-vin-accent/40 bg-vin-accentSoft/20 px-1.5 py-px font-mono text-[10px] font-bold text-vin-accent">{row.modality}</span>
                          <div className="mt-1 text-[10px] text-vin-muted">{row.bodyPart || "-"}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[150px] truncate text-vin-text2">{row.assignedDoctorName || "Chua gan"}</div>
                          <div className="mt-1 max-w-[150px] truncate text-[10px] text-vin-muted">Report: {row.doctorName}</div>
                          <div className="mt-1 font-mono text-[10px] text-vin-muted">{reportStatusLabels[row.reportStatus] || row.reportStatus}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold ${statusClass(row.studyStatus)}`}>{studyStatusLabels[row.studyStatus] || row.studyStatus}</span>
                          {!row.canOpenViewer && <div className="mt-1 text-[10px] text-amber-200">Không mở ảnh</div>}
                          {(row.hisSyncStatus || row.hisResultStatus) && (
                            <div className="mt-1 flex flex-col gap-0.5 text-[9px] font-semibold">
                              {row.hisSyncStatus && (
                                <span className={row.hisSyncStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}>
                                  HIS Sync: {row.hisSyncStatus}
                                </span>
                              )}
                              {row.hisResultStatus && (
                                <span className={row.hisResultStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}>
                                  HIS Result: {row.hisResultStatus}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-vin-text2">{formatDate(row.studyDate)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          <aside className="min-h-0 overflow-auto bg-vin-panel p-4 scr-dark">
            {isDetailLoading ? (
              <div className="flex h-full flex-col items-center justify-center text-vin-muted">
                <Loader2 className="mb-2 h-5 w-5 animate-spin text-vin-accent" />
                Đang tải báo cáo...
              </div>
            ) : !detail ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-vin-muted">
                <FileText className="mb-3 h-8 w-8 text-vin-faint" />
                <div className="text-sm font-semibold text-vin-text2">Chọn một ca trong danh sách</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-vin-border pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold uppercase text-white">{detail.patientName}</h2>
                      <div className="mt-1 truncate font-mono text-[11px] text-vin-muted">{detail.patientId}</div>
                    </div>
                    <span className={`inline-flex shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${statusClass(detail.studyStatus)}`}>{studyStatusLabels[detail.studyStatus] || detail.studyStatus}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-vin-text2">
                    <Info label="Ngày chụp" value={formatDateTime(detail.studyDate)} />
                    <Info label="Accession" value={detail.accessionNumber} mono />
                    <Info label="Modality" value={detail.modality} mono />
                    <Info label="Bac si duoc gan" value={detail.assignedDoctorName || "Chua gan"} />
                    <Info label="Bac si report/ky" value={detail.doctorName} />
                    <Info label="KTV" value={detail.technologistName || "Chua chon"} />
                    <Info label="Procedure" value={detail.procedureName || detail.procedureDescription || detail.studyDescription} />
                    <Info label="Service" value={detail.serviceTypeName || "Fallback DICOM"} />
                    <Info label="May/Phong" value={detail.machineName || "-"} />
                    <Info label="Co so" value={detail.facilityName || "-"} />
                    <Info label="Delivered" value={formatDateTime(detail.deliveredAt)} />
                    <Info label="HIS order" value={detail.hisSyncStatus || "-"} />
                    <Info label="HIS result" value={detail.hisResultStatus || "-"} />
                  </div>
                </div>

                {detail.clinicalInfo && (
                  <section>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Lam sang</div>
                    <div className="rounded border border-vin-border bg-vin-shell p-3 text-[12px] leading-relaxed text-vin-text2">{detail.clinicalInfo}</div>
                  </section>
                )}

                {detail.imageWarning && (
                  <div className="flex gap-2 rounded border border-vin-status-warning-bg/60 bg-vin-status-warning-bg/15 px-3 py-2 text-[11px] font-semibold text-amber-100">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{detail.imageWarning}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <a href={`/report/${encodeURIComponent(detail.studyInstanceUid)}`} className="flex items-center justify-center gap-1.5 rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white">
                    <FileText className="h-3.5 w-3.5" />
                    Mở report
                  </a>
                  {viewerLink ? (
                    <a href={viewerLink} target="_blank" className="flex items-center justify-center gap-1.5 rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mở OHIF
                    </a>
                  ) : (
                    <button type="button" disabled className="flex items-center justify-center gap-1.5 rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px] font-semibold text-vin-faint opacity-60">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mở OHIF
                    </button>
                  )}
                  <button type="button" onClick={() => runPrintAction("PRINT")} disabled={isActionBusy} className="flex items-center justify-center gap-1.5 rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40">
                    <Printer className="h-3.5 w-3.5" />
                    In lại
                  </button>
                  <button type="button" onClick={() => runPrintAction("PDF")} disabled={isActionBusy} className="flex items-center justify-center gap-1.5 rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40">
                    <FileDown className="h-3.5 w-3.5" />
                    Xuất PDF
                  </button>
                </div>

                {detail.studyStatus === "FINALIZED" && (
                  <button type="button" onClick={markDelivered} disabled={isActionBusy} className="flex w-full items-center justify-center gap-1.5 rounded border border-vin-status-approved-bg/60 bg-vin-status-approved-bg/20 px-3 py-2 text-[11px] font-bold text-emerald-100 transition hover:bg-vin-status-approved-bg/35 disabled:opacity-40">
                    {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Ghi nhận đã trả kết quả
                  </button>
                )}

                <section>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Kết luận</div>
                  <div className="rounded border border-vin-border bg-vin-shell p-3 text-[12px] leading-relaxed text-vin-text2">{detail.conclusion || "-"}</div>
                </section>

                <section>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mô tả</div>
                  <div className="max-h-56 overflow-auto rounded border border-vin-border bg-vin-shell p-3 text-[12px] leading-relaxed text-vin-text2 scr-dark" dangerouslySetInnerHTML={{ __html: detail.findings || "<span>-</span>" }} />
                </section>

                <section>
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                    <Clock3 className="h-3 w-3" />
                    Lịch sử trạng thái
                  </div>
                  <div className="space-y-2">
                    {detail.statusHistory.length === 0 ? (
                      <div className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px] text-vin-muted">Chưa có history.</div>
                    ) : (
                      detail.statusHistory.map(history => (
                        <div key={history.id} className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-vin-text2">
                              {history.fromStatus ? `${studyStatusLabels[history.fromStatus] || history.fromStatus} -> ` : ""}
                              {studyStatusLabels[history.toStatus] || history.toStatus}
                            </span>
                            <span className="whitespace-nowrap text-[10px] text-vin-muted">{formatDateTime(history.createdAt)}</span>
                          </div>
                          <div className="mt-1 text-vin-muted">{history.source}{history.reason ? ` · ${history.reason}` : ""}</div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}
          </aside>
        </main>

        <PrintTemplateViewer ref={printRef} templateHtml={detail?.templateHtml || ""} context={printContext} />

        <style>{`
          .field-input { width: 100%; height: 2.25rem; border-radius: 0.25rem; border: 1px solid var(--vin-border-subtle); background: var(--vin-bg-sidebar); padding: 0.45rem 0.65rem; font-size: 0.75rem; color: var(--vin-text-primary); outline: none; }
          .field-input:focus { border-color: var(--vin-accent); }
          .field-input::placeholder { color: var(--vin-text-faint); }
          .scr-dark::-webkit-scrollbar { width: 5px; height: 5px; }
          .scr-dark::-webkit-scrollbar-track { background: transparent; }
          .scr-dark::-webkit-scrollbar-thumb { background: var(--vin-border-subtle); border-radius: 10px; }
          .scr-dark::-webkit-scrollbar-thumb:hover { background: var(--vin-border-strong); }
        `}</style>
      </section>
    </div>
  );
}

function Info({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wide text-vin-muted">{label}</div>
      <div className={`mt-0.5 truncate ${mono ? "font-mono" : ""}`}>{value || "-"}</div>
    </div>
  );
}
