"use client";

import React, { useState } from "react";
import { useWorkspaceDirty } from "./hooks/WorkspaceDirtyContext";
import { Loader2 } from "lucide-react";

export function UnsavedChangesDialog() {
  const { pendingAction, resolvePendingAction, setDirty, executeSave } = useWorkspaceDirty();
  const [isSaving, setIsSaving] = useState(false);

  if (!pendingAction) return null;

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    const success = await executeSave();
    setIsSaving(false);
    if (success) {
      setDirty(false);
      resolvePendingAction(true); // proceed
    }
    // If failed, we don't proceed, the dialog stays open or we just let them try again.
  };

  const handleDiscard = () => {
    setDirty(false);
    resolvePendingAction(true); // proceed
  };

  const handleCancel = () => {
    resolvePendingAction(false); // cancel navigation
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-vin-panel p-6 shadow-xl border border-vin-border">
        <h2 className="text-lg font-bold text-vin-text">Bạn có thay đổi chưa lưu</h2>
        <p className="mt-2 text-sm text-vin-text2">
          Bản nháp của bạn chứa các thay đổi chưa được lưu vào hệ thống. Bạn muốn xử lý thế nào trước khi rời đi?
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="rounded-lg border border-vin-border px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:bg-vin-shell disabled:opacity-50"
          >
            Tiếp tục chỉnh sửa
          </button>
          <button
            onClick={handleDiscard}
            disabled={isSaving}
            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            Bỏ qua thay đổi
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accentHover disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu và tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
