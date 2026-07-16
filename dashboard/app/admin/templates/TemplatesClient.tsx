"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";


import React, { useEffect, useState } from "react";
import {
  FileCode2,
  FilePlus2,
  Loader2,
  Search,
  Trash2,
  X,
  ListPlus,
  Monitor,
  Printer,
  Building
} from "lucide-react";
import { CustomSelect } from "@/app/components/CustomSelect";
import {
  createPrintTemplateAction,
  deletePrintTemplateAction,
  getPrintTemplates,
  getTemplateReferences,
  updatePrintTemplateAction,
} from "./actions";

function FormSelect({ name, value: defaultValue, options, placeholder, className }: any) {
  const [val, setVal] = useState(defaultValue);
  return (
    <CustomSelect
      name={name}
      value={val}
      onChange={setVal}
      options={options}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function TemplatesClient() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [references, setReferences] = useState<any>({ facilities: [], procedures: [], nodes: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "create">("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [tplData, refData] = await Promise.all([
        getPrintTemplates(),
        getTemplateReferences()
      ]);
      setTemplates(tplData || []);
      setReferences(refData || { facilities: [], procedures: [], nodes: [] });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không tải được danh sách mẫu in.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        htmlContent: formData.get("htmlContent") as string,
        isDefault: formData.get("isDefault") === "on",
        modality: formData.get("modality") as string,
        bodyPart: formData.get("bodyPart") as string,
        facilityId: formData.get("facilityId") as string || null,
        procedureCatalogId: formData.get("procedureCatalogId") as string || null,
        dicomNodeId: formData.get("dicomNodeId") as string || null,
        paperSize: formData.get("paperSize") as string || "A4",
        orientation: formData.get("orientation") as string || "PORTRAIT",
        isActive: formData.get("isActive") === "on",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      };

      const newItem = await createPrintTemplateAction(payload);
      setTemplates([newItem, ...templates]);
      setSelectedId(newItem.id);
      setMode("view");
    } catch (err: any) {
      setError(err.message || "Lỗi tạo mẫu in");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedId) return;
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        htmlContent: formData.get("htmlContent") as string,
        isDefault: formData.get("isDefault") === "on",
        modality: formData.get("modality") as string,
        bodyPart: formData.get("bodyPart") as string,
        facilityId: formData.get("facilityId") as string || null,
        procedureCatalogId: formData.get("procedureCatalogId") as string || null,
        dicomNodeId: formData.get("dicomNodeId") as string || null,
        paperSize: formData.get("paperSize") as string || "A4",
        orientation: formData.get("orientation") as string || "PORTRAIT",
        isActive: formData.get("isActive") === "on",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      };

      const updated = await updatePrintTemplateAction(selectedId, payload);
      setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));

      // Auto reload data to update joins
      await loadData();
    } catch (err: any) {
      setError(err.message || "Lỗi cập nhật mẫu in");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Bạn có chắc chắn muốn xóa mẫu in này không?")) return;

    try {
      setIsSaving(true);
      await deletePrintTemplateAction(selectedId);
      setTemplates(templates.filter((t) => t.id !== selectedId));
      setSelectedId(null);
      setMode("view");
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa mẫu in");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = templates.filter(t =>
    `${t.code} ${t.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      {/* Left List Panel */}
      <section className="flex h-full w-[45%] min-w-[500px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <ScreenHeader />
                <p className="mt-0.5 text-sm text-vin-muted">Print Templates & Mappings</p>
              </div>
            </div>
            <button
              onClick={() => {
                setError("");
                setMode("create");
                setSelectedId(null);
              }}
              className="flex items-center gap-1.5 rounded border-0 bg-vin-accent px-2.5 py-1 text-sm font-semibold text-white transition hover:bg-vin-accentHover"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Tạo mới
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-vin-border bg-vin-panel py-1.5 pl-7 pr-7 text-sm text-vin-text placeholder:text-vin-faint outline-none transition focus:border-vin-accent"
              placeholder="Tìm kiếm theo mã, tên..."
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-vin-faint transition hover:text-vin-text">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scr-dark">
          {isLoading ? (
            <div className="py-12 text-center text-vin-muted">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
              Đang tải...
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-vin-border bg-vin-panel2 text-sm font-semibold uppercase tracking-wider text-vin-text2">
                <tr>
                  <th className="w-9 py-2 pl-2 pr-1 text-center">TT</th>
                  <th className="px-2 py-2">Mã & Tên</th>
                  <th className="px-2 py-2 text-center">Modality</th>
                  <th className="px-2 py-2 text-center">Mặc định</th>
                  <th className="px-2 py-2 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setMode("view");
                      setSelectedId(item.id);
                      setError("");
                    }}
                    className={`group cursor-pointer border-b border-vin-border/50 transition ${
                      selectedId === item.id ? "bg-vin-accent/10" : "hover:bg-vin-panel"
                    }`}
                  >
                    <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-muted">{idx + 1}</td>
                    <td className="px-2 py-2">
                      <div className="font-semibold text-white">{item.code || "---"}</div>
                      <div className="truncate text-vin-muted">{item.name}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="rounded bg-vin-panel2 px-1.5 py-0.5 text-sm font-mono text-vin-muted">{item.modality || "ALL"}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {item.isDefault ? (
                        <span className="rounded bg-vin-accent/20 px-1.5 py-0.5 text-sm font-bold text-vin-accent">CÓ</span>
                      ) : (
                        <span className="text-vin-faint">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {item.isActive ? (
                        <span className="rounded bg-emerald-900/20 px-1.5 py-0.5 text-sm font-bold text-emerald-400">ACTIVE</span>
                      ) : (
                        <span className="rounded bg-red-900/20 px-1.5 py-0.5 text-sm font-bold text-red-400">HIDDEN</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-vin-muted">
                      Không tìm thấy mẫu in nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Right Form Panel */}
      <section className="flex flex-1 flex-col overflow-hidden bg-vin-root">
        {error && (
          <div className="m-4 flex items-center justify-between rounded border border-vin-status-danger-border bg-vin-status-danger-bg/20 px-3 py-2 text-sm text-vin-status-danger-text">
            <span>{error}</span>
            <button onClick={() => setError("")} className="hover:opacity-75">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {(!selectedId && mode !== "create") ? (
          <div className="flex h-full flex-col items-center justify-center text-vin-faint">
            <FileCode2 className="mb-4 h-12 w-12 opacity-20" />
            <p className="text-sm">Chọn một mẫu in để xem chi tiết hoặc tạo mới</p>
          </div>
        ) : (
          <React.Fragment>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <ListPlus className="h-4 w-4 text-vin-accent" />
                  {mode === "create" ? "Tạo mới mẫu in" : "Chi tiết mẫu in"}
                </h2>
                <button onClick={() => { setMode("view"); setSelectedId(null); }} className="rounded p-1 text-vin-muted transition hover:bg-vin-panel hover:text-white" title="Đóng">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form
              key={`${mode}-${selectedId || 'new'}`}
              onSubmit={mode === "create" ? handleCreateSubmit : handleUpdateSubmit}
              className="min-h-0 flex-1 space-y-5 overflow-auto p-4 scr-dark"
            >
              {(() => {
                const item = mode === "view" && selectedId
                  ? templates.find(x => x.id === selectedId)
                  : null;

                return (
                  <>
                    {/* Basic Info */}
                    <div className="rounded border border-vin-border/50 bg-vin-panel p-3">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-vin-muted">Thông tin cơ bản</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Mã (Code)</label>
                          <input name="code" defaultValue={item?.code} className="h-8 w-full rounded border border-vin-border bg-vin-shell px-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="VD: IN_CT01" />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Tên / Tiêu đề</label>
                          <input name="name" defaultValue={item?.name} required className="h-8 w-full rounded border border-vin-border bg-vin-shell px-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="Tên mẫu in" />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Mô tả</label>
                          <input name="description" defaultValue={item?.description} className="h-8 w-full rounded border border-vin-border bg-vin-shell px-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="Ghi chú thêm..." />
                        </div>
                      </div>
                    </div>

                    {/* Printer Settings */}
                    <div className="rounded border border-vin-border/50 bg-vin-panel p-3">
                      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-vin-muted">
                        <Printer className="h-3 w-3" /> Cấu hình bản in
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Khổ giấy</label>
                          <FormSelect
                            options={[{value: "A4", label: "A4"}, {value: "A5", label: "A5"}]}
                            value={item?.paperSize || "A4"}
                            name="paperSize"
                            placeholder="Khổ giấy"
                            className="bg-vin-shell"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Hướng giấy</label>
                          <FormSelect
                            options={[{value: "PORTRAIT", label: "Dọc (Portrait)"}, {value: "LANDSCAPE", label: "Ngang (Landscape)"}]}
                            value={item?.orientation || "PORTRAIT"}
                            name="orientation"
                            placeholder="Hướng in"
                            className="bg-vin-shell"
                          />
                        </div>
                        <div className="flex flex-col gap-2 pt-4">
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                            <input type="checkbox" name="isDefault" defaultChecked={item?.isDefault} className="h-4 w-4 rounded border-vin-border bg-vin-shell text-vin-accent focus:ring-vin-accent focus:ring-offset-vin-panel" />
                            <span className="font-semibold text-vin-accent">Làm mặc định (Global)</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                            <input type="checkbox" name="isActive" defaultChecked={item ? item.isActive : true} className="h-4 w-4 rounded border-vin-border bg-vin-shell focus:ring-vin-accent focus:ring-offset-vin-panel" />
                            Kích hoạt sử dụng
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Mappings */}
                    <div className="rounded border border-vin-border/50 bg-vin-panel p-3">
                      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-vin-muted">
                        <Building className="h-3 w-3" /> Phạm vi & Gán tự động
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Gán Cơ sở (Facility)</label>
                          <FormSelect
                            options={[{value: "", label: "-- Không gán --"}, ...references.facilities.map((f: any) => ({value: f.id, label: f.name}))]}
                            value={item?.facilityId || ""}
                            name="facilityId"
                            placeholder="Chọn cơ sở"
                            className="bg-vin-shell"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Gán Máy (DICOM Node)</label>
                          <FormSelect
                            options={[{value: "", label: "-- Không gán --"}, ...references.nodes.map((n: any) => ({value: n.id, label: n.aeTitle}))]}
                            value={item?.dicomNodeId || ""}
                            name="dicomNodeId"
                            placeholder="Chọn máy"
                            className="bg-vin-shell"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Gán Nhóm dịch vụ (Modality)</label>
                          <input name="modality" defaultValue={item?.modality} className="h-8 w-full rounded border border-vin-border bg-vin-shell px-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="ALL, CR, CT..." />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold uppercase tracking-wide text-vin-muted">Gán Dịch vụ (Procedure)</label>
                          <FormSelect
                            options={[{value: "", label: "-- Không gán --"}, ...references.procedures.map((p: any) => ({value: p.id, label: p.name}))]}
                            value={item?.procedureCatalogId || ""}
                            name="procedureCatalogId"
                            placeholder="Chọn dịch vụ"
                            className="bg-vin-shell"
                          />
                        </div>
                      </div>
                    </div>

                    {/* HTML Content (Advanced) */}
                    <div className="flex flex-col rounded border border-vin-border/50 bg-vin-panel p-3">
                      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-vin-muted">
                        <FileCode2 className="h-3 w-3" /> HTML / JS Nâng cao
                      </h3>
                      <textarea
                        name="htmlContent"
                        defaultValue={item?.htmlContent}
                        className="h-64 w-full resize-y rounded border border-vin-border bg-vin-shell px-3 py-2 font-mono text-sm text-vin-text outline-none focus:border-vin-accent"
                        placeholder="<html><body><h1>Report</h1></body></html>"
                      />
                    </div>

                    <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-vin-border bg-vin-root pt-4 pb-2">
                      {mode === "view" && selectedId && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={handleDelete}
                          className="mr-auto flex items-center gap-1.5 rounded border border-vin-status-danger-border bg-vin-panel px-3 py-1.5 text-sm font-semibold text-vin-status-danger-text transition hover:bg-vin-status-danger-bg/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa mẫu này
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { setMode("view"); setSelectedId(null); }}
                        className="rounded px-4 py-1.5 text-sm font-semibold text-vin-muted transition hover:text-white"
                      >
                        Hủy
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-vin-accentHover disabled:opacity-50"
                      >
                        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {mode === "create" ? "Lưu tạo mới" : "Lưu thay đổi"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </React.Fragment>
        )}
      </section>
    </div>
  );
}
