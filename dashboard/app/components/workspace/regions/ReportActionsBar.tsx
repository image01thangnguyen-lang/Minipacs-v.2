"use client";

import React, { useRef, useState } from "react";
import {
  CheckCircle,
  Loader2,
  Printer,
  RefreshCcw,
  Save,
  Link as LinkIcon,
  Users,
  ShieldAlert,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import type { ReportPanelActions } from "@/lib/workspace/report-workspace";
import { PrintTemplateViewer, type PrintContext } from "@/app/report/[studyInstanceUid]/components/PrintTemplateViewer";
import { logArchivePrintAction } from "@/app/archive/actions";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PrintTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  htmlContent: string;
}

interface ReportActionsBarProps {
  /** Study UID for context/routing */
  studyUid: string;
  /** Report ID (null if no report exists yet) */
  reportId: string | null;
  /** Server-evaluated allowed actions */
  allowedActions: ReportPanelActions;
  /** Current study/report workflow status for HIS button gating */
  studyStatus: string;
  /** HIS result status for retry button state */
  hisResultStatus?: string | null;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Save handler */
  onSave: (status: "DRAFT" | "FINAL") => void;
  /** Autosave status from useAutosave hook */
  autosaveStatus?: "IDLE" | "SAVING" | "SAVED" | "ERROR" | "STALE";
  /** Error message if autosave failed */
  autosaveError?: string | null;
  /** HIS retry handler */
  onHisRetry?: () => void;
  /** Whether HIS retry is in progress */
  isHisSyncing?: boolean;
  /** Share dialog opener */
  onShareOpen?: () => void;
  /** Consultation dialog opener */
  onConsultOpen?: () => void;
  /** Incident report handler */
  onIncidentReport?: () => void;
  /** Print templates */
  printTemplates: PrintTemplate[];
  /** Currently selected print template ID */
  selectedPrintTemplateId: string;
  /** Print template change handler */
  onPrintTemplateChange: (id: string) => void;
  /** Template HTML for print */
  templateHtml: string;
  /** Print context data */
  printContext: PrintContext;
  /** Print document title */
  printTitle: string;
  /** Copy draft handler for STALE conflict recovery */
  onCopyDraft?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ReportActionsBar({
  studyUid,
  reportId,
  allowedActions,
  studyStatus,
  hisResultStatus,
  isSaving,
  autosaveStatus,
  autosaveError,
  onSave,
  onHisRetry,
  isHisSyncing,
  onShareOpen,
  onConsultOpen,
  onIncidentReport,
  printTemplates,
  selectedPrintTemplateId,
  onPrintTemplateChange,
  templateHtml,
  printContext,
  printTitle,
  onCopyDraft,
}: ReportActionsBarProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
    onAfterPrint: () => {
      logArchivePrintAction(studyUid, "PRINT").catch(console.error);
    },
  });

  const canShowHisRetry =
    allowedActions.syncHis &&
    (studyStatus === "FINALIZED" || studyStatus === "DELIVERED");

  const hisAlreadySynced =
    hisResultStatus === "SYNCED" || hisResultStatus === "SENT";

  return (
    <aside
      className="h-fit rounded-xl border border-vin-border bg-vin-panel p-4"
      aria-label="Report actions"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-vin-text2">
          Tác vụ
        </h3>
        {autosaveStatus === "SAVING" && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-vin-muted">
            <Loader2 className="h-3 w-3 animate-spin" /> Đang lưu...
          </span>
        )}
        {autosaveStatus === "SAVED" && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-vin-accent">
            <CheckCircle className="h-3 w-3" /> Đã lưu
          </span>
        )}
        {autosaveStatus === "ERROR" && (
          <span
            className="flex items-center gap-1 text-[10px] font-medium text-red-400"
            title={autosaveError || "Lỗi lưu nháp"}
          >
            <XCircle className="h-3 w-3" /> Lỗi lưu
          </span>
        )}
        {autosaveStatus === "STALE" && (
          <span
            className="flex items-center gap-1 text-[10px] font-medium text-orange-400"
            title={autosaveError || "Phiên bản cũ. Hãy tải lại trang."}
          >
            <ShieldAlert className="h-3 w-3" /> Xung đột
          </span>
        )}
      </div>
      <div className="space-y-2">
        {/* Print template selector */}
        {printTemplates.length > 0 && (
          <div className="mb-4">
            <label
              htmlFor="report-print-template"
              className="mb-1 block text-xs font-semibold text-vin-text2"
            >
              Mẫu in
            </label>
            <select
              id="report-print-template"
              value={selectedPrintTemplateId}
              onChange={(e) => onPrintTemplateChange(e.target.value)}
              className="w-full rounded-md border border-vin-border bg-vin-shell px-2 py-1.5 text-xs text-vin-text outline-none transition focus:border-vin-accent"
            >
              {printTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {printTemplates.length === 0 && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-vin-text2">
              Mẫu in
            </label>
            <select
              disabled
              className="w-full rounded-md border border-vin-border bg-vin-shell px-2 py-1.5 text-xs text-vin-text outline-none opacity-60"
            >
              <option value="">Mặc định (System)</option>
            </select>
          </div>
        )}

        {/* Print button — always available if readReport */}
        <button
          type="button"
          onClick={() => handlePrint()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
        >
          <Printer className="h-4 w-4" />
          In phiếu
        </button>

        {/* Conflict recovery */}
        {autosaveStatus === "STALE" && onCopyDraft && (
          <button
            type="button"
            onClick={onCopyDraft}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20"
          >
            <RotateCcw className="h-4 w-4" />
            Sao chép bản nháp
          </button>
        )}

        {/* HIS retry — only when syncHis allowed + status permits */}
        {canShowHisRetry && onHisRetry && (
          <button
            type="button"
            onClick={onHisRetry}
            disabled={isHisSyncing || hisAlreadySynced}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-40 ${
              hisResultStatus === "FAILED"
                ? "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "border-vin-accent/50 bg-vin-accent/10 text-vin-accent hover:bg-vin-accent/20"
            }`}
          >
            {isHisSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {hisResultStatus === "FAILED" ? "Retry HIS" : "Gửi HIS"}
          </button>
        )}

        {/* Share — gated by allowedActions.share */}
        {allowedActions.share && onShareOpen && (
          <button
            type="button"
            disabled={isSaving || !reportId}
            onClick={onShareOpen}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-50"
          >
            <LinkIcon className="h-4 w-4 text-cyan-400" />
            Chia sẻ
          </button>
        )}

        {/* Consultation — gated by allowedActions.createConsultation */}
        {allowedActions.createConsultation && onConsultOpen && (
          <button
            type="button"
            onClick={onConsultOpen}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
          >
            <Users className="h-4 w-4 text-pink-400" />
            Hội chẩn
          </button>
        )}

        {/* Incident report — always available if handler provided */}
        {onIncidentReport && (
          <button
            type="button"
            onClick={onIncidentReport}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
          >
            <ShieldAlert className="h-4 w-4 text-orange-400" />
            Báo sự cố
          </button>
        )}

        {/* Save Draft — gated by allowedActions.draftReport */}
        {allowedActions.draftReport && (
          <button
            type="button"
            onClick={() => onSave("DRAFT")}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Lưu nháp
          </button>
        )}

        {/* Finalize — gated by allowedActions.signReport or draftReport */}
        {(allowedActions.signReport || allowedActions.draftReport) && (
          <button
            type="button"
            onClick={() => onSave("FINAL")}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Hoàn tất
          </button>
        )}

        {/* Read-only notice */}
        {!allowedActions.draftReport && !allowedActions.signReport && (
          <div
            className="mt-2 rounded-lg border border-vin-border bg-vin-shell px-3 py-2 text-center text-xs text-vin-muted"
            role="status"
          >
            Chế độ chỉ đọc — Bạn không có quyền chỉnh sửa báo cáo này
          </div>
        )}
      </div>

      {/* Hidden print template for react-to-print */}
      <PrintTemplateViewer
        ref={printRef}
        templateHtml={templateHtml}
        context={printContext}
      />
    </aside>
  );
}
