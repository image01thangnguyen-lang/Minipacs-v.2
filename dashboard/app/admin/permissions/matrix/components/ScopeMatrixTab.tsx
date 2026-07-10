"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Save, Undo2, Play } from "lucide-react";
import { CustomSelect } from "@/app/components/CustomSelect";
import { getPrincipalsAction, getScopeMatrixSnapshotAction, saveScopeMatrixDiffAction, previewScopeMatrixDiffAction } from "../actions";
import { MatrixIntent, PrincipalType, MatrixSnapshot } from "@/lib/authz/scope/scope-matrix-service";
import { SCOPE_CAPABILITIES, CAPABILITY_TO_GLOBAL_PERMISSION } from "@/lib/authz/scope/capability-registry";

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

export function ScopeMatrixTab() {
  const [loading, setLoading] = useState(true);
  const [principals, setPrincipals] = useState<{ id: string; type: PrincipalType; name: string; info: string }[]>([]);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>("");
  
  const [snapshot, setSnapshot] = useState<MatrixSnapshot | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  
  const [intents, setIntents] = useState<MatrixIntent[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  useEffect(() => {
    async function loadInitial() {
      try {
        const { users, roles } = await getPrincipalsAction();
        const pList = [
          ...roles.map(r => ({ id: r.id, type: "ROLE" as const, name: r.name, info: "App Role" })),
          ...users.map(u => ({ id: u.id, type: "USER" as const, name: u.fullName, info: `User (${u.role})` }))
        ];
        setPrincipals(pList);
        if (pList.length > 0) setSelectedPrincipalId(pList[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const selectedPrincipal = useMemo(() => principals.find(p => p.id === selectedPrincipalId), [principals, selectedPrincipalId]);

  useEffect(() => {
    async function loadMatrix() {
      if (!selectedPrincipal) return;
      setLoadingMatrix(true);
      setIntents([]);
      try {
        const snap = await getScopeMatrixSnapshotAction(selectedPrincipal.id, selectedPrincipal.type);
        setSnapshot(snap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMatrix(false);
      }
    }
    loadMatrix();
  }, [selectedPrincipal]);

  const handleCellClick = (nodeId: string, cap: string) => {
    // For MVP, just toggle between ALLOW -> DENY -> REVOKE (DEFAULT)
    // Real implementation requires a modal for reason and validity periods
    // To simplify, we will just toggle and provide a generic reason for DENY
    const currentIntent = intents.find(i => i.nodeId === nodeId && i.capability === cap);
    const existingDirect = snapshot?.matrix[nodeId][cap]?.directGrant;
    
    let newEffect: "ALLOW" | "DENY" | "REVOKE";
    
    if (currentIntent) {
      if (currentIntent.action === "GRANT" && currentIntent.effect === "ALLOW") newEffect = "DENY";
      else if (currentIntent.action === "GRANT" && currentIntent.effect === "DENY") newEffect = "REVOKE";
      else newEffect = "ALLOW";
    } else {
      if (!existingDirect) newEffect = "ALLOW";
      else if (existingDirect.effect === "ALLOW") newEffect = "DENY";
      else newEffect = "REVOKE";
    }
    
    let nextIntents = intents.filter(i => !(i.nodeId === nodeId && i.capability === cap));
    
    let reason: string | null = null;
    if (newEffect === "DENY" || newEffect === "REVOKE" || ["SIGN_REPORT", "APPROVE_REPORT", "UNFINALIZE_REPORT", "DELIVER_RESULT", "SYNC_HIS"].includes(cap)) {
      reason = window.prompt("Nhập lý do bắt buộc cho thay đổi này:")?.trim() || null;
      if (!reason) return;
    }

    if (newEffect === "REVOKE") {
      if (existingDirect) {
        nextIntents.push({ action: "REVOKE", nodeId, capability: cap as any, reason });
      }
    } else {
      nextIntents.push({
        action: "GRANT",
        nodeId,
        capability: cap as any,
        effect: newEffect,
        reason,
        includeDescendants: snapshot?.nodes.find(n => n.id === nodeId)?.type === "FACILITY",
      });
    }
    
    setIntents(nextIntents);
  };

  const handlePreview = async () => {
    if (!selectedPrincipal || !snapshot || intents.length === 0) return;
    try {
      const res = await previewScopeMatrixDiffAction(selectedPrincipal.id, selectedPrincipal.type, intents, snapshot.hash);
      if (res.success) {
        setPreviewData(res.impact);
      } else {
        alert(res.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!selectedPrincipal || !snapshot || intents.length === 0) return;
    setSaving(true);
    try {
      const res = await saveScopeMatrixDiffAction(selectedPrincipal.id, selectedPrincipal.type, intents, snapshot.hash);
      if (res.success) {
        alert("Lưu thành công");
        setPreviewData(null);
        // Reload
        const snap = await getScopeMatrixSnapshotAction(selectedPrincipal.id, selectedPrincipal.type);
        setSnapshot(snap);
        setIntents([]);
      } else {
        alert(res.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const renderCell = (nodeId: string, cap: string) => {
    const cell = snapshot?.matrix[nodeId][cap];
    const intent = intents.find(i => i.nodeId === nodeId && i.capability === cap);
    
    let display = cell?.effectiveDecision || "DEFAULT";
    let isDirect = !!cell?.directGrant;
    
    if (intent) {
      display = intent.action === "REVOKE" ? (cell?.inheritedEffect || "DEFAULT") : intent.effect!;
      isDirect = intent.action === "GRANT";
    }
    
    const colors = {
      ALLOW: "bg-green-100 text-green-700",
      DENY: "bg-red-100 text-red-700",
      DEFAULT: "bg-gray-50 text-gray-400"
    };

    return (
      <td key={cap} className="border p-2 text-center text-xs cursor-pointer hover:bg-gray-50" onClick={() => handleCellClick(nodeId, cap)}>
        <span className={`px-2 py-1 rounded ${colors[display as keyof typeof colors]} ${isDirect ? 'font-bold border border-current' : 'opacity-70'}`}>
          {display}
        </span>
      </td>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-80">
          <CustomSelect
            options={principals.map(p => ({ value: p.id, label: `${p.name} (${p.info})` }))}
            value={selectedPrincipalId}
            onChange={(val) => {
              if (val && val !== selectedPrincipalId) setSelectedPrincipalId(val);
            }}
          />
        </div>
        <div className="flex gap-2">
          {intents.length > 0 && (
            <button onClick={() => setIntents([])} className="flex items-center gap-2 rounded bg-gray-200 px-4 py-2 text-sm font-semibold transition hover:bg-gray-300">
              <Undo2 className="h-4 w-4" /> Reset
            </button>
          )}
          <button onClick={handlePreview} disabled={intents.length === 0} className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
            <Play className="h-4 w-4" /> Preview
          </button>
          <button onClick={handleSave} disabled={saving || intents.length === 0} className="flex items-center gap-2 rounded bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent-hover disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu thay đổi ({intents.length})
          </button>
        </div>
      </div>

      {previewData && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
          <strong>Preview Impact:</strong>
          <ul className="list-disc ml-5 mt-1">
            <li>Tổng số thao tác: {previewData.totalIntents}</li>
            <li>Cấp mới (ALLOW/DENY): {previewData.created}</li>
            <li>Cập nhật: {previewData.updated}</li>
            <li>Thu hồi: {previewData.revoked}</li>
            <li>Capability ảnh hưởng: {previewData.affectedCapabilityCount}</li>
            <li>Cơ sở / thiết bị ảnh hưởng: {previewData.affectedFacilityCount} / {previewData.affectedMachineCount}</li>
          </ul>
        </div>
      )}

      {loadingMatrix ? (
        <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-vin-muted" /></div>
      ) : snapshot ? (
        <>
        <div className="rounded border bg-gray-50 p-3 text-xs text-gray-700">
          <strong>Quyền global (chỉ đọc):</strong> {snapshot.globalPermissions.length ? snapshot.globalPermissions.join(", ") : "Không có"}.
          <span className="ml-2">Ô bị thiếu quyền global sẽ luôn hiển thị DENY. “Chưa cấp” không phải là cho phép mặc định.</span>
        </div>
        <div className="overflow-x-auto rounded border bg-white shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-100 text-vin-muted">
              <tr>
                <th className="border-b p-4 font-semibold w-64">Cơ sở / Thiết bị</th>
                {SCOPE_CAPABILITIES.map(cap => (
                  <th key={cap} className="border-b border-l p-2 font-semibold text-center text-xs">
                    <div className="writing-mode-vertical truncate max-h-24" title={`Global: ${CAPABILITY_TO_GLOBAL_PERMISSION[cap]}`}>
                      {ACTION_LABELS[cap] || cap}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.nodes.map(node => (
                <tr key={node.id} className="border-b hover:bg-gray-50 transition">
                  <td className={`p-4 ${node.type === "MACHINE" ? "pl-10 text-gray-600" : "font-semibold"}`}>
                    {node.name} {node.type === "FACILITY" ? "🏢" : "💻"}
                  </td>
                  {SCOPE_CAPABILITIES.map(cap => renderCell(node.id, cap))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : null}
    </div>
  );
}