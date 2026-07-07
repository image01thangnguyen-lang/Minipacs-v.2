"use client";

import React, { useEffect, useState } from "react";

import {
  Search,
  X,
  ListPlus,
  Stethoscope,
  Activity,
  HeartPulse,
  Syringe,
  Plus,
  Loader2,
} from "lucide-react";
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  getProcedures,
  createProcedure,
  updateProcedure,
  getIcds,
  createIcd,
  updateIcd,
  getSupplies,
  createSupply,
  updateSupply,
} from "./actions";
import { CustomSelect } from "@/app/components/CustomSelect";

type ActiveTab = "services" | "procedures" | "icds" | "supplies";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex max-w-[92px] justify-center truncate rounded px-2 py-0.5 text-[9px] font-bold ${
        active
          ? "bg-vin-status-approved-bg text-white"
          : "bg-vin-status-danger-bg text-white"
      }`}
    >
      {active ? "Đang dùng" : "Đã khóa"}
    </span>
  );
}

export default function CatalogsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("services");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Data
  const [services, setServices] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [icds, setIcds] = useState<any[]>([]);
  const [supplies, setSupplies] = useState<any[]>([]);

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "create">("view");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [svc, proc, icd, sup] = await Promise.all([
        getServiceTypes(),
        getProcedures(),
        getIcds(),
        getSupplies(),
      ]);
      setServices(svc || []);
      setProcedures(proc || []);
      setIcds(icd || []);
      setSupplies(sup || []);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Không tải được danh mục."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    document.title = "Mini PACS - Danh mục hệ thống";
  }, []);

  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMode("view");
    setSelectedId(null);
    setSearchQuery("");
    setErrorMessage("");
  };

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    try {
      const formData = new FormData(event.currentTarget);
      if (activeTab === "services") await createServiceType(formData);
      else if (activeTab === "procedures") await createProcedure(formData);
      else if (activeTab === "icds") await createIcd(formData);
      else if (activeTab === "supplies") await createSupply(formData);
      
      await loadData();
      setMode("view");
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Lưu thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    try {
      const formData = new FormData(event.currentTarget);
      if (activeTab === "services") await updateServiceType(formData);
      else if (activeTab === "procedures") await updateProcedure(formData);
      else if (activeTab === "icds") await updateIcd(formData);
      else if (activeTab === "supplies") await updateSupply(formData);
      
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Cập nhật thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabs = () => {
    const tabs = [
      { id: "services", label: "Loại dịch vụ", icon: <Activity className="h-3.5 w-3.5" /> },
      { id: "procedures", label: "Dịch vụ kỹ thuật", icon: <Stethoscope className="h-3.5 w-3.5" /> },
      { id: "icds", label: "Mã ICD", icon: <HeartPulse className="h-3.5 w-3.5" /> },
      { id: "supplies", label: "Vật tư y tế", icon: <Syringe className="h-3.5 w-3.5" /> },
    ];

    return (
      <div className="flex h-8 shrink-0 items-center rounded border border-vin-border bg-vin-panel p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabSwitch(tab.id as ActiveTab)}
            className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold transition ${
              activeTab === tab.id
                ? "bg-vin-tableSelected text-white"
                : "text-vin-muted hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  // -- Filters --
  const filteredServices = services.filter(s =>
    `${s.code} ${s.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredProcedures = procedures.filter(p =>
    `${p.code} ${p.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredIcds = icds.filter(i =>
    `${i.code} ${i.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSupplies = supplies.filter(s =>
    `${s.code} ${s.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      {/* Main List Section */}
      <section className="flex h-full w-[55%] min-w-[640px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-[132px]">
                <h1 className="truncate text-sm font-bold tracking-tight text-white">Danh mục từ điển</h1>
                <p className="mt-0.5 text-[10px] text-vin-muted">Quản lý các danh mục cấu hình</p>
              </div>
              {renderTabs()}
            </div>
            <button
              onClick={() => {
                setErrorMessage("");
                setMode("create");
                setSelectedId(null);
              }}
              className="flex items-center gap-1.5 rounded border-0 bg-vin-accent px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-vin-accentHover"
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo mới
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-vin-border bg-vin-panel py-1.5 pl-7 pr-7 text-[11px] text-vin-text placeholder:text-vin-faint outline-none transition focus:border-vin-accent"
              placeholder="Tìm kiếm mã, tên..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-vin-faint transition hover:text-vin-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tables */}
        <div className="min-h-0 flex-1 overflow-auto scr-dark">
          {isLoading ? (
            <div className="py-12 text-center text-vin-muted">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
              Đang tải dữ liệu...
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-vin-border bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
                <tr>
                  <th className="w-9 py-2 pl-2 pr-1 text-center">TT</th>
                  <th className="px-2 py-2">Mã</th>
                  <th className="px-2 py-2">Tên / Mô tả</th>
                  <th className="px-2 py-2 text-center">Trạng thái</th>
                  {activeTab === "procedures" && <th className="px-2 py-2">Nhóm</th>}
                  {activeTab === "services" && <th className="px-2 py-2 text-center">Modality</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-vin-border/45 text-[11px]">
                {activeTab === "services" && filteredServices.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setMode("view"); setErrorMessage(""); }}
                    className={`cursor-pointer select-none border-l-2 transition-colors ${
                      selectedId === item.id && mode === "view"
                        ? "border-l-vin-accent bg-vin-tableSelected text-white"
                        : "border-l-transparent odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 hover:bg-vin-tableHover"
                    }`}
                  >
                    <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{index + 1}</td>
                    <td className="px-2 py-2 font-mono text-white">{item.code}</td>
                    <td className="px-2 py-2 font-semibold text-white">{item.name}</td>
                    <td className="px-2 py-2 text-center"><StatusBadge active={item.isActive} /></td>
                    <td className="px-2 py-2 text-center font-mono">{item.defaultModality || "-"}</td>
                  </tr>
                ))}
                
                {activeTab === "procedures" && filteredProcedures.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setMode("view"); setErrorMessage(""); }}
                    className={`cursor-pointer select-none border-l-2 transition-colors ${
                      selectedId === item.id && mode === "view"
                        ? "border-l-vin-accent bg-vin-tableSelected text-white"
                        : "border-l-transparent odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 hover:bg-vin-tableHover"
                    }`}
                  >
                    <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{index + 1}</td>
                    <td className="px-2 py-2 font-mono text-white">{item.code}</td>
                    <td className="px-2 py-2">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-vin-muted">{item.hisCode ? `HIS: ${item.hisCode}` : ""}</div>
                    </td>
                    <td className="px-2 py-2 text-center"><StatusBadge active={item.isActive} /></td>
                    <td className="px-2 py-2">{item.serviceType?.name || "-"}</td>
                  </tr>
                ))}
                
                {activeTab === "icds" && filteredIcds.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setMode("view"); setErrorMessage(""); }}
                    className={`cursor-pointer select-none border-l-2 transition-colors ${
                      selectedId === item.id && mode === "view"
                        ? "border-l-vin-accent bg-vin-tableSelected text-white"
                        : "border-l-transparent odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 hover:bg-vin-tableHover"
                    }`}
                  >
                    <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{index + 1}</td>
                    <td className="px-2 py-2 font-mono text-white">{item.code}</td>
                    <td className="px-2 py-2 font-semibold text-white">{item.name}</td>
                    <td className="px-2 py-2 text-center"><StatusBadge active={item.isActive} /></td>
                  </tr>
                ))}

                {activeTab === "supplies" && filteredSupplies.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setMode("view"); setErrorMessage(""); }}
                    className={`cursor-pointer select-none border-l-2 transition-colors ${
                      selectedId === item.id && mode === "view"
                        ? "border-l-vin-accent bg-vin-tableSelected text-white"
                        : "border-l-transparent odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 hover:bg-vin-tableHover"
                    }`}
                  >
                    <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{index + 1}</td>
                    <td className="px-2 py-2 font-mono text-white">{item.code}</td>
                    <td className="px-2 py-2">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-vin-muted">ĐVT: {item.unit || "-"}</div>
                    </td>
                    <td className="px-2 py-2 text-center"><StatusBadge active={item.isActive} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Detail / Edit / Create Section */}
      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        {errorMessage && (
          <div className="border-b border-red-400/30 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-100">
            {errorMessage}
          </div>
        )}

        {(mode === "create" || (mode === "view" && selectedId)) ? (
          <React.Fragment>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <ListPlus className="h-4 w-4 text-vin-accent" />
                  {mode === "create" ? "Tạo mới" : "Chỉnh sửa"}
                </h2>
                <button onClick={() => { setMode("view"); setSelectedId(null); }} className="rounded p-1 text-vin-muted transition hover:bg-vin-panel hover:text-white" title="Đóng">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <form 
              key={`${activeTab}-${mode}-${selectedId || 'new'}`}
              onSubmit={mode === "create" ? handleCreateSubmit : handleUpdateSubmit} 
              className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark"
            >
              {(() => {
                const item = mode === "view" && selectedId 
                  ? (activeTab === "services" ? services.find(x => x.id === selectedId) :
                     activeTab === "procedures" ? procedures.find(x => x.id === selectedId) :
                     activeTab === "icds" ? icds.find(x => x.id === selectedId) :
                     supplies.find(x => x.id === selectedId))
                  : null;

                return (
                  <>
                    {item && <input type="hidden" name="id" value={item.id} />}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mã (Code)</label>
                        <input name="code" defaultValue={item?.code} disabled={!!item} required className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent disabled:opacity-50" placeholder="VD: CT001" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Tên / Diễn giải</label>
                        <input name="name" defaultValue={item?.name} required className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="Chụp CT..." />
                      </div>
                    </div>

                    {activeTab === "services" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Modality mặc định</label>
                          <input name="defaultModality" defaultValue={item?.defaultModality || ""} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="CT, MR, CR..." />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Thứ tự hiển thị</label>
                          <input name="sortOrder" type="number" defaultValue={item?.sortOrder || 0} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" />
                        </div>
                      </div>
                    )}

                    {activeTab === "procedures" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Nhóm dịch vụ</label>
                            <select name="serviceTypeId" defaultValue={item?.serviceTypeId || ""} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent">
                              <option value="">-- Chọn nhóm --</option>
                              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mã HIS mapping</label>
                            <input name="hisCode" defaultValue={item?.hisCode || ""} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="Mã đồng bộ HIS" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 text-sm text-vin-text2">
                            <input name="requiresContrast" type="checkbox" defaultChecked={item?.requiresContrast} className="h-4 w-4 accent-vin-accent" />
                            Cần tiêm thuốc cản quang
                          </label>
                          <label className="flex items-center gap-2 text-sm text-vin-text2">
                            <input name="isNonDicomEligible" type="checkbox" defaultChecked={item?.isNonDicomEligible} className="h-4 w-4 accent-vin-accent" />
                            Là dịch vụ Non-DICOM
                          </label>
                        </div>
                      </>
                    )}

                    {activeTab === "icds" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chương (Chapter)</label>
                          <input name="chapter" defaultValue={item?.chapter || ""} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="I, II, III..." />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mã nhóm</label>
                          <input name="groupCode" defaultValue={item?.groupCode || ""} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="A00-A09" />
                        </div>
                      </div>
                    )}

                    {activeTab === "supplies" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Đơn vị tính</label>
                          <input name="unit" defaultValue={item?.unit || ""} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="Lọ, Ống, ml..." />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Đơn giá mặc định</label>
                          <input name="defaultPrice" type="number" defaultValue={item?.defaultPrice || ""} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" placeholder="VNĐ" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Ghi chú / Mô tả thêm</label>
                      <textarea name="description" rows={3} defaultValue={item?.description || ""} className="w-full resize-none rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" />
                    </div>

                    <label className="mt-4 flex items-center gap-2 text-sm text-vin-text2">
                      <input name="isActive" type="checkbox" defaultChecked={item ? item.isActive : true} className="h-4 w-4 accent-vin-accent" />
                      Cho phép sử dụng
                    </label>

                    <button type="submit" disabled={isSaving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
                      {mode === "create" ? "Tạo mới" : "Lưu thay đổi"}
                    </button>
                  </>
                );
              })()}
            </form>
          </React.Fragment>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 rounded-full bg-vin-panel2 p-4 text-vin-muted shadow-inner">
              <ListPlus className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="mb-1 text-sm font-bold text-white">Chưa chọn mục nào</h3>
            <p className="max-w-[250px] text-xs leading-relaxed text-vin-muted">
              Chọn một mục từ danh sách bên trái để xem chi tiết hoặc nhấn "Tạo mới" để thêm cấu hình.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
