"use client";

import { X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CustomSelect } from "./CustomSelect";

type TechOption = { id: string; name: string };

type ClinicalInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "CLINICAL_INFO" | "INDICATION";
  studyInstanceUid: string;
  initialData?: {
    clinicalInfo?: string;
    procedureCode?: string;
    procedureDescription?: string;
    technologistId?: string;
    bodyPart?: string;
  };
  technologists?: TechOption[];
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
};

export function ClinicalInfoModal({
  isOpen,
  onClose,
  mode,
  studyInstanceUid,
  initialData = {},
  technologists = [],
  onSave,
}: ClinicalInfoModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [clinicalInfo, setClinicalInfo] = useState(initialData.clinicalInfo || "");
  const [procedureCode, setProcedureCode] = useState(initialData.procedureCode || "");
  const [procedureDescription, setProcedureDescription] = useState(initialData.procedureDescription || "");
  const [technologistId, setTechnologistId] = useState(initialData.technologistId || "");
  const [bodyPart, setBodyPart] = useState(initialData.bodyPart || "");

  useEffect(() => {
    if (isOpen) {
      setClinicalInfo(initialData.clinicalInfo || "");
      setProcedureCode(initialData.procedureCode || "");
      setProcedureDescription(initialData.procedureDescription || "");
      setTechnologistId(initialData.technologistId || "");
      setBodyPart(initialData.bodyPart || "");
      setError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const payload = mode === "CLINICAL_INFO"
        ? { clinicalInfo, technologistId, bodyPart }
        : { procedureCode, procedureDescription };

      const result = await onSave(payload);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Có lỗi xảy ra khi lưu.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi hệ thống.");
    } finally {
      setIsSaving(false);
    }
  };

  const title = mode === "CLINICAL_INFO" ? "Cập nhật lâm sàng & KTV" : "Cập nhật chỉ định";

  const techOptions = technologists.map(t => ({ value: t.id, label: t.name }));

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-xl border border-vin-border bg-vin-shell p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-vin-muted hover:bg-white/10 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {mode === "CLINICAL_INFO" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-vin-text2">Thông tin lâm sàng</label>
                <textarea
                  value={clinicalInfo}
                  onChange={e => setClinicalInfo(e.target.value)}
                  className="h-24 w-full rounded-md border border-white/10 bg-vin-root/50 px-3 py-2 text-sm text-vin-text outline-none transition focus:border-vin-accent"
                  placeholder="Nhập triệu chứng, chẩn đoán sơ bộ..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-vin-text2">Kỹ thuật viên chụp</label>
                <CustomSelect
                  options={[{ value: "", label: "-- Không chọn --" }, ...techOptions]}
                  value={technologistId}
                  onChange={setTechnologistId}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-vin-text2">Bộ phận chụp (Body Part)</label>
                <input
                  type="text"
                  value={bodyPart}
                  onChange={e => setBodyPart(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-vin-root/50 px-3 py-2 text-sm text-vin-text outline-none transition focus:border-vin-accent"
                />
              </div>
            </>
          )}

          {mode === "INDICATION" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-vin-text2">Mã dịch vụ</label>
                <input
                  type="text"
                  value={procedureCode}
                  onChange={e => setProcedureCode(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-vin-root/50 px-3 py-2 text-sm text-vin-text outline-none transition focus:border-vin-accent"
                  placeholder="VD: C01.01"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-vin-text2">Tên dịch vụ chỉ định</label>
                <input
                  type="text"
                  value={procedureDescription}
                  onChange={e => setProcedureDescription(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-vin-root/50 px-3 py-2 text-sm text-vin-text outline-none transition focus:border-vin-accent"
                  placeholder="VD: Chụp X-Quang ngực thẳng"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-vin-text2 hover:text-white"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-vin-accent px-4 py-2 text-sm font-semibold text-white hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
