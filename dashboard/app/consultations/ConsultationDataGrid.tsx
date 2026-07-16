import React, { useMemo } from "react";
import Link from "next/link";
import { SharedDataGrid } from "../components/ui/data-grid/DataGrid";
import type { ColumnDef } from "../components/ui/shared-contracts";
import { statusLabels, statusClasses } from "./utils";
import type { ConsultationView } from "./utils";
import { Video, Calendar, Users } from "lucide-react";

interface ConsultationDataGridProps {
  rows: ConsultationView[];
  isLoading: boolean;
}

export function ConsultationDataGrid({
  rows,
  isLoading,
}: ConsultationDataGridProps) {
  const columns = useMemo<ColumnDef<ConsultationView>[]>(() => {
    return [
      {
        id: "index",
        header: "#",
        width: 40,
        align: "center",
        cell: (_, index) => <span className="font-mono text-vin-text">{index + 1}</span>,
      },
      {
        id: "title",
        header: "Chủ đề / Mô tả",
        pinned: "left",
        width: 350,
        cell: (c) => (
          <>
            <h3 className="font-bold text-white line-clamp-1">{c.title || "Hội chẩn ca chụp"}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-vin-text2">
              {c.description || "Không có mô tả"}
            </p>
          </>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        align: "center",
        width: 140,
        cell: (c) => (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold ${statusClasses[c.status] || "bg-vin-shell text-vin-text2"}`}>
            {statusLabels[c.status] || c.status}
          </span>
        ),
      },
      {
        id: "creator",
        header: "Người tạo",
        width: 180,
        cell: (c) => (
          <span className="font-semibold text-white">
            {c.createdByUser?.fullName || c.createdByUser?.username || "Unknown"}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        width: 160,
        cell: (c) => (
          <div className="flex items-center gap-1.5 text-sm text-vin-text2">
            <Calendar className="h-3 w-3" />
            {new Date(c.createdAt).toLocaleString("vi-VN")}
          </div>
        ),
      },
      {
        id: "participants",
        header: "Thành viên",
        align: "center",
        width: 120,
        cell: (c) => (
          <div className="flex items-center justify-center gap-1 text-sm text-vin-text2">
            <Users className="h-3 w-3 text-vin-muted" />
            <span>{c.participants.length}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Tác vụ",
        align: "right",
        width: 160,
        pinned: "right",
        cell: (c) => (
          <Link
            href={`/consultations/${c.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex w-fit ml-auto items-center justify-center gap-1.5 rounded-lg bg-vin-accent/20 px-3 py-1.5 text-sm font-semibold text-vin-accent transition hover:bg-vin-accent hover:text-white"
          >
            <Video className="h-3.5 w-3.5" />
            Vào phòng
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
      emptyState="Không có cuộc hội chẩn nào."
      ariaLabel="Danh sách hội chẩn"
      renderLimit={150}
    />
  );
}
