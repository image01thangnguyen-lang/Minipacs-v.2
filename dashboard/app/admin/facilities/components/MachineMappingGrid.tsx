import { useMemo } from "react";
import type { ColumnDef } from "@/app/components/ui/shared-contracts";
import { SharedDataGrid } from "@/app/components/ui/data-grid/DataGrid";
import { Loader2, Link2, Unlink } from "lucide-react";

type MappingNode = {
  id: string;
  name: string;
  isActive: boolean;
  modality: string;
  aeTitle: string | null;
  facilityId: string | null;
};

type FacilityOption = { id: string; name: string; code: string };

export function MachineMappingGrid({
  nodes,
  facilities,
  saving,
  onAssign,
  onReactivate,
}: {
  nodes: MappingNode[];
  facilities: FacilityOption[];
  saving: string | null;
  onAssign: (nodeId: string, facilityId: string | null) => void;
  onReactivate: (nodeId: string) => void;
}) {
  const columns = useMemo<ColumnDef<MappingNode>[]>(() => [
    {
      id: "node",
      header: "Máy chụp (DICOM Node)",
      width: 250,
      cell: (node) => (
        <div className="font-semibold text-white">
          {node.name}
          {!node.isActive && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Ngừng hoạt động</span>}
        </div>
      )
    },
    {
      id: "modalityAndAeTitle",
      header: "Modality / AE Title",
      width: 200,
      cell: (node) => (
        <span className="text-vin-muted font-mono text-[11px]">
          {node.modality} / {node.aeTitle || <span className="italic font-sans">Chưa cấu hình</span>}
        </span>
      )
    },
    {
      id: "facility",
      header: "Đơn vị tổ chức",
      width: 250,
      cell: (node) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            aria-label={`Đơn vị tổ chức của ${node.name}`}
            className="w-full rounded border border-vin-border bg-vin-panel2 px-2 py-1 text-white text-[11px] disabled:opacity-50"
            value={node.facilityId || ""}
            onChange={(e) => onAssign(node.id, e.target.value || null)}
            disabled={saving === node.id || !node.isActive}
          >
            <option value="">-- Chưa gắn vào đơn vị nào --</option>
            {facilities.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
        </div>
      )
    },
    {
      id: "actions",
      header: "Thao tác",
      width: 100,
      align: "center",
      cell: (node) => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          {saving === node.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-vin-muted" />
          ) : !node.isActive ? (
            <button 
              type="button"
              onClick={() => onReactivate(node.id)}
              aria-label={`Khôi phục ${node.name}`}
              className="text-vin-muted hover:text-green-400 text-[10px] font-semibold flex items-center gap-1"
            >
              Khôi phục
            </button>
          ) : node.facilityId ? (
            <button 
              type="button"
              onClick={() => onAssign(node.id, null)}
              className="text-vin-muted hover:text-red-400 transition" 
              title="Gỡ gắn kết"
              aria-label={`Gỡ ${node.name} khỏi đơn vị tổ chức`}
            >
              <Unlink className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button 
              type="button"
              className="text-vin-muted opacity-30 cursor-not-allowed" 
              title="Chưa gắn kết"
              aria-label={`${node.name} chưa gắn kết`}
              disabled
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )
    }
  ], [facilities, saving, onAssign, onReactivate]);

  return (
    <SharedDataGrid
      data={nodes}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={false}
      emptyState={<div className="py-12 text-center text-vin-muted italic">Không có máy chụp nào.</div>}
      ariaLabel="Danh sách gắn kết máy chụp"
    />
  );
}
