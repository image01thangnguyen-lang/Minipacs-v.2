"use client";
import { useEffect, useState } from "react";
import { Loader2, Save, Info } from "lucide-react";
import { getDoctorsAndNodesAction, getMatrixAction, saveMatrixAction, PermissionUpdate } from "../actions";
import { MACHINE_ACTION_KEYS } from "@/lib/authz/machine-action-keys";
import { CustomSelect } from "@/app/components/CustomSelect";

type CellState = "ALLOW" | "DENY" | "DEFAULT";

// Map to translate keys for UI
const ACTION_LABELS: Record<string, string> = {
  READ_STUDY: "Mở ca chụp",
  EDIT_CLINICAL: "Sửa TT lâm sàng",
  ASSIGN_CASE: "Gán ca",
  DRAFT_REPORT: "Đọc/Nháp",
  SIGN_REPORT: "Ký kết quả",
  APPROVE_REPORT: "Duyệt kết quả",
  UNFINALIZE_REPORT: "Hủy duyệt",
  CANCEL_DRAFT: "Hủy nháp",
  DELIVER_RESULT: "Trả kết quả",
  SYNC_HIS: "Đồng bộ HIS",
};

export function LegacyMatrixTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [doctors, setDoctors] = useState<{ id: string; fullName: string; role: string }[]>([]);
  const [nodes, setNodes] = useState<{ id: string; name: string; modality: string; isNonDicom: boolean }[]>([]);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // matrixState: Record<dicomNodeId, Record<actionKey, CellState>>
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, CellState>>>({});
  // to track changes
  const [originalMatrix, setOriginalMatrix] = useState<Record<string, Record<string, CellState>>>({});

  useEffect(() => {
    async function loadInitial() {
      try {
        const { doctors: dList, nodes: nList } = await getDoctorsAndNodesAction();
        setDoctors(dList);
        setNodes(nList);
        if (dList.length > 0) {
          setSelectedDoctorId(dList[0].id);
        }
      } catch (e: any) {
        setError("Không thể tải danh sách bác sĩ/máy");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadMatrix() {
      if (!selectedDoctorId) return;
      setLoading(true);
      try {
        const permissions = await getMatrixAction(selectedDoctorId);
        const newState: Record<string, Record<string, CellState>> = {};

        nodes.forEach(n => {
          newState[n.id] = {};
          MACHINE_ACTION_KEYS.forEach(ak => {
            newState[n.id][ak] = "DEFAULT";
          });
        });

        permissions.forEach(p => {
          if (newState[p.dicomNodeId]) {
            newState[p.dicomNodeId][p.actionKey] = p.allow ? "ALLOW" : "DENY";
          }
        });

        setMatrixState(newState);
        setOriginalMatrix(JSON.parse(JSON.stringify(newState))); // deep copy
      } catch (e: any) {
        setError("Không thể tải ma trận phân quyền");
      } finally {
        setLoading(false);
      }
    }
    if (nodes.length > 0) {
      loadMatrix();
    }
  }, [selectedDoctorId, nodes]);

  const handleCellChange = (nodeId: string, actionKey: string, val: CellState) => {
    setMatrixState(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [actionKey]: val
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedDoctorId) return;

    // Compute changes
    const updates: PermissionUpdate[] = [];
    nodes.forEach(n => {
      MACHINE_ACTION_KEYS.forEach(ak => {
        const current = matrixState[n.id][ak];
        const orig = originalMatrix[n.id]?.[ak] || "DEFAULT";
        if (current !== orig) {
          updates.push({
            dicomNodeId: n.id,
            actionKey: ak as any,
            state: current
          });
        }
      });
    });

    if (updates.length === 0) {
      setMessage("Không có thay đổi nào để lưu");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await saveMatrixAction(selectedDoctorId, updates);
      if (res.success) {
        setMessage("Lưu phân quyền thành công");
        setOriginalMatrix(JSON.parse(JSON.stringify(matrixState)));
      } else {
        setError(res.error || "Lỗi lưu phân quyền");
      }
    } catch (e) {
      setError("Đã xảy ra lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(matrixState) !== JSON.stringify(originalMatrix);

  if (loading && nodes.length === 0) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-vin-muted" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-64">
          <CustomSelect
            options={doctors.map(d => ({ value: d.id, label: `${d.fullName} (${d.role})` }))}
            value={selectedDoctorId}
            onChange={(val) => {
              if (val && val !== selectedDoctorId) setSelectedDoctorId(val);
            }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 rounded bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accentHover disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu thay đổi
        </button>
      </div>

      {(message || error) && (
        <div className={`rounded border px-3 py-2 text-sm font-semibold ${
          error
            ? "border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 text-red-200"
            : "border-vin-status-approved-bg/60 bg-vin-status-approved-bg/15 text-emerald-100"
        }`}>
          {error || message}
        </div>
      )}

      <div className="rounded-lg border border-vin-border bg-vin-panel overflow-x-auto shadow-sm">
        <div className="flex items-center gap-2 border-b border-vin-border bg-vin-shell p-3 text-sm text-vin-muted">
          <Info className="h-4 w-4" />
          <span><strong>Mặc định (---)</strong>: Kế thừa quyền từ System Role. <strong>Allow (Cho)</strong>: Cho phép ở cấp thiết bị (vẫn cần quyền global). <strong>Deny (Chặn)</strong>: Chặn bất kể quyền global.</span>
        </div>
        {loading && nodes.length > 0 ? (
           <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-vin-muted" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-vin-shell text-vin-muted">
              <tr>
                <th className="sticky left-0 z-20 w-64 min-w-[200px] border-r border-vin-border bg-vin-shell px-4 py-3 font-semibold">Thiết bị \ Hành động</th>
                {MACHINE_ACTION_KEYS.map(ak => (
                  <th key={ak} className="px-3 py-3 font-semibold text-center min-w-[120px]">
                    {ACTION_LABELS[ak] || ak}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-vin-border">
              {nodes.map(node => (
                <tr key={node.id} className="transition hover:bg-vin-tableHover">
                  <td className="px-4 py-3 border-r border-vin-border sticky left-0 bg-vin-panel z-10">
                    <div className="font-semibold text-white">{node.name}</div>
                    <div className="text-sm text-vin-muted mt-0.5">
                      {node.modality} {node.isNonDicom ? "(Non-DICOM)" : ""}
                    </div>
                  </td>
                  {MACHINE_ACTION_KEYS.map(ak => {
                    const state = matrixState[node.id]?.[ak] || "DEFAULT";
                    return (
                      <td key={ak} className="px-3 py-2 text-center">
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                          <button
                            type="button"
                            onClick={() => handleCellChange(node.id, ak, "ALLOW")}
                            className={`px-2 py-1 text-sm font-medium border border-vin-border rounded-l-md transition
                              ${state === "ALLOW" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 z-10" : "bg-transparent text-vin-muted hover:bg-vin-tableHover hover:text-white"}`}
                          >
                            Cho
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCellChange(node.id, ak, "DEFAULT")}
                            className={`px-2 py-1 text-sm font-medium border-t border-b border-vin-border transition
                              ${state === "DEFAULT" ? "bg-vin-tableSelected text-white z-10" : "bg-transparent text-vin-muted hover:bg-vin-tableHover hover:text-white"}`}
                          >
                            ---
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCellChange(node.id, ak, "DENY")}
                            className={`px-2 py-1 text-sm font-medium border border-vin-border rounded-r-md transition
                              ${state === "DENY" ? "bg-red-500/20 text-red-400 border-red-500/50 z-10" : "bg-transparent text-vin-muted hover:bg-vin-tableHover hover:text-white"}`}
                          >
                            Chặn
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr>
                  <td colSpan={MACHINE_ACTION_KEYS.length + 1} className="px-4 py-8 text-center text-vin-muted italic">
                    Không có dữ liệu máy chụp
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
