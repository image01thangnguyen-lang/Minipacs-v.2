import React, { useMemo } from "react";
import Link from "next/link";
import { SharedDataGrid } from "../components/ui/data-grid/DataGrid";
import type { ColumnDef } from "../components/ui/shared-contracts";
import { formatDateTime, formatDuration, statusClass, priorityClass, orderStatusLabels, studyStatusLabels } from "./utils";
import type { WorklistOrderView } from "./utils";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  UserCheck,
  XCircle,
  Edit3,
  FileText,
  PlusCircle,
  Camera,
  RefreshCcw,
  MonitorUp,
  Loader2,
} from "lucide-react";

interface WorklistDataGridProps {
  rows: WorklistOrderView[];
  isLoading: boolean;
  busyOrderId: string;
  onCheckin: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onRegen: (orderId: string) => void;
  onHisSync: (accessionNumber: string) => void;
  onOpenClinical: (order: WorklistOrderView, mode: "CLINICAL_INFO" | "INDICATION") => void;
  onOpenViewer: (order: WorklistOrderView) => void;
  onStartReading: (order: WorklistOrderView) => void;
  onNonDicomCapture: (order: WorklistOrderView) => void;
}

export function WorklistDataGrid({
  rows,
  isLoading,
  busyOrderId,
  onCheckin,
  onCancel,
  onRegen,
  onHisSync,
  onOpenClinical,
  onOpenViewer,
  onStartReading,
  onNonDicomCapture,
}: WorklistDataGridProps) {
  const columns = useMemo<ColumnDef<WorklistOrderView>[]>(() => {
    return [
      {
        id: "index",
        header: "#",
        width: 40,
        align: "center",
        cell: (_, index) => <span className="font-mono text-vin-text">{index + 1}</span>,
      },
      {
        id: "patient",
        header: "Bệnh nhân",
        pinned: "left",
        width: 200,
        cell: (order) => (
          <>
            <div className="max-w-[180px] truncate font-semibold uppercase tracking-[0.01em] text-white">{order.patientName}</div>
            <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
              {order.patientId} &bull; {order.gender || "?"} &bull; {order.phone || "-"}
            </div>
          </>
        ),
      },
      {
        id: "indication",
        header: "Chỉ định",
        width: 260,
        cell: (order) => (
          <>
            <div className="max-w-[240px] truncate font-medium text-vin-text2" title={order.procedureDescription || ""}>
              {order.procedureName || order.procedureDescription || "-"}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold leading-none ${priorityClass(order.priority)}`}>{order.priority}</span>
              <span className="truncate font-mono text-[10px] text-vin-muted">{order.procedureCode || order.accessionNumber}</span>
            </div>
            <div className="mt-0.5 max-w-[240px] truncate text-[10px] text-vin-muted">
              {order.serviceTypeName || "Fallback DICOM"}{order.clinicalInfo ? " · Co lam sang" : ""}
            </div>
          </>
        ),
      },
      {
        id: "modality",
        header: "Mod",
        align: "center",
        width: 80,
        cell: (order) => (
          <>
            <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-vin-accent/40 bg-vin-accentSoft/15 px-2 py-0.5 font-mono text-[10px] font-bold leading-none text-cyan-100">
              {order.modality}
            </span>
            <div className="mt-1 text-[10px] text-vin-muted">{order.bodyPart || "-"}</div>
          </>
        ),
      },
      {
        id: "schedule",
        header: "Lịch",
        width: 170,
        cell: (order) => (
          <>
            <div className="flex items-center gap-1 text-vin-text2">
              <Clock className="h-3 w-3 text-vin-accent" />
              {formatDateTime(order.scheduledDate)}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-vin-muted">
              AE: {order.stationAeTitle || order.scheduledStationAeTitle || "AETITLE"}
            </div>
            <div className="mt-0.5 max-w-[150px] truncate text-[10px] text-vin-muted">
              {order.machineName || order.scheduledStationName || "-"}{order.facilityName ? ` · ${order.facilityName}` : ""}
            </div>
          </>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        align: "center",
        width: 130,
        cell: (order) => (
          <>
            <span className={`inline-flex max-w-[110px] items-center justify-center truncate rounded-full border px-2.5 py-1 text-[9px] font-bold leading-none ${statusClass(order.orderStatus)}`}>
              {orderStatusLabels[order.orderStatus] || order.orderStatus}
            </span>
            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-vin-muted">
              {order.orthancStudyId ? studyStatusLabels[order.studyStatus || ""] || order.studyStatus : "Chưa có ảnh"}
              {order.noDicomOverdue && (
                <span title="Quá hạn 24h chưa có ảnh">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                </span>
              )}
            </div>
            <div className="mt-1 text-[9px] text-vin-muted">
              {order.isDicomMatched ? "Da match DICOM" : `Cho ${formatDuration(order.waitingMinutes)}`}
            </div>
            {order.hisSyncStatus && (
              <Link href={`/admin/his`} onClick={(e) => e.stopPropagation()} className={`mt-1 block w-fit mx-auto rounded px-1.5 py-0.5 text-[9px] font-semibold transition hover:opacity-80 ${order.hisSyncStatus === 'FAILED' ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-300'}`} title="Click to view HIS Logs">
                HIS order: {order.hisSyncStatus}
              </Link>
            )}
            {order.hisResultStatus && (
              <div className={`mt-1 text-[9px] font-semibold ${order.hisResultStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}`}>
                HIS result: {order.hisResultStatus}
              </div>
            )}
            <div className="mt-1 max-w-[140px] truncate mx-auto text-[9px] text-vin-muted">
              {order.assignedDoctorName ? `BS: ${order.assignedDoctorName}` : "Chua gan BS"}
              {order.technologistName ? ` · KTV: ${order.technologistName}` : ""}
            </div>
          </>
        ),
      },
      {
        id: "actions",
        header: "Tác vụ",
        align: "right",
        width: 190,
        pinned: "right",
        cell: (order) => {
          const isBusy = busyOrderId === order.id;
          const isHisBusy = busyOrderId === order.accessionNumber;
          const canMutate = order.orderStatus !== "CANCELLED";
          const canOpenViewer = Boolean(order.studyInstanceUid && order.studyStatus && !["ORDERED", "READY_FOR_SCAN"].includes(order.studyStatus));
          const canLockForReading = order.allowedActions?.draftReport && Boolean(order.studyInstanceUid && order.studyStatus && ["READY_TO_READ", "READING"].includes(order.studyStatus));

          return (
            <div className="flex justify-end gap-1 flex-wrap">
              {order.orderStatus === "SCHEDULED" && (
                <IconButton title="Check-in" disabled={isBusy} onClick={() => onCheckin(order.id)}>
                  <UserCheck className="h-3.5 w-3.5" />
                </IconButton>
              )}
              {order.allowedActions?.syncHis && (
                <IconButton title="Cập nhật từ HIS" disabled={isHisBusy} onClick={() => onHisSync(order.accessionNumber)}>
                  <RefreshCcw className={`h-3.5 w-3.5 ${isHisBusy ? "animate-spin" : ""}`} />
                </IconButton>
              )}
              {canMutate && (
                <IconButton title="Tạo lại MWL" disabled={isBusy} onClick={() => onRegen(order.id)}>
                  <MonitorUp className="h-3.5 w-3.5" />
                </IconButton>
              )}
              {canOpenViewer && !order.isNonDicom && (
                <IconButton title="Mở viewer" disabled={isBusy} onClick={() => onOpenViewer(order)}>
                  <BadgeCheck className="h-3.5 w-3.5" />
                </IconButton>
              )}
              {order.isNonDicomEligible && (
                <IconButton title={order.nonDicomExamId ? "Mở chụp/tải Non-DICOM" : "Tạo ca Non-DICOM"} disabled={isBusy} onClick={() => onNonDicomCapture(order)}>
                  <Camera className="h-3.5 w-3.5 text-indigo-400" />
                </IconButton>
              )}
              {canLockForReading && (
                <IconButton title="Đọc ca (khóa)" disabled={isBusy} onClick={() => onStartReading(order)}>
                  <Edit3 className="h-3.5 w-3.5" />
                </IconButton>
              )}
              {order.allowedActions?.editClinical && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenClinical(order, "CLINICAL_INFO"); }}
                  disabled={!order.orthancStudyId}
                  className="rounded border border-vin-border bg-vin-panel p-1.5 text-vin-muted transition hover:border-vin-accent hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                  title={order.orthancStudyId ? "Cập nhật lâm sàng" : "Order chưa có DICOM study"}
                >
                  <FileText className="h-4 w-4" />
                </button>
              )}
              {order.allowedActions?.editClinical && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenClinical(order, "INDICATION"); }}
                  disabled={!order.orthancStudyId}
                  className="rounded border border-vin-border bg-vin-panel p-1.5 text-vin-muted transition hover:border-vin-accent hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-30"
                  title={order.orthancStudyId ? "Thêm chỉ định" : "Order chưa có DICOM study"}
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              )}
              {canMutate && (
                <IconButton title="Hủy order" danger disabled={isBusy} onClick={() => onCancel(order.id)}>
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                </IconButton>
              )}
            </div>
          );
        },
      },
    ];
  }, [busyOrderId, onCancel, onCheckin, onHisSync, onNonDicomCapture, onOpenClinical, onOpenViewer, onRegen, onStartReading]);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState="Chưa có order nào trong ngày."
      ariaLabel="Danh sách Worklist"
      renderLimit={150}
    />
  );
}

function IconButton({
  children,
  danger,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex h-7 w-7 items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-vin-status-danger-bg/50 bg-vin-status-danger-bg/15 text-red-200 hover:bg-vin-status-danger-bg/25"
          : "border-vin-border bg-vin-panel text-vin-text2 hover:border-vin-accent hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
