"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Plus, Move, Trash2, ShieldAlert, RefreshCw, AlertTriangle, Search, Info, Save, ArrowUp, ArrowDown } from "lucide-react";
import {
  getOrganizationTreeAction,
  createFacilityUnitAction,
  deactivateFacilityUnitAction,
  reactivateFacilityUnitAction,
  moveFacilityUnitAction,
  updateFacilityUnitAction,
  previewMoveImpactAction,
  previewDeactivateImpactAction,
  reorderFacilityUnitsAction
} from "../actions";

type ModalState = {
  type: "ADD" | "MOVE" | "DEACTIVATE" | null;
  targetNode?: any;
};

export function TreeEditor() {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Layout States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Modal States
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Detail Panel States
  const [detailForm, setDetailForm] = useState({ name: "", code: "" });
  const [detailSaving, setDetailSaving] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({ name: "", code: "", type: "HOSPITAL" });
  const [moveForm, setMoveForm] = useState({ newParentId: "" });
  const [deactivateStrategy, setDeactivateStrategy] = useState<"BLOCK" | "CASCADE">("BLOCK");
  const [impact, setImpact] = useState<any>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState("");

  const loadTree = async () => {
    setLoading(true);
    try {
      const data = await getOrganizationTreeAction(includeInactive);
      setUnits(data);
      // Update selected node form if it exists
      if (selectedNodeId) {
        const node = data.find((u: any) => u.id === selectedNodeId);
        if (node) {
          setDetailForm({ name: node.name, code: node.code });
        } else {
          setSelectedNodeId(null);
        }
      }
    } catch (err: any) {
      setError("Không thể tải cây tổ chức");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, [includeInactive]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const res = await createFacilityUnitAction({
      name: addForm.name,
      code: addForm.code,
      type: addForm.type,
      parentId: modal.targetNode ? modal.targetNode.id : null
    });
    if (res.success) {
      setModal({ type: null });
      setAddForm({ name: "", code: "", type: "HOSPITAL" });
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const res = await moveFacilityUnitAction({
      unitId: modal.targetNode.id,
      newParentId: moveForm.newParentId || null
    });
    if (res.success) {
      setModal({ type: null });
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleDeactivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const res = await deactivateFacilityUnitAction({
      unitId: modal.targetNode.id,
      strategy: deactivateStrategy
    });
    if (res.success) {
      setModal({ type: null });
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleReactivate = async (nodeId: string) => {
    setActionLoading(true);
    const res = await reactivateFacilityUnitAction({ unitId: nodeId });
    if (res.success) {
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleDetailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId) return;
    setDetailSaving(true);
    const res = await updateFacilityUnitAction({
      unitId: selectedNodeId,
      name: detailForm.name
    });
    if (res.success) {
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setDetailSaving(false);
  };

  const openMoveModal = async (node: any) => {
    setModal({ type: "MOVE", targetNode: node });
    setImpact(null);
    setImpactError("");
    setImpactLoading(true);
    setMoveForm({ newParentId: "" });
    try {
      const res = await previewMoveImpactAction(node.id);
      setImpact(res);
    } catch (err: any) {
      setImpactError(err.message || "Failed to load impact");
    } finally {
      setImpactLoading(false);
    }
  };

  const openDeactivateModal = async (node: any) => {
    setModal({ type: "DEACTIVATE", targetNode: node });
    setImpact(null);
    setImpactError("");
    setImpactLoading(true);
    setDeactivateStrategy("BLOCK"); // Reset strategy
    try {
      const res = await previewDeactivateImpactAction(node.id);
      setImpact(res);
    } catch (err: any) {
      setImpactError(err.message || "Failed to load impact");
    } finally {
      setImpactLoading(false);
    }
  };

  const selectNode = (node: any) => {
    setSelectedNodeId(node.id);
    setDetailForm({ name: node.name, code: node.code });
  };

  const buildTree = (parentId: string | null) => {
    return units
      .filter((u) => u.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((u) => ({
        ...u,
        children: buildTree(u.id)
      }));
  };

  const treeData = useMemo(() => buildTree(null), [units]);

  const matchesSearch = (node: any): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (node.name.toLowerCase().includes(q) || node.code.toLowerCase().includes(q)) return true;
    return node.children.some(matchesSearch);
  };

  const handleReorder = async (node: any, direction: 'UP' | 'DOWN') => {
    const siblings = units
      .filter(u => u.parentId === node.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    const currentIndex = siblings.findIndex(s => s.id === node.id);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    // Build new order: swap current and target, assign sequential sortOrders
    const reordered = [...siblings];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const updates = reordered.map((s, idx) => ({ id: s.id, sortOrder: idx }));

    // Optimistic UI update
    setUnits(prev => prev.map(u => {
      const update = updates.find(upd => upd.id === u.id);
      if (update) return { ...u, sortOrder: update.sortOrder };
      return u;
    }));

    const res = await reorderFacilityUnitsAction(updates);
    if (!res.success) {
      alert("Lỗi sắp xếp: " + res.error);
      loadTree(); // Revert on failure
    }
  };

  const renderNode = (node: any) => {
    const isVisible = matchesSearch(node);
    if (!isVisible && searchQuery) return null;

    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="ml-6 border-l border-vin-border pl-4 py-2">
        <div
          onClick={() => selectNode(node)}
          className={`flex items-center justify-between p-3 rounded-lg shadow-sm border cursor-pointer transition-colors ${
            isSelected ? "border-vin-accent bg-vin-accent/10" :
            node.isActive ? "bg-vin-panel border-vin-border hover:bg-vin-shell/50" : "bg-vin-shell border-vin-border/50 opacity-70 hover:opacity-100"
          }`}
        >
          <div>
            <div className="font-semibold text-white">
              {node.name} <span className="text-vin-muted text-sm font-normal ml-2">({node.code})</span>
              {!node.isActive && <span className="ml-2 text-sm bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Ngừng hoạt động</span>}
            </div>
            <div className="text-sm text-vin-muted mt-1">{node.type}</div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {node.isActive ? (
              <>
                <button onClick={() => handleReorder(node, 'UP')} className="text-vin-muted hover:text-white p-1 rounded hover:bg-vin-shell" title="Lên"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => handleReorder(node, 'DOWN')} className="text-vin-muted hover:text-white p-1 rounded hover:bg-vin-shell" title="Xuống"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => setModal({ type: "ADD", targetNode: node })} className="text-vin-muted hover:text-white p-1 rounded hover:bg-vin-shell" title="Thêm nút con"><Plus className="h-4 w-4" /></button>
                <button onClick={() => openMoveModal(node)} className="text-vin-muted hover:text-white p-1 rounded hover:bg-vin-shell" title="Chuyển (Move)"><Move className="h-4 w-4" /></button>
                <button onClick={() => openDeactivateModal(node)} className="text-vin-muted hover:text-red-400 p-1 rounded hover:bg-vin-shell" title="Hủy kích hoạt (Deactivate)"><Trash2 className="h-4 w-4" /></button>
              </>
            ) : (
              <button onClick={() => handleReactivate(node.id)} className="text-vin-muted hover:text-green-400 p-1 rounded hover:bg-vin-shell" title="Kích hoạt lại (Reactivate)"><RefreshCw className="h-4 w-4" /></button>
            )}
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  const selectedNodeData = units.find(u => u.id === selectedNodeId);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 px-3 py-2 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-vin-muted cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-vin-border bg-vin-shell"
          />
          Hiển thị đơn vị đã ngừng hoạt động
        </label>
        <button
          onClick={() => setModal({ type: "ADD" })}
          className="flex items-center gap-2 rounded bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accentHover"
        >
          <Plus className="h-4 w-4" />
          Thêm đơn vị gốc
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane: Tree View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vin-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên hoặc Mã..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-vin-panel border border-vin-border text-white text-sm focus:border-vin-accent outline-none transition-colors"
            />
          </div>
          <div className="bg-vin-panel border border-vin-border rounded-lg p-4 h-[600px] overflow-y-auto">
            <div className="-ml-6">
              {loading ? (
                <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-vin-muted" /></div>
              ) : treeData.length > 0 ? (
                treeData.map(renderNode)
              ) : (
                <div className="ml-6 p-8 text-center text-vin-muted bg-vin-shell border border-vin-border/50 rounded-lg">
                  Không tìm thấy đơn vị tổ chức nào.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Details */}
        <div>
          <div className="bg-vin-panel border border-vin-border rounded-lg p-5 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-vin-muted" /> Chi tiết đơn vị
            </h3>

            {selectedNodeData ? (
              <form onSubmit={handleDetailSave} className="space-y-4">
                <div>
                  <label className="block text-sm text-vin-muted mb-1">Trạng thái</label>
                  {selectedNodeData.isActive ? (
                    <span className="inline-block px-2 py-1 bg-green-500/10 text-green-400 text-sm rounded border border-green-500/20">Đang hoạt động</span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-red-500/10 text-red-400 text-sm rounded border border-red-500/20">Ngừng hoạt động</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-vin-muted mb-1">Loại Taxonomy</label>
                  <div className="text-white text-sm p-2 bg-vin-shell rounded border border-vin-border/50">
                    {selectedNodeData.type}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-vin-muted mb-1">Mã đơn vị (Code)</label>
                  <input
                    required
                    value={detailForm.code}
                    readOnly
                    className="w-full rounded border border-vin-border/50 bg-vin-shell/50 px-3 py-2 text-white text-sm opacity-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vin-muted mb-1">Tên đơn vị</label>
                  <input
                    required
                    value={detailForm.name}
                    onChange={e => setDetailForm({...detailForm, name: e.target.value})}
                    disabled={!selectedNodeData.isActive}
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-white text-sm disabled:opacity-50"
                  />
                </div>

                {selectedNodeData.isActive && (
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={detailSaving}
                      className="px-4 py-2 rounded text-sm font-semibold text-white bg-vin-accent hover:bg-vin-accentHover transition flex items-center gap-2"
                    >
                      {detailSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Lưu thay đổi
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <div className="text-center py-12 text-vin-muted text-sm">
                Chọn một đơn vị trên cây tổ chức để xem và chỉnh sửa thông tin.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-vin-panel border border-vin-border shadow-2xl p-6">

            {modal.type === "ADD" && (
              <form onSubmit={handleAddSubmit}>
                <h3 className="text-lg font-bold text-white mb-4">
                  {modal.targetNode ? `Thêm nút con cho: ${modal.targetNode.name}` : "Thêm đơn vị gốc"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-vin-muted mb-1">Mã đơn vị (Code)</label>
                    <input required value={addForm.code} onChange={e => setAddForm({...addForm, code: e.target.value})} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-vin-muted mb-1">Tên đơn vị</label>
                    <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-vin-muted mb-1">Loại (Taxonomy)</label>
                    <select value={addForm.type} onChange={e => setAddForm({...addForm, type: e.target.value})} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-white">
                      <option value="CHAIN">Chuỗi (CHAIN)</option>
                      <option value="HOSPITAL">Bệnh viện (HOSPITAL)</option>
                      <option value="DEPARTMENT">Khoa phòng (DEPARTMENT)</option>
                      <option value="SPECIALTY">Chuyên khoa (SPECIALTY)</option>
                      <option value="ROOM">Phòng chụp (ROOM)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 rounded text-sm text-vin-muted hover:text-white hover:bg-vin-shell transition">Hủy</button>
                  <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded text-sm font-semibold text-white bg-vin-accent hover:bg-vin-accentHover transition flex items-center gap-2">
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
                  </button>
                </div>
              </form>
            )}

            {modal.type === "MOVE" && (
              <form onSubmit={handleMoveSubmit}>
                <h3 className="text-lg font-bold text-white mb-4">Chuyển đơn vị: {modal.targetNode?.name}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-vin-muted mb-1">Đơn vị cha mới</label>
                    <select
                      value={moveForm.newParentId}
                      onChange={e => setMoveForm({ newParentId: e.target.value })}
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-white"
                    >
                      <option value="">-- Trở thành đơn vị gốc --</option>
                      {units.filter(u => u.id !== modal.targetNode?.id && u.isActive).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                      ))}
                    </select>
                  </div>

                  {impactLoading ? (
                    <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-vin-muted" /></div>
                  ) : impactError ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">Lỗi tải preview: {impactError}</div>
                  ) : impact && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/50 rounded flex items-start gap-3 text-amber-500 text-sm">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div>
                        <p>Thao tác này sẽ di chuyển:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li><strong>{impact.affectedDescendants}</strong> đơn vị con</li>
                          <li><strong>{impact.affectedMachines}</strong> máy chụp</li>
                          <li><strong>{impact.affectedGrants}</strong> phân quyền (Access Grants)</li>
                        </ul>
                        <p className="mt-2 text-sm opacity-80">Vui lòng kiểm tra lại tính hợp lệ theo cấu trúc Taxonomy.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 rounded text-sm text-vin-muted hover:text-white hover:bg-vin-shell transition">Hủy</button>
                  <button type="submit" disabled={actionLoading || impactLoading || !!impactError} className="px-4 py-2 rounded text-sm font-semibold text-white bg-vin-accent hover:bg-vin-accentHover transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} Chuyển
                  </button>
                </div>
              </form>
            )}

            {modal.type === "DEACTIVATE" && (
              <form onSubmit={handleDeactivateSubmit}>
                <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2"><ShieldAlert className="h-5 w-5"/> Hủy kích hoạt</h3>
                <div className="space-y-4">
                  <p className="text-sm text-vin-muted">Bạn đang muốn ngừng hoạt động <strong>{modal.targetNode?.name}</strong>.</p>

                  <div>
                    <label className="block text-sm text-vin-muted mb-1">Chiến lược xử lý</label>
                    <select
                      value={deactivateStrategy}
                      onChange={e => setDeactivateStrategy(e.target.value as any)}
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-white"
                    >
                      <option value="BLOCK">BLOCK (Chặn nếu có đơn vị con / máy chụp)</option>
                      <option value="CASCADE">CASCADE (Ngừng hoạt động tất cả đơn vị con và máy chụp)</option>
                    </select>
                  </div>

                  {impactLoading ? (
                    <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-vin-muted" /></div>
                  ) : impactError ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">Lỗi tải preview: {impactError}</div>
                  ) : impact && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded flex flex-col gap-1 text-red-400 text-sm">
                      <div>Ảnh hưởng dự kiến:</div>
                      <ul className="list-disc list-inside">
                        <li><strong>{impact.affectedDescendants}</strong> đơn vị con</li>
                        <li><strong>{impact.affectedMachines}</strong> máy chụp (DICOM Node)</li>
                      </ul>
                      {deactivateStrategy === "BLOCK" && (impact.affectedDescendants > 0 || impact.affectedMachines > 0) && (
                        <div className="mt-2 font-semibold bg-red-500/20 p-2 rounded">CẢNH BÁO: Thao tác sẽ bị từ chối với chiến lược BLOCK do đang có đơn vị con hoặc máy chụp phụ thuộc.</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 rounded text-sm text-vin-muted hover:text-white hover:bg-vin-shell transition">Hủy</button>
                  <button
                    type="submit"
                    disabled={actionLoading || impactLoading || !!impactError || (deactivateStrategy === "BLOCK" && impact && (impact.affectedDescendants > 0 || impact.affectedMachines > 0))}
                    className="px-4 py-2 rounded text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} Ngừng hoạt động
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
