"use client";

import React, { useEffect, useState } from "react";
import { BadgeCheck, Building2, Image as ImageIcon, Loader2, Save, Upload } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { CustomSelect } from "@/app/components/CustomSelect";
import { getClinicProfile, saveClinicProfileAction } from "./actions";

type ClinicProfileView = {
  id?: string;
  name: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string | null;
  headerText?: string;
  footerText?: string;
  licenseNumber?: string;
  defaultReportLanguage?: string;
  faviconPath?: string | null;
};

const emptyProfile: ClinicProfileView = {
  name: "Mini PACS",
  legalName: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logoPath: null,
  headerText: "",
  footerText: "",
  licenseNumber: "",
  defaultReportLanguage: "vi",
  faviconPath: null,
};

export default function ClinicProfilePage() {
  const [profile, setProfile] = useState<ClinicProfileView>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getClinicProfile();
      setProfile(data || emptyProfile);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không tải được thông tin phòng khám.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    document.title = "Mini PACS - Thông tin phòng khám";
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    const form = event.currentTarget;

    try {
      const formData = new FormData(form);
      const saved = await saveClinicProfileAction(formData);
      setProfile(saved || emptyProfile);
      setMessage("Đã lưu thông tin phòng khám.");
      const logoInput = form.elements.namedItem("logo") as HTMLInputElement | null;
      if (logoInput) logoInput.value = "";
      const faviconInput = form.elements.namedItem("favicon") as HTMLInputElement | null;
      if (faviconInput) faviconInput.value = "";
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không lưu được thông tin phòng khám.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="clinic" />

      <section className="flex h-full w-[56%] min-w-[680px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-sm font-bold tracking-tight text-white">
                <Building2 className="h-4 w-4 text-vin-accent" />
                Thông tin phòng khám
              </h1>
              <p className="mt-0.5 text-[10px] text-vin-muted">
                Logo, tên đơn vị, địa chỉ và footer dùng khi in phiếu kết quả.
              </p>
            </div>
            {message && (
              <span className="rounded bg-vin-status-approved-bg px-2.5 py-1 text-[10px] font-bold text-white">
                {message}
              </span>
            )}
          </div>
          {error && (
            <div className="mt-3 rounded border border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 px-3 py-2 text-[11px] font-semibold text-red-200">
              {error}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center text-vin-muted">
            <Loader2 className="mb-2 h-5 w-5 animate-spin text-vin-accent" />
            Đang tải thông tin phòng khám...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark" encType="multipart/form-data">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên hiển thị">
                <input
                  name="name"
                  required
                  defaultValue={profile.name}
                  className="field-input"
                  placeholder="Tên phòng khám"
                />
              </Field>
              <Field label="Tên pháp lý">
                <input
                  name="legalName"
                  defaultValue={profile.legalName || ""}
                  className="field-input"
                  placeholder="Tên công ty/đơn vị nếu khác"
                />
              </Field>
            </div>

            <Field label="Địa chỉ">
              <input
                name="address"
                defaultValue={profile.address || ""}
                className="field-input"
                placeholder="Địa chỉ phòng khám"
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Điện thoại">
                <input name="phone" defaultValue={profile.phone || ""} className="field-input" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" defaultValue={profile.email || ""} className="field-input" />
              </Field>
              <Field label="Website">
                <input name="website" defaultValue={profile.website || ""} className="field-input" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Số giấy phép">
                <input name="licenseNumber" defaultValue={profile.licenseNumber || ""} className="field-input" />
              </Field>
              <Field label="Ngôn ngữ mặc định">
                <CustomSelect
                  name="defaultReportLanguage"
                  options={[
                    { value: "vi", label: "Tiếng Việt" },
                    { value: "en", label: "English" },
                  ]}
                  value={profile.defaultReportLanguage || "vi"}
                  onChange={(value) => setProfile(current => ({ ...current, defaultReportLanguage: value }))}
                />
              </Field>
            </div>

            <div className="rounded border border-vin-border bg-vin-panel2 p-3">
              <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                <Upload className="h-3.5 w-3.5" />
                Logo phòng khám
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-28 items-center justify-center rounded border border-vin-border bg-white p-2">
                  {profile.logoPath ? (
                    <img src={profile.logoPath} alt="Logo phòng khám" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    name="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-shell file:px-3 file:py-2 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-vin-faint">JPG, PNG, WEBP hoặc GIF. Nếu không chọn file mới, logo hiện tại được giữ nguyên.</p>
                    {profile.logoPath && (
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, logoPath: null })}
                        className="text-[10px] font-semibold text-vin-status-danger-text hover:underline"
                      >
                        Xóa Logo
                      </button>
                    )}
                  </div>
                  {profile.logoPath === null && <input type="hidden" name="removeLogo" value="true" />}
                </div>
              </div>
            </div>

            <div className="rounded border border-vin-border bg-vin-panel2 p-3">
              <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                <Upload className="h-3.5 w-3.5" />
                Favicon trình duyệt
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded border border-vin-border bg-white p-2">
                  {profile.faviconPath ? (
                    <img src={profile.faviconPath} alt="Favicon" className="max-h-full max-w-full object-contain" />
                  ) : profile.logoPath ? (
                    <img src={profile.logoPath} alt="Logo phòng khám" className="max-h-full max-w-full object-contain opacity-50" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    name="favicon"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon"
                    className="block w-full text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-shell file:px-3 file:py-2 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-vin-faint">Khuyên dùng ICO hoặc PNG vuông. Sẽ dùng Logo nếu để trống.</p>
                    {profile.faviconPath && (
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, faviconPath: null })}
                        className="text-[10px] font-semibold text-vin-status-danger-text hover:underline"
                      >
                        Xóa Favicon
                      </button>
                    )}
                  </div>
                  {/* Hidden input to tell backend to nullify the field if no new file is uploaded */}
                  {profile.faviconPath === null && <input type="hidden" name="removeFavicon" value="true" />}
                </div>
              </div>
            </div>

            <Field label="Header phụ trên phiếu">
              <textarea
                name="headerText"
                defaultValue={profile.headerText || ""}
                className="field-textarea h-24"
                placeholder="Ví dụ: Hệ thống chẩn đoán hình ảnh"
              />
            </Field>

            <Field label="Footer trên phiếu">
              <textarea
                name="footerText"
                defaultValue={profile.footerText || ""}
                className="field-textarea h-24"
                placeholder="Thông tin hotline, lưu ý pháp lý hoặc hướng dẫn nhận kết quả."
              />
            </Field>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex min-w-[160px] items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu thông tin
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <BadgeCheck className="h-4 w-4 text-vin-accent" />
            Preview header phiếu in
          </h2>
          <p className="mt-0.5 text-[10px] text-vin-muted">Bố cục này sẽ được dùng trong phiếu kết quả.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6 scr-dark">
          <div className="mx-auto max-w-[720px] rounded bg-white p-8 text-slate-900 shadow-xl">
            <div className="flex items-start gap-4 border-b border-slate-200 pb-4">
              <div className="flex h-16 w-28 flex-shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 p-2">
                {profile.logoPath ? (
                  <img src={profile.logoPath} alt="Logo phòng khám" className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold uppercase text-slate-950">{profile.name}</h3>
                {profile.legalName && <p className="text-sm font-semibold text-slate-700">{profile.legalName}</p>}
                {profile.headerText && <p className="mt-1 text-sm text-slate-700">{profile.headerText}</p>}
                <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                  {profile.address && <p>{profile.address}</p>}
                  <p>
                    {[profile.phone, profile.email, profile.website].filter(Boolean).join(" · ") || "Chưa cấu hình liên hệ"}
                  </p>
                  {profile.licenseNumber && <p>Giấy phép: {profile.licenseNumber}</p>}
                </div>
              </div>
            </div>

            <div className="py-8 text-center">
              <h4 className="text-base font-bold uppercase">Kết quả chẩn đoán hình ảnh</h4>
              <p className="mt-2 text-sm text-slate-500">Nội dung phiếu bệnh nhân sẽ hiển thị tại đây.</p>
            </div>

            <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
              {profile.footerText || "Chưa cấu hình footer phiếu in."}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .field-input{width:100%;border-radius:0.25rem;border:1px solid var(--vin-border-subtle);background:var(--vin-bg-sidebar);padding:0.5rem 0.75rem;font-size:0.875rem;color:var(--vin-text-primary);outline:none}
        .field-input:focus{border-color:var(--vin-accent)}
        .field-textarea{width:100%;resize:none;border-radius:0.25rem;border:1px solid var(--vin-border-subtle);background:var(--vin-bg-sidebar);padding:0.5rem 0.75rem;font-size:0.875rem;line-height:1.55;color:var(--vin-text-primary);outline:none}
        .field-textarea:focus{border-color:var(--vin-accent)}
        .scr-dark::-webkit-scrollbar{width:5px;height:5px}
        .scr-dark::-webkit-scrollbar-track{background:transparent}
        .scr-dark::-webkit-scrollbar-thumb{background:var(--vin-border-subtle);border-radius:10px}
        .scr-dark::-webkit-scrollbar-thumb:hover{background:var(--vin-border-strong)}
      `}</style>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">{label}</label>
      {children}
    </div>
  );
}
