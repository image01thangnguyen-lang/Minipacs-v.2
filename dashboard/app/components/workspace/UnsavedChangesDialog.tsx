"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWorkspaceDirty } from "./hooks/WorkspaceDirtyContext";
import { Loader2 } from "lucide-react";

export function UnsavedChangesDialog() {
  const { pendingAction, resolvePendingAction, setDirty, executeSave } = useWorkspaceDirty();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingAction) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        event.preventDefault();
        setSaveError(null);
        resolvePendingAction(false);
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [pendingAction, isSaving, resolvePendingAction]);

  if (!pendingAction) return null;

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const success = await executeSave();
      if (success) {
        setDirty(false);
        resolvePendingAction(true); // proceed
      } else {
        setSaveError("Không thể lưu bản nháp. Vui lòng xử lý lỗi lưu hoặc tiếp tục chỉnh sửa.");
      }
    } catch {
      setSaveError("Không thể lưu bản nháp. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setIsSaving(false);
    }
    // If failed, we don't proceed, the dialog stays open or we just let them try again.
  };

  const handleDiscard = () => {
    setSaveError(null);
    setDirty(false);
    resolvePendingAction(true); // proceed
  };

  const handleCancel = () => {
    setSaveError(null);
    resolvePendingAction(false); // cancel navigation
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl bg-vin-panel p-6 shadow-xl border border-vin-border"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
        aria-describedby="unsaved-dialog-description"
      >
        <h2 id="unsaved-dialog-title" className="text-lg font-bold text-vin-text">Bạn có thay đổi chưa lưu</h2>
        <p id="unsaved-dialog-description" className="mt-2 text-sm text-vin-text2">
          Bản nháp của bạn chứa các thay đổi chưa được lưu vào hệ thống. Bạn muốn xử lý thế nào trước khi rời đi?
        </p>
        {saveError && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {saveError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
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
