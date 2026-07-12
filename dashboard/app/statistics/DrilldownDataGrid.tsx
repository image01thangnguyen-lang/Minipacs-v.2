import React, { useMemo } from "react";
import { SharedDataGrid } from "../components/ui/data-grid/DataGrid";
import type { ColumnDef } from "../components/ui/shared-contracts";
import type { StatisticsDrilldownRow } from "./types";

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

export function DrilldownDataGrid({ rows, isLoading }: { rows: StatisticsDrilldownRow[]; isLoading?: boolean }) {
  const columns = useMemo<ColumnDef<StatisticsDrilldownRow>[]>(() => [
    {
      id: "patient",
      header: "Bệnh nhân",
      width: 250,
      cell: (row) => (
        <a href={row.href} className="block min-w-0 hover:underline">
          <div className="truncate font-bold text-white">{row.patientName}</div>
          <div className="mt-0.5 truncate font-mono text-[9px] text-vin-muted">{row.patientId} · {row.accessionNumber}</div>
        </a>
      ),
    },
    {
      id: "modality",
      header: "Modality",
      width: 100,
      cell: (row) => (
        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] font-bold text-vin-text2">
          {row.modality}
        </span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      width: 150,
      cell: (row) => (
        <>
          <div className="font-bold text-vin-text2">{row.statusLabel}</div>
          <div className="mt-0.5 text-[9px] text-vin-muted">{row.priority} · {row.stationAeTitle}</div>
        </>
      ),
    },
    {
      id: "referringPhysician",
      header: "Nguồn gửi",
      width: 150,
      cell: (row) => <span className="text-vin-muted">{row.referringPhysician}</span>,
    },
    {
      id: "service",
      header: "Dịch vụ",
      width: 200,
      cell: (row) => (
        <>
          <div className="truncate text-vin-text2" title={row.procedureDescription || ""}>
            {row.procedureDescription}
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-vin-muted">{row.procedureCode}</div>
        </>
      ),
    },
    {
      id: "timestamp",
      header: "Mốc",
      width: 150,
      align: "right",
      cell: (row) => (
        <span className="text-vin-muted">
          {formatDateTime(row.receivedAt || row.scheduledAt || row.finalizedAt)}
        </span>
      ),
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      renderLimit={150}
      emptyState={<div className="px-3 py-10 text-center text-[11px] text-vin-muted">Không có ca phù hợp bộ lọc hiện tại.</div>}
      ariaLabel="Danh sách drilldown thống kê"
    />
  );
}
