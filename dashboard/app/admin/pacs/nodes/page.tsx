"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { 
  AlertCircle,
  CheckCircle2, 
  HardDrive, 
  Loader2, 
  Network, 
  Plus, 
  RefreshCcw, 
  Server, 
  Trash2, 
  Wifi
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomSelect } from "@/app/components/CustomSelect";
import { 
  getNodesAction, 
  upsertNodeAction, 
  deleteNodeAction, 
  pingNodeAction
} from "./actions";
import { dicomNodeSchema, type DicomNodeInput } from "./schema";

type DicomNodeView = {
  id: string;
  name: string;
  aeTitle: string;
  ipAddress: string;
  port: number;
  modality: string;
  room: string | null;
  isActive: boolean;
  orthancAlias: string;
  lastEchoStatus: string | null;
  lastEchoMessage: string | null;
  lastEchoAt: Date | null;
};

export default function DicomNodesPage() {
  const [nodes, setNodes] = useState<DicomNodeView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyNodeId, setBusyNodeId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingNode, setEditingNode] = useState<DicomNodeView | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DicomNodeInput>({
    resolver: zodResolver(dicomNodeSchema),
    defaultValues: {
      name: "",
      aeTitle: "",
      ipAddress: "",
      port: 104,
      modality: "DX",
      room: "",
      isActive: true,
      orthancAlias: "",
    }
  });

  const loadNodes = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getNodesAction();
      setNodes(data);
    } catch (err: any) {
      setError("Không tải được danh sách máy chụp: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lý Máy Chụp (DICOM Nodes)";
    loadNodes();
  }, []);

  const handleEdit = (node: DicomNodeView) => {
    setEditingNode(node);
    reset({
      id: node.id,
      name: node.name,
      aeTitle: node.aeTitle,
      ipAddress: node.ipAddress,
      port: node.port,
      modality: node.modality,
      room: node.room || "",
      isActive: node.isActive,
      orthancAlias: node.orthancAlias,
    });
    setError("");
    setMessage("");
  };

  const handleAddNew = () => {
    setEditingNode(null);
    reset({
      name: "",
      aeTitle: "",
      ipAddress: "",
      port: 104,
      modality: "DX",
      room: "",
      isActive: true,
      orthancAlias: "",
    });
    setError("");
    setMessage("");
  };

  const onSubmit = async (data: DicomNodeInput) => {
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await upsertNodeAction(data);
      if (res.success) {
        setMessage(data.id ? "Đã cập nhật máy chụp thành công" : "Đã thêm máy chụp mới");
        await loadNodes();
        if (!data.id) {
          handleAddNew();
        }
      } else {
        setError(res.error || "Có lỗi xảy ra khi lưu máy chụp");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối khi lưu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runPing = async (id: string) => {
    setBusyNodeId(id);
    setError("");
    try {
      const res = await pingNodeAction(id);
      if (res.success) {
        // Just reload the list to show new status
        await loadNodes();
      } else {
        setError(res.error || "Không thể ping máy chụp");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi ping");
    } finally {
      setBusyNodeId("");
    }
  };

  const runDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa máy chụp này? (Bao gồm xóa khỏi database và Orthanc)")) return;
    
    setBusyNodeId(id);
    setError("");
    try {
      const res = await deleteNodeAction(id);
      if (res.success) {
        setMessage("Đã xóa máy chụp thành công");
        if (editingNode?.id === id) handleAddNew();
        await loadNodes();
      } else {
        setError(res.error || "Không thể xóa máy chụp");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa");
    } finally {
      setBusyNodeId("");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="pacs" />

      {/* Main Content Area */}
      <section className="flex h-full w-[60%] min-w-[700px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
                <Server className="h-4 w-4 text-vin-accent" />
                Quản lý Máy Chụp (DICOM Nodes)
              </h1>
              <p className="mt-1 text-[11px] text-vin-muted">
                Khai báo danh sách thiết bị để nhận/gửi ảnh DICOM tới Orthanc PACS.
              </p>
            </div>
            <button
              onClick={loadNodes}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded border border-vin-border bg-vin-panel px-3 py-1.5 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          {(message || error) && (
            <div className={`mt-3 rounded border px-3 py-2 text-[11px] font-semibold ${
              error
                ? "border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 text-red-200"
                : "border-vin-status-approved-bg/60 bg-vin-status-approved-bg/15 text-emerald-100"
            }`}>
              {error || message}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto scr-dark">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 border-b border-vin-border bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
              <tr>
                <th className="px-4 py-3">Tên & Alias</th>
                <th className="px-3 py-3">Mạng (IP:Port)</th>
                <th className="px-3 py-3 text-center">AE Title</th>
                <th className="px-3 py-3 text-center">Kết nối</th>
                <th className="px-4 py-3 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vin-border/45 text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-vin-muted">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
                    Đang tải danh sách thiết bị...
                  </td>
                </tr>
              ) : nodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-vin-muted">Chưa có máy chụp nào được khai báo.</td>
                </tr>
              ) : (
                nodes.map((node) => {
                  const isBusy = busyNodeId === node.id;
                  return (
                    <tr 
                      key={node.id} 
                      className={`transition ${editingNode?.id === node.id ? 'bg-vin-accentSoft/10 border-l-2 border-l-vin-accent' : 'odd:bg-vin-table even:bg-vin-tableAlt hover:bg-vin-tableHover'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{node.name}</div>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-vin-muted">
                          <span className="rounded bg-vin-panel px-1.5 py-0.5 border border-vin-border">{node.modality}</span>
                          <span>{node.orthancAlias}</span>
                          {!node.isActive && (
                            <span className="rounded bg-red-500/20 px-1 text-red-300">Tắt</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-vin-text2">
                        {node.ipAddress}:{node.port}
                        <div className="mt-0.5 font-sans text-[10px] text-vin-muted">{node.room || "-"}</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono font-bold text-vin-accent">{node.aeTitle}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {node.lastEchoStatus === "OK" ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="flex items-center gap-1 rounded bg-vin-status-approved-bg/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <Wifi className="h-3 w-3" /> OK
                            </span>
                            <span className="mt-1 text-[9px] text-vin-faint">
                              {node.lastEchoAt ? new Date(node.lastEchoAt).toLocaleString('vi-VN') : ""}
                            </span>
                          </div>
                        ) : node.lastEchoStatus === "FAILED" ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="flex items-center gap-1 rounded bg-vin-status-danger-bg/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                              <AlertCircle className="h-3 w-3" /> FAILED
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-vin-muted">Chưa test</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            title="Kiểm tra kết nối (C-Echo)"
                            disabled={isBusy}
                            onClick={() => runPing(node.id)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-vin-border bg-vin-panel text-vin-accent transition hover:border-vin-accent hover:bg-vin-accent/10 disabled:opacity-40"
                          >
                            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Network className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            title="Sửa cấu hình"
                            disabled={isBusy}
                            onClick={() => handleEdit(node)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-vin-border bg-vin-panel text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40"
                          >
                            Sửa
                          </button>
                          <button
                            title="Xóa máy chụp"
                            disabled={isBusy}
                            onClick={() => runDelete(node.id)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-vin-status-danger-bg/50 bg-vin-status-danger-bg/10 text-red-300 transition hover:bg-vin-status-danger-bg/30 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Form Area */}
      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              {editingNode ? (
                <><HardDrive className="h-4 w-4 text-vin-accent" /> Cập nhật máy chụp</>
              ) : (
                <><Plus className="h-4 w-4 text-emerald-400" /> Thêm máy chụp mới</>
              )}
            </h2>
          </div>
          {editingNode && (
            <button
              type="button"
              onClick={handleAddNew}
              className="text-[11px] font-semibold text-vin-accent hover:underline"
            >
              + Tạo mới
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark">
          <Field label="Tên thiết bị hiển thị *" error={errors.name?.message}>
            <input {...register("name")} className="field-input" placeholder="Ví dụ: X-Quang Phòng 1" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Orthanc Alias (ID) *" error={errors.orthancAlias?.message}>
              <input 
                {...register("orthancAlias")} 
                disabled={!!editingNode}
                className="field-input font-mono disabled:opacity-50" 
                placeholder="cr_room1" 
                title="Tên không dấu, không cách dùng để khai báo với Orthanc"
              />
            </Field>
            <Field label="Modality *" error={errors.modality?.message}>
              <Controller
                control={control}
                name="modality"
                render={({ field }) => (
                  <CustomSelect
                    options={[
                      { value: "DX", label: "DX (X-Quang Số)" },
                      { value: "CR", label: "CR (X-Quang Cassette)" },
                      { value: "US", label: "US (Siêu âm)" },
                      { value: "CT", label: "CT (Cắt lớp)" },
                      { value: "MR", label: "MR (Cộng hưởng từ)" },
                      { value: "MG", label: "MG (Nhũ ảnh)" },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    mono
                  />
                )}
              />
            </Field>
          </div>

          <Field label="DICOM AE Title *" error={errors.aeTitle?.message}>
            <input {...register("aeTitle")} className="field-input font-mono uppercase text-vin-accent" placeholder="CR_ROOM1" maxLength={16} />
            <p className="mt-1 text-[10px] text-vin-muted">Tối đa 16 ký tự, thường viết hoa. Phải khớp với cấu hình Local AE trên máy chụp.</p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Địa chỉ IP *" error={errors.ipAddress?.message}>
              <input {...register("ipAddress")} className="field-input font-mono" placeholder="192.168.1.100" />
            </Field>
            <Field label="Port *" error={errors.port?.message}>
              <input type="number" {...register("port", { valueAsNumber: true })} className="field-input font-mono" placeholder="104" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phòng chụp">
              <input {...register("room")} className="field-input" placeholder="Phòng số 1" />
            </Field>
            <Field label="Trạng thái">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <CustomSelect
                    options={[
                      { value: "true", label: "Đang hoạt động" },
                      { value: "false", label: "Tạm ngưng" },
                    ]}
                    value={field.value ? "true" : "false"}
                    onChange={(val) => field.onChange(val === "true")}
                  />
                )}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg border border-vin-accent/50 bg-vin-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {editingNode ? "Cập nhật" : "Tạo máy chụp"}
            </button>
          </div>
        </form>
      </section>

      <style>{`
        .field-input { width: 100%; height: 2.5rem; border-radius: 0.25rem; border: 1px solid var(--vin-border-subtle); background: var(--vin-bg-sidebar); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--vin-text-primary); outline: none; transition: border-color 0.2s; }
        .field-input:focus { border-color: var(--vin-accent); }
        .scr-dark::-webkit-scrollbar { width: 5px; height: 5px; }
        .scr-dark::-webkit-scrollbar-track { background: transparent; }
        .scr-dark::-webkit-scrollbar-thumb { background: var(--vin-border-subtle); border-radius: 10px; }
        .scr-dark::-webkit-scrollbar-thumb:hover { background: var(--vin-border-strong); }
      `}</style>
    </div>
  );
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">{label}</label>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-red-300">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
