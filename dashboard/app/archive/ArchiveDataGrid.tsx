import React, { useMemo } from "react";
import Link from "next/link";
import { SharedDataGrid } from "../components/ui/data-grid/DataGrid";
import type { ColumnDef } from "../components/ui/shared-contracts";
import type { ArchiveStudyRow } from "./types";
import { formatDate, reportStatusLabels, statusClass, studyStatusLabels } from "./utils";

interface ArchiveDataGridProps {
  rows: ArchiveStudyRow[];
  isLoading: boolean;
  selectedUid: string | null;
  onSelect: (row: ArchiveStudyRow) => void;
}

export function ArchiveDataGrid({
  rows,
  isLoading,
  selectedUid,
  onSelect,
}: ArchiveDataGridProps) {
  const columns = useMemo<ColumnDef<ArchiveStudyRow>[]>(() => {
    return [
      {
        id: "patient",
        header: "Bệnh nhân",
        pinned: "left",
        width: 250,
        cell: (row) => (
          <>
            <div className="max-w-[220px] truncate font-semibold text-white">{row.patientName}</div>
            <div className="mt-1 truncate font-mono text-sm text-vin-muted">PID: {row.patientId}</div>
          </>
        ),
      },
      {
        id: "procedure",
        header: "Ca chụp",
        cell: (row) => (
          <>
            <div className="max-w-[260px] truncate text-vin-text2" title={row.procedureDescription || row.studyDescription}>
              {row.procedureName || row.procedureDescription || row.studyDescription}
            </div>
            <div className="mt-1 truncate font-mono text-sm text-vin-muted">{row.procedureCode || row.accessionNumber}</div>
            <div className="mt-1 max-w-[260px] truncate text-sm text-vin-muted">
              {row.serviceTypeName || row.machineName || "Fallback DICOM"}
            </div>
          </>
        ),
      },
      {
        id: "modality",
        header: "Mod",
        align: "center",
        width: 100,
        cell: (row) => (
          <>
            <span className="inline-flex min-w-9 justify-center rounded border border-vin-accent/40 bg-vin-accentSoft/20 px-1.5 py-px font-mono text-sm font-bold text-vin-accent">{row.modality}</span>
            <div className="mt-1 text-sm text-vin-muted">{row.bodyPart || "-"}</div>
          </>
        ),
      },
      {
        id: "doctor",
        header: "Bác sĩ",
        width: 180,
        cell: (row) => (
          <>
            <div className="max-w-[150px] truncate text-vin-text2">{row.assignedDoctorName || "Chua gan"}</div>
            <div className="mt-1 max-w-[150px] truncate text-sm text-vin-muted">Report: {row.doctorName}</div>
            <div className="mt-1 font-mono text-sm text-vin-muted">{reportStatusLabels[row.reportStatus] || row.reportStatus}</div>
          </>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        align: "center",
        width: 150,
        cell: (row) => (
          <>
            <span className={`inline-flex rounded px-2 py-0.5 text-sm font-bold ${statusClass(row.studyStatus)}`}>{studyStatusLabels[row.studyStatus] || row.studyStatus}</span>
            {!row.canOpenViewer && <div className="mt-1 text-sm text-amber-200">Không mở ảnh</div>}
            {(row.hisSyncStatus || row.hisResultStatus) && (
              <div className="mt-1 flex flex-col gap-0.5 text-sm font-semibold">
                {row.hisSyncStatus && (
                  <Link href={`/admin/his`} onClick={(e) => e.stopPropagation()} className={`mt-1 block w-fit rounded px-1.5 py-0.5 text-sm font-semibold transition hover:opacity-80 ${row.hisSyncStatus === 'FAILED' ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-300'}`} title="Click to view HIS Logs">
                    HIS Sync: {row.hisSyncStatus}
                  </Link>
                )}
                {row.hisResultStatus && (
                  <span className={row.hisResultStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}>
                    HIS Result: {row.hisResultStatus}
                  </span>
                )}
              </div>
            )}
          </>
        ),
      },
      {
        id: "date",
        header: "Ngày",
        align: "right",
        width: 120,
        cell: (row) => (
          <span className="whitespace-nowrap text-vin-text2">{formatDate(row.studyDate)}</span>
        ),
      },
    ];
  }, []);

  const selectedIds = selectedUid ? [selectedUid] : [];

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.studyInstanceUid}
      isLoading={isLoading}
      emptyState={"Chưa có ca final/delivered phù hợp."}
      onRowClick={onSelect}
      selectedIds={selectedIds}
      ariaLabel="Danh sách Archive"
      renderLimit={150}
    />
  );
}
