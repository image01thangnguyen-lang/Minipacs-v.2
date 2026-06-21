"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ClipboardList,
  FilePlus2,
  FileText,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { CustomSelect } from "@/app/components/CustomSelect";
import {
  createReportTemplateTextAction,
  deleteReportTemplateTextAction,
  getReportTemplateTexts,
  updateReportTemplateTextAction,
} from "./actions";

const modalityOptions = ["ALL", "DX", "CR", "US", "CT", "MR", "SRDX"];

const scopeLabels: Record<string, string> = {
  GLOBAL: "Chung",
  PRIVATE: "Cá nhân",
};

function ModalityBadge({ modality }: { modality: string }) {
  const classes =
    modality === "ALL"
      ? "bg-vin-status-new-bg text-white border-vin-border"
      : modality === "US"
        ? "bg-emerald-900/25 text-emerald-200 border-emerald-500/30"
        : modality === "CT" || modality === "MR"
          ? "bg-vin-accentSoft/20 text-vin-accent border-vin-accent/40"
          : "bg-amber-900/25 text-amber-200 border-amber-500/30";

  return (
    <span className={`inline-flex min-w-10 justify-center rounded border px-1.5 py-px font-mono text-[10px] font-bold ${classes}`}>
      {modality}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-flex max-w-[70px] justify-center truncate rounded bg-vin-panel px-2 py-0.5 text-[9px] font-bold text-vin-muted">
      {scopeLabels[scope] || scope}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex max-w-[80px] justify-center truncate rounded px-2 py-0.5 text-[9px] font-bold ${
        active ? "bg-vin-status-approved-bg text-white" : "bg-vin-status-danger-bg text-white"
      }`}
    >
      {active ? "Đang dùng" : "Đã ẩn"}
    </span>
  );
}

function readOwner(template: any) {
  if (template.scope === "GLOBAL") return "Dùng chung";
  return template.owner?.fullName || template.owner?.username || "Cá nhân";
}

export default function ReportTemplateTextPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "create">("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [createFormKey, setCreateFormKey] = useState(0);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getReportTemplateTexts({ includeInactive: true });
      setTemplates(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không tải được danh sách mẫu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    document.title = "Mini PACS - Mẫu báo cáo";
  }, []);

  const filteredTemplates = useMemo(() => {
    let list = templates;

    if (modalityFilter !== "ALL") {
      list = list.filter(template => template.modality === modalityFilter || template.modality === "ALL");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(template =>
        `${template.name} ${template.modality} ${template.bodyPart || ""} ${template.shortcut || ""} ${template.findings} ${template.conclusion}`
          .toLowerCase()
          .includes(query)
      );
    }

    return list;
  }, [modalityFilter, searchQuery, templates]);

  const selectedTemplate = templates.find(template => template.id === selectedTemplateId) || null;

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      const created = await createReportTemplateTextAction(formData);
      await loadTemplates();
      setMode("view");
      setSelectedTemplateId(created.id);
      event.currentTarget.reset();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không tạo được mẫu báo cáo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      const updated = await updateReportTemplateTextAction(formData);
      await loadTemplates();
      setSelectedTemplateId(updated.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không lưu được mẫu báo cáo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm("Xóa mẫu báo cáo này?")) return;

    setIsSaving(true);
    setError("");
    try {
      await deleteReportTemplateTextAction(templateId);
      setSelectedTemplateId(null);
      await loadTemplates();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không xóa được mẫu báo cáo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="templates" />

      <section className="flex h-full w-[52%] min-w-[640px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">Mẫu báo cáo</h1>
              <p className="mt-0.5 text-[10px] text-vin-muted">
                {filteredTemplates.length} mẫu
              </p>
            </div>
            <button
              onClick={() => {
                setMode("create");
                setSelectedTemplateId(null);
                setCreateFormKey(key => key + 1);
              }}
              className="flex items-center gap-1.5 rounded border-0 bg-vin-accent px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-vin-accentHover"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Tạo mẫu
            </button>
          </div>

          {error && (
            <div className="mb-2 rounded border border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 px-3 py-2 text-[11px] font-semibold text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-[1fr_7rem] items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-[2.25rem] w-full rounded-md border border-white/10 bg-transparent py-1.5 pl-7 pr-7 text-[11px] text-vin-text placeholder:text-vin-faint outline-none transition focus:border-vin-accent focus:bg-vin-root/20"
                placeholder="Tìm tên, shortcut, nội dung..."
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-vin-faint transition hover:text-vin-text"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <CustomSelect
              options={[
                { value: "ALL", label: "Tất cả" },
                ...modalityOptions.filter(item => item !== "ALL").map(m => ({ value: m, label: m })),
              ]}
              value={modalityFilter}
              onChange={val => setModalityFilter(val)}
              compact
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scr-dark">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 border-b border-vin-border bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
              <tr>
                <th className="w-9 py-2 pl-2 pr-1 text-center">TT</th>
                <th className="px-2 py-2">Tên mẫu</th>
                <th className="px-2 py-2 text-center">Mod</th>
                <th className="px-2 py-2">Shortcut</th>
                <th className="px-2 py-2 text-center">Phạm vi</th>
                <th className="px-2 py-2 text-center">TT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vin-border/45 text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-vin-muted">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
                    Đang tải danh sách mẫu...
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-vin-muted">
                    Không có mẫu báo cáo nào.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template, index) => {
                  const isSelected = template.id === selectedTemplateId && mode === "view";

                  return (
                    <tr
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setMode("view");
                      }}
                      className={`cursor-pointer select-none border-l-2 transition-colors ${
                        isSelected
                          ? "border-l-vin-accent bg-vin-tableSelected text-white"
                          : "border-l-transparent odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 hover:bg-vin-tableHover"
                      }`}
                    >
                      <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{index + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 flex-shrink-0 text-vin-accent" />
                          <div className="min-w-0">
                            <div className="max-w-[220px] truncate font-semibold text-white">{template.name}</div>
                            <div className="mt-0.5 truncate text-[10px] text-vin-muted">
                              {template.bodyPart || "Không chọn body part"} · {readOwner(template)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <ModalityBadge modality={template.modality} />
                      </td>
                      <td className="px-2 py-2 font-mono text-vin-text2">{template.shortcut || "-"}</td>
                      <td className="px-2 py-2 text-center">
                        <ScopeBadge scope={template.scope} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <StatusBadge active={template.isActive} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        {mode === "create" ? (
          <React.Fragment key={createFormKey}>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <FilePlus2 className="h-4 w-4 text-vin-accent" />
                  Tạo mẫu báo cáo
                </h2>
                <button
                  onClick={() => setMode("view")}
                  className="rounded p-1 text-vin-muted transition hover:bg-vin-panel hover:text-white"
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <TemplateForm
              isSaving={isSaving}
              onSubmit={handleCreateSubmit}
              submitLabel="Tạo mẫu"
            />
          </React.Fragment>
        ) : selectedTemplate ? (
          <>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 truncate text-sm font-bold uppercase tracking-wide text-white">
                    <ClipboardList className="h-4 w-4 flex-shrink-0 text-vin-accent" />
                    {selectedTemplate.name}
                  </h2>
                  <p className="mt-1 text-[10px] text-vin-muted">
                    {selectedTemplate.modality} · {selectedTemplate.bodyPart || "Không chọn body part"} · {readOwner(selectedTemplate)}
                  </p>
                </div>
                <StatusBadge active={selectedTemplate.isActive} />
              </div>
              <div className="flex items-center gap-2">
                <ModalityBadge modality={selectedTemplate.modality} />
                <ScopeBadge scope={selectedTemplate.scope} />
                {selectedTemplate.isNormal && (
                  <span className="rounded bg-emerald-900/25 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                    Bình thường
                  </span>
                )}
              </div>
            </div>

            <TemplateForm
              key={selectedTemplate.id}
              template={selectedTemplate}
              isSaving={isSaving}
              onSubmit={handleUpdateSubmit}
              onDelete={() => handleDelete(selectedTemplate.id)}
              submitLabel="Lưu thay đổi"
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-vin-border bg-vin-shell">
              <ClipboardList className="h-7 w-7 text-vin-faint" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-vin-text2">Chưa chọn mẫu báo cáo</h3>
            <p className="max-w-[260px] text-[11px] leading-relaxed text-vin-muted">
              Chọn một mẫu bên trái để chỉnh sửa, hoặc tạo mẫu mới cho bác sĩ chèn nhanh khi đọc phim.
            </p>
          </div>
        )}
      </section>

      <style>{`
        .scr-dark::-webkit-scrollbar{width:5px;height:5px}
        .scr-dark::-webkit-scrollbar-track{background:transparent}
        .scr-dark::-webkit-scrollbar-thumb{background:var(--vin-border-subtle);border-radius:10px}
        .scr-dark::-webkit-scrollbar-thumb:hover{background:var(--vin-border-strong)}
      `}</style>
    </div>
  );
}

function TemplateForm({
  template,
  isSaving,
  onDelete,
  onSubmit,
  submitLabel,
}: {
  template?: any;
  isSaving: boolean;
  onDelete?: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark">
      {template && <input type="hidden" name="templateId" value={template.id} />}

      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Tên mẫu</label>
        <input
          name="name"
          required
          defaultValue={template?.name || ""}
          className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
          placeholder="Ví dụ: Phổi bình thường"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Modality</label>
          <CustomSelect
            name="modality"
            options={modalityOptions.map(m => ({ value: m, label: m }))}
            value={template?.modality || "DX"}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Body part</label>
          <input
            name="bodyPart"
            defaultValue={template?.bodyPart || ""}
            className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
            placeholder="CHEST"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Shortcut</label>
          <input
            name="shortcut"
            defaultValue={template?.shortcut || ""}
            className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
            placeholder="/phoi"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Phạm vi</label>
          <CustomSelect
            name="scope"
            options={[
              { value: "GLOBAL", label: "Chung" },
              { value: "PRIVATE", label: "Cá nhân" },
            ]}
            value={template?.scope || "GLOBAL"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text2">
          <input name="isNormal" type="checkbox" defaultChecked={template?.isNormal || false} className="h-4 w-4 accent-vin-accent" />
          Mẫu bình thường
        </label>
        <label className="flex items-center gap-2 rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text2">
          <input name="isActive" type="checkbox" defaultChecked={template?.isActive ?? true} className="h-4 w-4 accent-vin-accent" />
          Đang dùng
        </label>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mô tả</label>
        <textarea
          name="findings"
          required
          defaultValue={template?.findings || ""}
          className="h-40 w-full resize-none rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm leading-relaxed text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
          placeholder="Nhập nội dung mô tả..."
        />
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Kết luận</label>
        <textarea
          name="conclusion"
          required
          defaultValue={template?.conclusion || ""}
          className="h-24 w-full resize-none rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm leading-relaxed text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
          placeholder="Nhập kết luận..."
        />
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Đề nghị</label>
        <textarea
          name="recommendation"
          defaultValue={template?.recommendation || ""}
          className="h-20 w-full resize-none rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm leading-relaxed text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
          placeholder="Nhập đề nghị nếu có..."
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg border border-vin-status-danger-bg/50 bg-vin-status-danger-bg/15 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-vin-status-danger-bg/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Xóa mẫu
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="flex min-w-[150px] items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
