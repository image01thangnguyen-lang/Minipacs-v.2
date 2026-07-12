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
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            exam.status === 'REQUESTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            exam.status === 'CAPTURING' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
            exam.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            'bg-slate-500/10 text-slate-400 border-slate-500/20'
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
            <div className="font-medium text-slate-200">{exam.patientName || "Không tên"}</div>
            <div className="text-xs text-slate-400">{exam.patientId} • {exam.caseCode}</div>
          </>
        ),
      },
      {
        id: "demographics",
        header: "Giới tính / NS",
        width: 120,
        cell: (exam) => (
          <>
            <div className="text-slate-300">{exam.patientSex === 'M' ? 'Nam' : exam.patientSex === 'F' ? 'Nữ' : 'Khác'}</div>
            <div className="text-xs text-slate-400">{exam.patientBirthDate ? new Date(exam.patientBirthDate).getFullYear() : '-'}</div>
          </>
        ),
      },
      {
        id: "indication",
        header: "Chỉ định",
        width: 200,
        cell: (exam) => (
          <div className="text-slate-300 truncate" title={exam.indication || ""}>
            {exam.indication || "-"}
          </div>
        ),
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        width: 160,
        cell: (exam) => (
          <div className="text-slate-300">
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
          <div className="text-slate-300">
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
            className="inline-flex w-fit ml-auto items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-300 rounded-md transition-colors text-xs font-medium"
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
          <Camera className="w-10 h-10 text-slate-600 mb-3" />
          <p>Không có ca Non-DICOM nào</p>
        </div>
      }
      ariaLabel="Danh sách ca Non-DICOM"
    />
  );
}
