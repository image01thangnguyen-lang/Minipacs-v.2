"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getReportWorkspaceAction } from "../../actions/report-workspace-actions";
import type {
  ReportWorkspaceDetail,
  ReportWorkspaceError,
} from "../../../lib/workspace/report-workspace";
import {
  ReportEditorSectionAntd,
  type ReportEditorState,
} from "./regions/ReportEditorSectionAntd";
import { ReportActionsBarAntd, type PrintTemplate } from "./regions/ReportActionsBarAntd";
import type { PrintContext } from "@/app/report/[studyInstanceUid]/components/PrintTemplateViewer";
import type { ReportTemplateOption } from "@/app/components/ReportTemplatePicker";
import { getReportTemplateSuggestions } from "@/app/settings/report-templates/actions";
import { getPrintTemplatesAction, getDefaultTemplate } from "@/app/report/[studyInstanceUid]/actions";
import { getClinicProfile } from "@/app/settings/clinic-profile/actions";
import { saveReportAction } from "@/app/actions";
import { sendReportToHisAction } from "@/app/his/actions";
import { ShareDialog } from "@/components/share/ShareDialog";
import { ConsultationDialog } from "@/components/consultation/ConsultationDialog";
import { useAutosave } from "./hooks/useAutosave";
import { useWorkspaceDirty } from "./hooks/WorkspaceDirtyContext";

// ─── Panel State Machine ────────────────────────────────────────────────────────

type PanelState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; error: ReportWorkspaceError }
  | { kind: "loaded"; data: ReportWorkspaceDetail };

// ─── Helpers ────────────────────────────────────────────────────────────────────

const formatPatientName = (name?: string) =>
  name ? name.replace(/\^/g, " ") : "Unknown Patient";

const formatDicomDateTime = (date?: string, time?: string) => {
  if (!date) return "-";
  const dateValue = date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1");
  const timeValue = time
    ? time.substring(0, 4).replace(/(\d{2})(\d{2})/, "$1:$2")
    : "";
  return timeValue ? `${dateValue} ${timeValue}` : dateValue;
};

// ─── Props ──────────────────────────────────────────────────────────────────────

