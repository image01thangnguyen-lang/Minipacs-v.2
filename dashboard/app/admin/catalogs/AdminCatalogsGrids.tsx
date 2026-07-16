import React, { useMemo } from "react";
import { SharedDataGrid } from "@/app/components/ui/data-grid/DataGrid";
import { ColumnDef } from "@/app/components/ui/shared-contracts";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-sm font-bold ${
      active ? "bg-vin-status-approved-bg text-white" : "bg-vin-status-danger-bg text-white"
    }`}>
      {active ? "Đang dùng" : "Đã khóa"}
    </span>
  );
}

export function ServicesDataGrid({ rows, isLoading, selectedId, onSelect }: any) {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    { id: "index", header: "TT", width: 60, align: "center", cell: (_, i) => <span className="font-mono text-vin-text">{i + 1}</span> },
    { id: "code", header: "Mã", width: 120, cell: (item) => <span className="font-mono text-white">{item.code}</span> },
    { id: "name", header: "Tên / Mô tả", width: 250, cell: (item) => <span className="font-semibold text-white">{item.name}</span> },
    { id: "status", header: "Trạng thái", width: 120, align: "center", cell: (item) => <StatusBadge active={item.isActive} /> },
    { id: "modality", header: "Modality", width: 120, align: "center", cell: (item) => <span className="font-mono">{item.defaultModality || "-"}</span> },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<div className="py-12 text-center text-vin-muted">Không có dữ liệu.</div>}
      ariaLabel="Loại dịch vụ"
      onRowClick={(row) => onSelect(row.id)}
      selectedIds={selectedId ? [selectedId] : undefined}
    />
  );
}

export function ProceduresDataGrid({ rows, isLoading, selectedId, onSelect }: any) {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    { id: "index", header: "TT", width: 60, align: "center", cell: (_, i) => <span className="font-mono text-vin-text">{i + 1}</span> },
    { id: "code", header: "Mã", width: 120, cell: (item) => <span className="font-mono text-white">{item.code}</span> },
    { id: "name", header: "Tên / Mô tả", width: 250, cell: (item) => (
      <>
        <div className="font-semibold text-white">{item.name}</div>
        <div className="text-sm text-vin-muted">{item.hisCode ? `HIS: ${item.hisCode}` : ""}</div>
      </>
    ) },
    { id: "status", header: "Trạng thái", width: 120, align: "center", cell: (item) => <StatusBadge active={item.isActive} /> },
    { id: "group", header: "Nhóm", width: 150, cell: (item) => item.serviceType?.name || "-" },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<div className="py-12 text-center text-vin-muted">Không có dữ liệu.</div>}
      ariaLabel="Dịch vụ kỹ thuật"
      onRowClick={(row) => onSelect(row.id)}
      selectedIds={selectedId ? [selectedId] : undefined}
    />
  );
}

export function IcdsDataGrid({ rows, isLoading, selectedId, onSelect }: any) {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    { id: "index", header: "TT", width: 60, align: "center", cell: (_, i) => <span className="font-mono text-vin-text">{i + 1}</span> },
    { id: "code", header: "Mã", width: 120, cell: (item) => <span className="font-mono text-white">{item.code}</span> },
    { id: "name", header: "Tên / Mô tả", width: 250, cell: (item) => <span className="font-semibold text-white">{item.name}</span> },
    { id: "status", header: "Trạng thái", width: 120, align: "center", cell: (item) => <StatusBadge active={item.isActive} /> },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<div className="py-12 text-center text-vin-muted">Không có dữ liệu.</div>}
      ariaLabel="Mã ICD"
      onRowClick={(row) => onSelect(row.id)}
      selectedIds={selectedId ? [selectedId] : undefined}
    />
  );
}

export function SuppliesDataGrid({ rows, isLoading, selectedId, onSelect }: any) {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    { id: "index", header: "TT", width: 60, align: "center", cell: (_, i) => <span className="font-mono text-vin-text">{i + 1}</span> },
    { id: "code", header: "Mã", width: 120, cell: (item) => <span className="font-mono text-white">{item.code}</span> },
    { id: "name", header: "Tên / Mô tả", width: 250, cell: (item) => (
      <>
        <div className="font-semibold text-white">{item.name}</div>
        <div className="text-sm text-vin-muted">ĐVT: {item.unit || "-"}</div>
      </>
    ) },
    { id: "status", header: "Trạng thái", width: 120, align: "center", cell: (item) => <StatusBadge active={item.isActive} /> },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<div className="py-12 text-center text-vin-muted">Không có dữ liệu.</div>}
      ariaLabel="Vật tư y tế"
      onRowClick={(row) => onSelect(row.id)}
      selectedIds={selectedId ? [selectedId] : undefined}
    />
  );
}
