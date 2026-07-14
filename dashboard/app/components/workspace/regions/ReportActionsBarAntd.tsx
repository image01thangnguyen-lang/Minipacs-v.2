"use client";

import React, { useRef } from "react";
import {
  PrinterOutlined,
  ReloadOutlined,
  SaveOutlined,
  LinkOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Button, Select, Space, Typography, Tooltip, Alert } from "antd";
import { useReactToPrint } from "react-to-print";
import type { ReportPanelActions } from "@/lib/workspace/report-workspace";
import { PrintTemplateViewer, type PrintContext } from "@/app/report/[studyInstanceUid]/components/PrintTemplateViewer";
import { logArchivePrintAction } from "@/app/archive/actions";

const { Text } = Typography;

export interface PrintTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  htmlContent: string;
}

interface ReportActionsBarAntdProps {
  studyUid: string;
  reportId: string | null;
  allowedActions: ReportPanelActions;
  studyStatus: string;
  hisResultStatus?: string | null;
  isSaving: boolean;
  onSave: (status: "DRAFT" | "FINAL") => void;
  autosaveStatus?: "IDLE" | "SAVING" | "SAVED" | "ERROR" | "STALE";
  autosaveError?: string | null;
  onHisRetry?: () => void;
  isHisSyncing?: boolean;
  onShareOpen?: () => void;
  onConsultOpen?: () => void;
  onIncidentReport?: () => void;
  printTemplates: PrintTemplate[];
  selectedPrintTemplateId: string;
  onPrintTemplateChange: (id: string) => void;
  templateHtml: string;
  printContext: PrintContext;
  printTitle: string;
  onCopyDraft?: () => void;
}

export function ReportActionsBarAntd({
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
}: ReportActionsBarAntdProps) {
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
      className="h-fit rounded-xl border border-[#303030] bg-[#141414] p-4"
      aria-label="Report actions"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-300">
          Tác vụ
        </h3>
        {autosaveStatus === "SAVING" && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
            <SyncOutlined spin /> Đang lưu...
          </span>
        )}
        {autosaveStatus === "SAVED" && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#13C2C2]">
            <CheckCircleOutlined /> Đã lưu
          </span>
        )}
        {autosaveStatus === "ERROR" && (
          <Tooltip title={autosaveError || "Lỗi lưu nháp"}>
            <span className="flex items-center gap-1 text-[10px] font-medium text-red-400">
              <CloseCircleOutlined /> Lỗi lưu
            </span>
          </Tooltip>
        )}
        {autosaveStatus === "STALE" && (
          <Tooltip title={autosaveError || "Phiên bản cũ. Hãy tải lại trang."}>
            <span className="flex items-center gap-1 text-[10px] font-medium text-orange-400">
              <WarningOutlined /> Xung đột
            </span>
          </Tooltip>
        )}
      </div>

      <div className="space-y-2">
        {printTemplates.length > 0 ? (
          <div className="mb-4 flex flex-col gap-1">
            <Text className="text-xs font-semibold text-gray-400">Mẫu in</Text>
            <Select
              size="small"
              value={selectedPrintTemplateId}
              onChange={onPrintTemplateChange}
              options={printTemplates.map(t => ({ value: t.id, label: t.name }))}
              className="w-full"
            />
          </div>
        ) : (
          <div className="mb-4 flex flex-col gap-1">
            <Text className="text-xs font-semibold text-gray-400">Mẫu in</Text>
            <Select
              size="small"
              disabled
              value=""
              options={[{ value: "", label: "Mặc định (System)" }]}
              className="w-full opacity-60"
            />
          </div>
        )}

        <Button
          block
          icon={<PrinterOutlined />}
          onClick={() => handlePrint()}
          className="font-semibold"
        >
          In phiếu
        </Button>

        {autosaveStatus === "STALE" && onCopyDraft && (
          <Button
            block
            danger
            icon={<ReloadOutlined />}
            onClick={onCopyDraft}
            className="font-semibold border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
          >
            Sao chép bản nháp
          </Button>
        )}

        {canShowHisRetry && onHisRetry && (
          <Button
            block
            icon={<ReloadOutlined />}
            loading={isHisSyncing}
            disabled={hisAlreadySynced}
            onClick={onHisRetry}
            className={`font-semibold ${
              hisResultStatus === "FAILED"
                ? "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "border-[#13C2C2]/50 bg-[#13C2C2]/10 text-[#13C2C2] hover:bg-[#13C2C2]/20"
            }`}
          >
            {hisResultStatus === "FAILED" ? "Retry HIS" : "Gửi HIS"}
          </Button>
        )}

        {allowedActions.share && onShareOpen && (
          <Button
            block
            icon={<LinkOutlined className="text-cyan-400" />}
            disabled={isSaving || !reportId}
            onClick={onShareOpen}
            className="font-semibold text-gray-300 hover:text-white"
          >
            Chia sẻ
          </Button>
        )}

        {allowedActions.createConsultation && onConsultOpen && (
          <Button
            block
            icon={<TeamOutlined className="text-pink-400" />}
            onClick={onConsultOpen}
            className="font-semibold text-gray-300 hover:text-white"
          >
            Hội chẩn
          </Button>
        )}

        {onIncidentReport && (
          <Button
            block
            icon={<WarningOutlined className="text-orange-400" />}
            onClick={onIncidentReport}
            className="font-semibold text-gray-300 hover:text-white"
          >
            Báo sự cố
          </Button>
        )}

        {allowedActions.draftReport && (
          <Button
            block
            icon={<SaveOutlined />}
            onClick={() => onSave("DRAFT")}
            disabled={isSaving}
            className="font-semibold text-gray-300"
          >
            Lưu nháp
          </Button>
        )}

        {(allowedActions.signReport || allowedActions.draftReport) && (
          <Button
            block
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => onSave("FINAL")}
            loading={isSaving}
            className="font-semibold mt-2"
          >
            Hoàn tất
          </Button>
        )}

        {!allowedActions.draftReport && !allowedActions.signReport && (
          <Alert
            message="Chế độ chỉ đọc — Bạn không có quyền chỉnh sửa báo cáo này"
            type="info"
            className="mt-2 text-center text-xs py-1 px-2 border-[#303030] bg-[#1F1F1F] text-gray-400"
          />
        )}
      </div>

      <PrintTemplateViewer
        ref={printRef}
        templateHtml={templateHtml}
        context={printContext}
      />
    </aside>
  );
}
