import React, { useMemo } from "react";
import Link from "next/link";
import { SharedDataGrid } from "../components/ui/data-grid/DataGrid";
import type { ColumnDef } from "../components/ui/shared-contracts";
import { Camera } from "lucide-react";

interface NonDicomExamView {
  id: string;
  status: string;
  patientName?: string;
  patientId?: string;
  caseCode?: string;
  patientSex?: string;
  patientBirthDate?: string | Date;
  indication?: string;
  createdAt: string | Date;
  _count?: { media: number };
}

interface NonDicomDataGridProps {
  rows: NonDicomExamView[];
  isLoading: boolean;
}

export function NonDicomDataGrid({
  rows,
  isLoading,
}: NonDicomDataGridProps) {
  const columns = useMemo<ColumnDef<NonDicomExamView>[]>(() => {
    return [
      {
        id: "status",
        header: "Trạng thái",
        width: 140,
        pinned: "left",
        cell: (exam) => (
          <span className={`px-2 py-1 rounded-full text-sm font-medium border ${
            exam.status === 'REQUESTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            exam.status === 'CAPTURING' ? 'bg-vin-accent/10 text-vin-accent border-vin-accent/20' :
            exam.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            'bg-vin-muted/10 text-vin-muted border-vin-border'
          }`}>
            {exam.status}
          </span>
        ),
      },
      {
        id: "patient",
        header: "Case Code / Bệnh nhân",
        width: 250,
        cell: (exam) => (
          <>
            <div className="font-medium text-vin-text">{exam.patientName || "Không tên"}</div>
            <div className="text-sm text-vin-muted">{exam.patientId} • {exam.caseCode}</div>
          </>
        ),
      },
      {
        id: "demographics",
        header: "Giới tính / NS",
        width: 120,
        cell: (exam) => (
          <>
            <div className="text-vin-text2">{exam.patientSex === 'M' ? 'Nam' : exam.patientSex === 'F' ? 'Nữ' : 'Khác'}</div>
            <div className="text-sm text-vin-muted">{exam.patientBirthDate ? new Date(exam.patientBirthDate).getFullYear() : '-'}</div>
          </>
        ),
      },
      {
        id: "indication",
        header: "Chỉ định",
        width: 200,
        cell: (exam) => (
          <div className="text-vin-text2 truncate" title={exam.indication || ""}>
            {exam.indication || "-"}
          </div>
        ),
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        width: 160,
        cell: (exam) => (
          <div className="text-vin-text2">
            {new Date(exam.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
          </div>
        ),
      },
      {
        id: "media",
        header: "Media",
        width: 100,
        align: "center",
        cell: (exam) => (
          <div className="text-vin-text2">
            {exam._count?.media || 0} files
          </div>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        width: 140,
        align: "right",
        pinned: "right",
        cell: (exam) => (
          <Link
            href={`/non-dicom/${exam.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex w-fit ml-auto items-center gap-1.5 px-3 py-1.5 bg-vin-accent/20 text-vin-accent hover:bg-vin-accent/30 hover:text-vin-accent rounded-md transition-colors text-sm font-medium"
          >
            <Camera className="w-3.5 h-3.5" />
            Capture
          </Link>
        ),
      },
    ];
  }, []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      renderLimit={150}
      emptyState={
        <div className="flex flex-col items-center justify-center py-6">
          <Camera className="w-10 h-10 text-vin-faint mb-3" />
          <p>Không có ca Non-DICOM nào</p>
        </div>
      }
      ariaLabel="Danh sách ca Non-DICOM"
    />
  );
}
