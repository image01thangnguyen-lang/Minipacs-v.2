"use client";

import { useEffect, useState } from "react";
import { Loader2, Link2, Unlink } from "lucide-react";
import {
  getOrganizationTreeAction,
  getDicomNodesMappingAction,
  assignDicomNodeAction,
  reactivateDicomNodeAction
} from "../actions";
import { MachineMappingGrid } from "./MachineMappingGrid";

export function MachineMapping() {
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [fData, nData] = await Promise.all([
        getOrganizationTreeAction(),
        getDicomNodesMappingAction(includeInactive)
      ]);
      setFacilities(fData);
      setNodes(nData);
    } catch (error) {
      console.error(error);
      setError("Không thể tải dữ liệu gắn kết máy chụp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [includeInactive]);

  const handleAssign = async (nodeId: string, facilityId: string | null) => {
    setSaving(nodeId);
    setError("");
    try {
      const res = await assignDicomNodeAction(nodeId, facilityId);
      if (res.success) {
        setNodes(current => current.map(n => n.id === nodeId ? { ...n, facilityId } : n));
      } else {
        setError(res.error || "Không thể cập nhật đơn vị tổ chức.");
      }
    } catch {
      setError("Không thể cập nhật đơn vị tổ chức. Vui lòng thử lại.");
    } finally {
      setSaving(null);
    }
  };

  const handleReactivate = async (nodeId: string) => {
    setSaving(nodeId);
    setError("");
    try {
      const res = await reactivateDicomNodeAction(nodeId);
      if (res.success) {
        setNodes(current => current.map(n => n.id === nodeId ? { ...n, isActive: true } : n));
      } else {
        setError(res.error || "Không thể khôi phục máy chụp.");
      }
    } catch {
      setError("Không thể khôi phục máy chụp. Vui lòng thử lại.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-vin-muted" /></div>;
  }

  const enableSharedUI = process.env.NEXT_PUBLIC_ENABLE_ADMIN_FACILITIES_SHARED_UI === "true";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-sm text-vin-muted cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-vin-border bg-vin-bg"
          />
          Hiển thị máy chụp đã ngừng hoạt động
        </label>
      </div>

      {error && (
        <div role="alert" className="rounded border border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-vin-border bg-vin-panel overflow-x-auto shadow-sm">
        {enableSharedUI ? (
          <MachineMappingGrid
            nodes={nodes}
            facilities={facilities}
            saving={saving}
            onAssign={handleAssign}
            onReactivate={handleReactivate}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-vin-bg text-vin-muted">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-vin-border">Máy chụp (DICOM Node)</th>
                <th className="px-4 py-3 font-semibold border-b border-vin-border">Modality / AE Title</th>
                <th className="px-4 py-3 font-semibold border-b border-vin-border">Đơn vị tổ chức</th>
                <th className="px-4 py-3 font-semibold border-b border-vin-border w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vin-border">
              {nodes.map(node => (
                <tr key={node.id} className={`transition ${node.isActive ? "hover:bg-vin-bg/50" : "bg-vin-bg/30 opacity-70"}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">
                      {node.name}
                      {!node.isActive && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Ngừng hoạt động</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-vin-muted">
                    {node.modality} / {node.aeTitle || <span className="italic">Chưa cấu hình</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full rounded border border-vin-border bg-vin-bg px-3 py-1.5 text-white text-sm"
                      value={node.facilityId || ""}
                      onChange={(e) => handleAssign(node.id, e.target.value || null)}
                      disabled={saving === node.id || !node.isActive}
                    >
                      <option value="">-- Chưa gắn vào đơn vị nào --</option>
                      {facilities.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.code})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {saving === node.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-vin-muted mx-auto" />
                    ) : !node.isActive ? (
                      <button
                        onClick={() => handleReactivate(node.id)}
                        className="text-vin-muted hover:text-green-400 text-xs flex items-center gap-1 justify-center mx-auto"
                      >
                        Khôi phục
                      </button>
                    ) : node.facilityId ? (
                      <button
                        onClick={() => handleAssign(node.id, null)}
                        className="text-vin-muted hover:text-red-400 mx-auto block"
                        title="Gỡ gắn kết"
                      >
                        <Unlink className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        className="text-vin-muted opacity-50 cursor-not-allowed mx-auto block"
                        title="Chưa gắn kết"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-vin-muted italic">
                    Không có máy chụp nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