interface ReportWorkspacePanelProps {
  /** Study UID to load the report for */
  studyUid?: string | null;
  /**
   * Study context metadata for print and display.
   * Provided by the workspace (PatientStudyContextPanel data).
   */
  studyContext?: {
    patientName?: string | null;
    patientId?: string | null;
    studyDate?: string | null;
    studyDescription?: string | null;
    modality?: string | null;
    status?: string;
    accessionNumber?: string | null;
  } | null;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ReportWorkspacePanel({
  studyUid,
  studyContext,
}: ReportWorkspacePanelProps) {
  const router = useRouter();
  const raceTokenRef = useRef(0);

  // ─── Core state ─────────────────────────────────────────────────────────
  const [panelState, setPanelState] = useState<PanelState>({ kind: "idle" });
  const [editorState, setEditorState] = useState<ReportEditorState>({
    findings: "",
    conclusion: "",
    recommendation: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [studyStatus, setStudyStatus] = useState("READY_TO_READ");
  const [hisResultStatus, setHisResultStatus] = useState<string | null>(null);
  const [isHisSyncing, setIsHisSyncing] = useState(false);

  // ─── Template state ─────────────────────────────────────────────────────
  const [reportTemplates, setReportTemplates] = useState<ReportTemplateOption[]>([]);
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([]);
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");

  // ─── Clinic/doctor info for print ───────────────────────────────────────
  const [clinicProfile, setClinicProfile] = useState<Record<string, string>>({});

  // ─── Dialog state ───────────────────────────────────────────────────────
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [consultDialogOpen, setConsultDialogOpen] = useState(false);

  // ─── Autosave hook ──────────────────────────────────────────────────────
  const { isDirty, autosaveStatus, autosaveError, syncSavedState, forceStale, resetSavedState, waitForPendingSave } = useAutosave({
    studyUid: studyUid || null,
    editorState,
    initialRevision: panelState.kind === "loaded" ? panelState.data.revision : null,
    enabled: panelState.kind === "loaded" && panelState.data.allowedActions.draftReport,
    debounceMs: 1500,
  });

  const {
    setDirty,
    registerSaveCallback,
  } = useWorkspaceDirty();

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  // The provider outlives the report panel, so clear its dirty bit when this
  // panel unmounts. Depend only on the stable setter (not the context value,
  // which changes with isDirty and previously caused cleanup/set loops).
  useEffect(() => () => setDirty(false), [setDirty]);

  // ─── Load report workspace ─────────────────────────────────────────────
  useEffect(() => {
    const token = ++raceTokenRef.current;
    if (!studyUid) {
      setPanelState({ kind: "idle" });
      return;
    }

    setPanelState({ kind: "loading" });
    setReportTemplates([]);

    const load = async () => {
      try {
        // Parallel: report workspace + print templates + clinic profile
        const [reportResult, printTpls, defaultTpl, clinic] = await Promise.all([
          getReportWorkspaceAction(studyUid),
          getPrintTemplatesAction(),
          getDefaultTemplate(),
          getClinicProfile(),
        ]);

        if (raceTokenRef.current !== token) return; // stale response

        // Clinic profile
        if (clinic) {
          setClinicProfile({
            clinicName: clinic.name || "",
            clinicLegalName: clinic.legalName || "",
            clinicAddress: clinic.address || "",
            clinicPhone: clinic.phone || "",
            clinicEmail: clinic.email || "",
            clinicWebsite: clinic.website || "",
            clinicLogoPath: clinic.logoPath || "",
            clinicHeaderText: clinic.headerText || "",
            clinicFooterText: clinic.footerText || "",
            clinicLicenseNumber: clinic.licenseNumber || "",
          });
        }

        if ('error' in reportResult && reportResult.error) {
          setPanelState({ kind: "error", error: reportResult.error });
          return;
        }

        const data = ('data' in reportResult && reportResult.data) ? reportResult.data : null;
        if (!data) {
          setPanelState({ kind: "error", error: "UNAVAILABLE" });
          return;
        }
        setPanelState({ kind: "loaded", data });

        // Initialize editor state from report
        const loadedEditorState = {
          findings: data.findings || "",
          conclusion: data.conclusion || "",
          recommendation: data.recommendation || "",
        };
        resetSavedState(loadedEditorState, data.revision);
        setEditorState(loadedEditorState);

        // Study status from context or report
        if (studyContext?.status) setStudyStatus(studyContext.status);

        // Print templates
        if (printTpls && printTpls.length > 0) {
          setPrintTemplates(printTpls);
          let targetTplId = data.printTemplateId;
          if (!targetTplId) {
            const defaultPrint = printTpls.find((t: PrintTemplate) => t.isDefault) || printTpls[0];
            if (defaultPrint) targetTplId = defaultPrint.id;
          }
          if (targetTplId) {
            setSelectedPrintTemplateId(targetTplId);
            const matched = printTpls.find((t: PrintTemplate) => t.id === targetTplId);
            setTemplateHtml(matched?.htmlContent || defaultTpl || "");
          } else {
            setTemplateHtml(defaultTpl || "");
          }
        } else {
          setTemplateHtml(defaultTpl || "");
        }

        // Report templates (modality/bodyPart filtered)
        if (data.allowedActions.draftReport) {
          const suggestions = await getReportTemplateSuggestions({
            modality: studyContext?.modality || undefined,
            bodyPart: undefined,
          });
          if (raceTokenRef.current !== token) return;
          setReportTemplates(suggestions || []);
        }
      } catch {
        if (raceTokenRef.current !== token) return;
        setPanelState({ kind: "error", error: "UNAVAILABLE" });
      }
    };

    load();
  }, [studyUid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleEditorChange = useCallback((updates: Partial<ReportEditorState>) => {
    setEditorState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSave = useCallback(
    async (status: "DRAFT" | "FINAL") => {
      if (!studyUid || panelState.kind !== "loaded") return false;
      setIsSaving(true);
      try {
        const latestRevision = await waitForPendingSave();
        const result = await saveReportAction({
          studyInstanceUid: studyUid,
          baseRevision: latestRevision,
          status,
          findings: editorState.findings,
          conclusion: editorState.conclusion,
          recommendation: editorState.recommendation,
          printTemplateId: selectedPrintTemplateId || undefined,
        });
        if (result.success) {
          const returnedReport = (result as any).report;
          const newRev = (result as any).newRevision;
          if (returnedReport) {
            const newStatus =
              returnedReport.status === "FINAL" ? "FINALIZED" : "READING";
            setStudyStatus(newStatus);
            setHisResultStatus(returnedReport.hisResultStatus || null);
            if (Number.isInteger(newRev)) {
              syncSavedState(editorState, newRev);
            }
            return true;
          }
        } else {
          // Handle explicit failure
          const errStr = String((result as any).error);
          if (errStr.includes("STALE_REVISION") || errStr.includes("cũ") || (result as any).code === "STALE_REVISION") {
            forceStale(errStr || "Phiên bản báo cáo đã thay đổi.");
          }
          alert(errStr || "Lỗi lưu báo cáo");
        }
      } catch (error) {
        console.error("Failed to save report", error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [studyUid, panelState, editorState, selectedPrintTemplateId, syncSavedState, forceStale, waitForPendingSave]
  );

  useEffect(() => {
    registerSaveCallback(() =>
      autosaveStatus === "STALE" ? Promise.resolve(false) : handleSave("DRAFT")
    );
    return () => registerSaveCallback(null);
  }, [registerSaveCallback, handleSave, autosaveStatus]);

  const handleCopyDraft = useCallback(async () => {
    const draft = [
      "KẾT QUẢ:", editorState.findings,
      "", "KẾT LUẬN:", editorState.conclusion,
      "", "KHUYẾN NGHỊ:", editorState.recommendation,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(draft);
      alert("Đã sao chép bản nháp vào clipboard.");
    } catch {
      alert("Không thể sao chép tự động. Vui lòng chọn và sao chép nội dung thủ công.");
    }
  }, [editorState]);

  const handleHisRetry = useCallback(async () => {
    if (!studyUid) return;
    setIsHisSyncing(true);
    try {
      const res = await sendReportToHisAction(studyUid);
      if (res.success) {
        alert("Đã gửi lại kết quả sang HIS thành công!");
      } else {
        alert(res.error || "Lỗi gửi kết quả sang HIS");
      }
      if ("status" in res && res.status) {
        setHisResultStatus(res.status as string);
      }
    } catch (err: any) {
      alert(err?.message || "Lỗi kết nối HIS");
    } finally {
      setIsHisSyncing(false);
    }
  }, [studyUid]);

  const handlePrintTemplateChange = useCallback(
    (id: string) => {
      setSelectedPrintTemplateId(id);
      const tpl = printTemplates.find((t) => t.id === id);
      if (tpl?.htmlContent) setTemplateHtml(tpl.htmlContent);
    },
    [printTemplates]
  );

  const handleIncidentReport = useCallback(() => {
    if (!studyUid) return;
    const reportId =
      panelState.kind === "loaded" ? panelState.data.reportId : null;
    const query = new URLSearchParams({
      module: "REPORTING",
      contextType: reportId ? "REPORT" : "STUDY",
      contextId: reportId || studyUid,
      contextUrl: `/report/${studyUid}`,
    });
    router.push(`/support/incidents/new?${query.toString()}`);
  }, [studyUid, panelState, router]);

  // ─── Derived values ────────────────────────────────────────────────────

  const patientName = formatPatientName(studyContext?.patientName || undefined);
  const patientId = studyContext?.patientId || "-";
  const studyDate = studyContext?.studyDate || "-";
  const studyDesc = studyContext?.studyDescription || "-";

  const printTitle = studyContext?.accessionNumber
    ? `Ket_Qua_CDHA_${studyContext.accessionNumber}_${(studyUid || "").split(".").pop()?.slice(-6) || "ID"}`
    : `Ket_Qua_CDHA_${(studyUid || "").split(".").pop()?.slice(-6) || "ID"}`;

  const printContext: PrintContext = {
    patientName,
    patientId,
    studyDate,
    studyDesc,
    reportContent: editorState.findings,
    conclusion: editorState.conclusion,
    recommendation: editorState.recommendation,
    ...clinicProfile,
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (panelState.kind === "idle") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-vin-muted">
          Chọn một ca chụp để xem/soạn báo cáo
        </p>
      </div>
    );
  }

  if (panelState.kind === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Loader2 className="mb-2 h-5 w-5 animate-spin text-vin-accent" />
        <p className="text-sm text-vin-muted">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (panelState.kind === "error") {
    return (
      <div
        className="flex h-full flex-col items-center justify-center p-6 text-center"
        role="alert"
      >
        <p className="text-sm font-semibold text-red-400">
          {panelState.error === "NOT_FOUND" && "Không tìm thấy báo cáo"}
          {panelState.error === "DENIED" &&
            "Bạn không có quyền xem báo cáo này"}
          {panelState.error === "UNAUTHORIZED" && "Phiên đăng nhập hết hạn"}
          {panelState.error === "UNAVAILABLE" &&
            "Hệ thống tạm thời không thể tải dữ liệu"}
        </p>
      </div>
    );
  }

  // ─── Loaded state ───────────────────────────────────────────────────────

  const { data } = panelState;
  const readOnly = !data.allowedActions.draftReport;
  const reportId = data.reportId;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-vin-panel">
      {/* Panel header */}
      <div className="flex h-12 flex-none items-center justify-between border-b border-vin-border px-4">
        <h2 className="text-sm font-bold text-vin-text2">
          {readOnly ? "Báo cáo (Chỉ đọc)" : "Soạn báo cáo"}
        </h2>
        {data.reportStatus && (
          <span className="rounded-full bg-vin-sidebar px-2 py-0.5 text-sm font-semibold text-vin-text2">
            {data.reportStatus}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
          {/* Editor section */}
          <ReportEditorSectionAntd
            state={editorState}
            onChange={handleEditorChange}
            readOnly={readOnly}
            templates={reportTemplates}
            isSaving={isSaving}
          />

          {/* Actions bar */}
          <ReportActionsBarAntd
            studyUid={studyUid!}
            reportId={reportId}
            allowedActions={data.allowedActions}
            studyStatus={studyStatus}
            hisResultStatus={hisResultStatus}
            isSaving={isSaving}
            autosaveStatus={autosaveStatus}
            autosaveError={autosaveError}
            onCopyDraft={autosaveStatus === "STALE" ? handleCopyDraft : undefined}
            onSave={handleSave}
            onHisRetry={handleHisRetry}
            isHisSyncing={isHisSyncing}
            onShareOpen={
              data.allowedActions.share
                ? () => setShareDialogOpen(true)
                : undefined
            }
            onConsultOpen={
              data.allowedActions.createConsultation
                ? () => setConsultDialogOpen(true)
                : undefined
            }
            onIncidentReport={handleIncidentReport}
            printTemplates={printTemplates}
            selectedPrintTemplateId={selectedPrintTemplateId}
            onPrintTemplateChange={handlePrintTemplateChange}
            templateHtml={templateHtml}
            printContext={printContext}
            printTitle={printTitle}
          />
        </div>
      </div>

      {/* Dialogs */}
      {reportId && (
        <>
          <ShareDialog
            isOpen={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            scope="REPORT"
            resourceId={reportId}
          />
          <ConsultationDialog
            isOpen={consultDialogOpen}
            onClose={() => setConsultDialogOpen(false)}
            sourceType="REPORT"
            studyInstanceUid={studyUid!}
            reportId={reportId}
          />
        </>
      )}
    </div>
  );
}
