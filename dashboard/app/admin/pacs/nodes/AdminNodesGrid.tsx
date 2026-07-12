import { useMemo } from "react";
import type { ColumnDef } from "@/app/components/ui/shared-contracts";
import { SharedDataGrid } from "@/app/components/ui/data-grid/DataGrid";
import { Network, Loader2, Trash2, Wifi, AlertCircle } from "lucide-react";

type NodeRow = {
  id: string;
  name: string;
  modality: string;
  orthancAlias: string;
  isActive: boolean;
  isNonDicom: boolean;
  facility?: { name: string } | null;
  ipAddress: string;
  port: number;
  room: string | null;
  aeTitle: string;
  lastEchoStatus: string | null;
  lastEchoAt: Date | string | null;
};

export function NodesDataGrid({
  rows,
  isLoading,
  busyNodeId,
  editingNodeId,
  onPing,
  onEdit,
  onDelete,
}: {
  rows: NodeRow[];
  isLoading: boolean;
  busyNodeId: string;
  editingNodeId?: string;
  onPing: (id: string) => void;
  onEdit: (node: NodeRow) => void;
  onDelete: (id: string) => void;
}) {
  const columns = useMemo<ColumnDef<NodeRow>[]>(() => [
    {
      id: "nameAndAlias",
      header: "Tên & Alias",
      width: 250,
      cell: (node) => (
        <div className="py-2">
          <div className="font-semibold text-white">{node.name}</div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-vin-muted">
            <span className="rounded bg-vin-panel px-1.5 py-0.5 border border-vin-border">{node.modality}</span>
            {!node.isNonDicom && <span>{node.orthancAlias}</span>}
            {!node.isActive && (
              <span className="rounded bg-red-500/20 px-1 text-red-300">Tắt</span>
            )}
            {node.isNonDicom && (
              <span className="rounded bg-orange-500/20 px-1 text-orange-300">Non-DICOM</span>
            )}
          </div>
          {node.facility && (
            <div className="mt-1 text-[10px] text-vin-muted flex items-center gap-1">
              <span className="font-semibold">{node.facility.name}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "network",
      header: "Mạng (IP:Port)",
      width: 150,
      cell: (node) => (
        <div className="py-2">
          {node.isNonDicom ? (
            <span className="italic text-vin-faint">Không áp dụng</span>
          ) : (
            <span className="font-mono text-vin-text2">{node.ipAddress}:{node.port}</span>
          )}
          <div className="mt-0.5 font-sans text-[10px] text-vin-muted">{node.room || "-"}</div>
        </div>
      ),
    },
    {
      id: "aeTitle",
      header: "AE Title",
      align: "center",
      width: 120,
      cell: (node) => (
        node.isNonDicom ? (
          <span className="text-[10px] italic text-vin-faint">-</span>
        ) : (
          <span className="font-mono font-bold text-vin-accent">{node.aeTitle}</span>
        )
      ),
    },
    {
      id: "connection",
      header: "Kết nối",
      align: "center",
      width: 120,
      cell: (node) => {
        if (node.isNonDicom) {
          return <span className="text-[10px] italic text-vin-faint">-</span>;
        }
        if (node.lastEchoStatus === "OK") {
          return (
            <div className="flex flex-col items-center justify-center">
              <span className="flex items-center gap-1 rounded bg-vin-status-approved-bg/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <Wifi className="h-3 w-3" /> OK
              </span>
              <span className="mt-1 text-[9px] text-vin-faint">
                {node.lastEchoAt ? new Date(node.lastEchoAt).toLocaleString('vi-VN') : ""}
              </span>
            </div>
          );
        }
        if (node.lastEchoStatus === "FAILED") {
          return (
            <div className="flex flex-col items-center justify-center">
              <span className="flex items-center gap-1 rounded bg-vin-status-danger-bg/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                <AlertCircle className="h-3 w-3" /> FAILED
              </span>
            </div>
          );
        }
        return <span className="text-[10px] text-vin-muted">Chưa test</span>;
      },
    },
    {
      id: "actions",
      header: "Tác vụ",
      align: "right",
      width: 120,
      cell: (node) => {
        const isBusy = busyNodeId === node.id;
        return (
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {!node.isNonDicom && (
              <button
                type="button"
                title="Kiểm tra kết nối (C-Echo)"
                aria-label={`Kiểm tra kết nối ${node.name}`}
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); onPing(node.id); }}
                className="flex h-7 w-7 items-center justify-center rounded border border-vin-border bg-vin-panel text-vin-accent transition hover:border-vin-accent hover:bg-vin-accent/10 disabled:opacity-40"
              >
                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Network className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              type="button"
              title="Sửa cấu hình"
              aria-label={`Sửa cấu hình ${node.name}`}
              disabled={isBusy}
              onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              className="flex h-7 w-7 items-center justify-center rounded border border-vin-border bg-vin-panel text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40"
            >
              Sửa
            </button>
            <button
              type="button"
              title="Xóa máy chụp"
              aria-label={`Xóa máy chụp ${node.name}`}
              disabled={isBusy}
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="flex h-7 w-7 items-center justify-center rounded border border-vin-status-danger-bg/50 bg-vin-status-danger-bg/10 text-red-300 transition hover:bg-vin-status-danger-bg/30 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    }
  ], [busyNodeId, onPing, onEdit, onDelete]);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<div className="py-12 text-center text-vin-muted">Chưa có máy chụp nào được khai báo.</div>}
      ariaLabel="Danh sách máy chụp"
      onRowClick={(row) => onEdit(row)}
      selectedIds={editingNodeId ? [editingNodeId] : []}
    />
  );
}
