"use client";

import React, { useEffect, useState } from "react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { Loader2, Plus, HardDrive, RefreshCw, Trash2, CheckCircle2, AlertCircle, X, ShieldAlert } from "lucide-react";
import { getStorageFoldersAction, upsertStorageFolderAction, checkStorageFolderAction, deleteStorageFolderAction } from "./actions";
import { CustomSelect } from "@/app/components/CustomSelect";

type StorageFolderRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  path: string;
  facilityId: string | null;
  isActive: boolean;
  lastCheckStatus: string | null;
  lastCheckMessage: string | null;
  lastCheckAt: string | Date | null;
  facility: { id: string; name: string } | null;
};

export default function StorageAdminPage() {
  const [folders, setFolders] = useState<StorageFolderRow[]>([]);
  const [facilities, setFacilities] = useState<{id: string; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<StorageFolderRow | null>(null);
  const [formType, setFormType] = useState("NORMAL");
  const [formFacilityId, setFormFacilityId] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getStorageFoldersAction();
      setFolders(data.folders as any[]);
      setFacilities(data.facilities);
    } catch (err: any) {
      setErrorMessage(err.message || "Không tải được dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Mini PACS - Quản lý lưu trữ";
    loadData();
  }, []);

  const handleOpenForm = (folder?: StorageFolderRow) => {
    setErrorMessage("");
    setEditingFolder(folder || null);
    setFormType(folder?.type || "NORMAL");
    setFormFacilityId(folder?.facilityId || "");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const formData = new FormData(e.currentTarget);
      const result = await upsertStorageFolderAction({
        id: editingFolder?.id,
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        type: formData.get("type") as string,
        path: formData.get("path") as string,
        facilityId: formData.get("facilityId") as string,
        isActive: formData.get("isActive") === "on",
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheck = async (id: string) => {
    setIsLoading(true);
    try {
      await checkStorageFolderAction(id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn khóa cấu hình này? (Cấu hình sẽ bị ẩn, không xóa hẳn)")) return;
    setIsLoading(true);
    try {
      const result = await deleteStorageFolderAction(id);
      if (!result.success) throw new Error(result.error);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="catalogs" />
      
      <main className="flex min-w-0 flex-1 flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-vin-accent" />
                Cấu hình lưu trữ (Storage / Backup)
              </h1>
              <p className="mt-1 text-[11px] text-vin-muted">Quản lý các thư mục lưu trữ ảnh DICOM, báo cáo, và sao lưu.</p>
            </div>
            <button 
              onClick={() => handleOpenForm()}
              className="flex items-center gap-1.5 rounded bg-vin-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-vin-accentHover"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm cấu hình
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="border-b border-red-400/30 bg-red-950/30 px-4 py-2 text-[11px] font-semibold text-red-100 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            {errorMessage}
            <button onClick={() => setErrorMessage("")} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <div className="flex-1 overflow-auto scr-dark p-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-vin-muted">
              <Loader2 className="h-5 w-5 animate-spin text-vin-accent mr-2" /> Đang tải dữ liệu...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map(folder => (
                <div key={folder.id} className={`rounded-lg border border-vin-border bg-vin-panel overflow-hidden flex flex-col ${!folder.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start p-3 border-b border-vin-border/50 bg-vin-panel2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{folder.name}</h3>
                        <span className="text-[9px] font-mono bg-vin-shell px-1.5 py-0.5 rounded text-vin-text2 border border-vin-border">{folder.type}</span>
                      </div>
                      <p className="text-[10px] font-mono text-vin-muted mt-1">{folder.code}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleCheck(folder.id)} title="Kiểm tra kết nối" className="p-1.5 bg-vin-shell rounded text-vin-muted hover:text-white border border-vin-border">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleOpenForm(folder)} title="Sửa" className="p-1.5 bg-vin-shell rounded text-vin-accent hover:bg-vin-accent/20 border border-vin-border/30">
                        <HardDrive className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(folder.id)} title="Xóa" className="p-1.5 bg-vin-shell rounded text-red-400 hover:bg-red-500/20 border border-red-500/30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3 flex-1 flex flex-col gap-3 text-[11px]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-vin-muted block mb-1">Đường dẫn</span>
                      <code className="bg-vin-root px-1.5 py-1 rounded border border-vin-border text-vin-text2 block truncate" title={folder.path}>{folder.path}</code>
                    </div>
                    
                    {folder.facility && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-vin-muted block mb-1">Cơ sở</span>
                        <div className="text-vin-text2">{folder.facility.name}</div>
                      </div>
                    )}

                    <div className="mt-auto border-t border-vin-border/50 pt-2">
                      <span className="text-[10px] uppercase font-bold text-vin-muted block mb-1">Trạng thái kết nối</span>
                      {folder.lastCheckStatus === "OK" ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {folder.lastCheckMessage || "OK"}
                        </div>
                      ) : folder.lastCheckStatus === "READ_ONLY" ? (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <AlertCircle className="h-3.5 w-3.5" /> {folder.lastCheckMessage || "Chỉ đọc"}
                        </div>
                      ) : folder.lastCheckStatus === "FAILED" ? (
                        <div className="flex items-center gap-1.5 text-red-400">
                          <X className="h-3.5 w-3.5" /> {folder.lastCheckMessage || "Lỗi kết nối"}
                        </div>
                      ) : (
                        <div className="text-vin-muted">Chưa kiểm tra</div>
                      )}
                      {folder.lastCheckAt && (
                        <div className="text-[9px] text-vin-faint mt-1">Cập nhật: {new Date(folder.lastCheckAt).toLocaleString("vi-VN")}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {folders.length === 0 && (
                <div className="col-span-full py-12 text-center text-vin-muted border border-dashed border-vin-border rounded-lg">
                  Chưa có cấu hình lưu trữ nào.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isFormOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-vin-border bg-vin-panel shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-vin-accent" />
                {editingFolder ? "Sửa cấu hình lưu trữ" : "Thêm cấu hình lưu trữ"}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-vin-muted hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-vin-muted mb-1">Mã (Code)</label>
                  <input name="code" defaultValue={editingFolder?.code} required className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 outline-none focus:border-vin-accent" placeholder="vd: PRIMARY_STORE" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-vin-muted mb-1">Loại</label>
                  <CustomSelect 
                    name="type" 
                    options={[
                      {value: "NORMAL", label: "Normal (Thư mục mặc định)"},
                      {value: "SHARE", label: "Share (Chia sẻ mạng)"},
                      {value: "UPLOAD", label: "Upload (Tải lên)"},
                      {value: "BACKUP", label: "Backup (Sao lưu)"},
                    ]} 
                    value={formType} 
                    onChange={(val) => setFormType(val)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-vin-muted mb-1">Tên cấu hình</label>
                <input name="name" defaultValue={editingFolder?.name} required className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 outline-none focus:border-vin-accent" placeholder="vd: Lưu trữ chính SSD" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-vin-muted mb-1">Đường dẫn (Path)</label>
                <input name="path" defaultValue={editingFolder?.path} required className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 outline-none focus:border-vin-accent" placeholder="vd: /mnt/data/pacs hoặc C:\\PACS_Data" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-vin-muted mb-1">Áp dụng cho cơ sở (Tùy chọn)</label>
                <CustomSelect 
                  name="facilityId" 
                  options={[{value: "", label: "-- Tất cả --"}, ...facilities.map(f => ({value: f.id, label: f.name}))]}
                  value={formFacilityId} 
                  onChange={(val) => setFormFacilityId(val)}
                />
              </div>

              <div className="pt-2 border-t border-vin-border/50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="isActive" type="checkbox" defaultChecked={editingFolder ? editingFolder.isActive : true} className="w-4 h-4 accent-vin-accent" />
                  <span>Kích hoạt sử dụng</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-vin-border">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded text-vin-text2 hover:bg-vin-shell border border-transparent font-semibold">Hủy</button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-vin-accent hover:bg-vin-accentHover text-white rounded font-semibold disabled:opacity-50">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
