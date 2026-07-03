"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, Loader2, Printer, Save } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import TiptapEditor from "./components/TiptapEditor";
import { PrintTemplateViewer } from "./components/PrintTemplateViewer";
import { getDefaultTemplate, getReport, getStudyDetails, getPrintTemplatesAction } from "./actions";
import { saveReportAction } from "../../actions";
import { logArchivePrintAction } from "@/app/archive/actions";
import {
  appendTemplateHtml,
  appendTemplateText,
  normalizeTemplateHtml,
  ReportTemplateOption,
  ReportTemplatePicker,
  TemplateApplyMode,
} from "@/app/components/ReportTemplatePicker";
import { getClinicProfile } from "@/app/settings/clinic-profile/actions";
import { getReportTemplateSuggestions } from "@/app/settings/report-templates/actions";

const formatPatientName = (name?: string) => (name ? name.replace(/\^/g, " ") : "Unknown Patient");

const getDoctorPrintInfo = (report: any) => {
  const doctor = report?.doctor;
  const profile = doctor?.doctorProfile;
  if (!doctor) return {};

  return {
    doctorName: doctor.fullName,
    doctorTitle: profile?.title || "",
    doctorSpecialty: profile?.specialty || "",
    doctorLicenseNumber: profile?.licenseNumber || "",
    doctorSignatureImagePath: profile?.signatureImagePath || "",
  };
};

const formatDicomDateTime = (date?: string, time?: string) => {
  if (!date) return "-";
  const dateValue = date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1");
  const timeValue = time ? time.substring(0, 4).replace(/(\d{2})(\d{2})/, "$1:$2") : "";
  return timeValue ? `${dateValue} ${timeValue}` : dateValue;
};

const risStatusLabels: Record<string, string> = {
  ORDERED: "Chờ chụp",
  READY_FOR_SCAN: "Sẵn sàng chụp",
  IN_PROGRESS: "Đang chụp",
  RECEIVED: "Đã nhận ảnh",
  STABLE: "Ảnh ổn định",
  NEEDS_QC: "Cần QC",
  QC_REJECTED: "Chụp lại",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  REPORTED: "Đã có báo cáo",
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ARCHIVED: "Lưu trữ",
  DELETED_FROM_PACS: "Đã xóa ảnh",
  ERROR: "Lỗi",
};

function RisStatusBadge({ status }: { status?: string }) {
  const value = status || "READY_TO_READ";
  const label = risStatusLabels[value] || value;
  const classes =
    value === "FINALIZED" || value === "DELIVERED"
      ? "bg-vin-status-approved-bg text-white"
      : value === "READING" || value === "REPORTED"
        ? "bg-vin-status-warning-bg text-white"
        : value === "QC_REJECTED" || value === "ERROR"
          ? "bg-vin-status-danger-bg text-white"
          : value === "READY_TO_READ" || value === "RECEIVED" || value === "STABLE"
            ? "bg-vin-accentSoft text-white"
            : "bg-vin-status-new-bg text-white";

  return <span className={`inline-flex max-w-[120px] justify-center truncate rounded px-2 py-0.5 text-[10px] font-bold ${classes}`}>{label}</span>;
}

export default function ReportPage({ params }: { params: { studyInstanceUid: string } }) {
  const { studyInstanceUid } = params;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [studyStatus, setStudyStatus] = useState<string>("READY_TO_READ");
  const [doctorPrintInfo, setDoctorPrintInfo] = useState<Record<string, string>>({});
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [clinicProfile, setClinicProfile] = useState<Record<string, string>>({});
  const [reportTemplates, setReportTemplates] = useState<ReportTemplateOption[]>([]);
  const [printTemplates, setPrintTemplates] = useState<{ id: string; name: string; isDefault: boolean; htmlContent: string }[]>([]);
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState<string>("");
  const [viewerLink, setViewerLink] = useState("");

  useEffect(() => {
    setViewerLink(`/viewer/minipacs?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUid)}`);
  }, [studyInstanceUid]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setReportTemplates([]);
        const [report, studyInfo, template, clinic, printTpls] = await Promise.all([
          getReport(studyInstanceUid),
          getStudyDetails(studyInstanceUid),
          getDefaultTemplate(),
          getClinicProfile(),
          getPrintTemplatesAction(),
        ]);

        setClinicProfile({
          clinicName: clinic?.name || "",
          clinicLegalName: clinic?.legalName || "",
          clinicAddress: clinic?.address || "",
          clinicPhone: clinic?.phone || "",
          clinicEmail: clinic?.email || "",
          clinicWebsite: clinic?.website || "",
          clinicLogoPath: clinic?.logoPath || "",
          clinicHeaderText: clinic?.headerText || "",
          clinicFooterText: clinic?.footerText || "",
          clinicLicenseNumber: clinic?.licenseNumber || "",
        });

        if (report) {
          setFindings(report.findings || "");
          setConclusion(report.conclusion || "");
          setRecommendation(report.recommendation || "");
          if (report.imagingStudy?.status) setStudyStatus(report.imagingStudy.status);
          setDoctorPrintInfo(getDoctorPrintInfo(report));
          if (report.printTemplateId) {
            setSelectedPrintTemplateId(report.printTemplateId);
          }
        }

        if (studyInfo) {
          setPatientDetails(studyInfo);
          if (studyInfo.WorkflowStatus) setStudyStatus(studyInfo.WorkflowStatus);
        }
        if (printTpls) {
          setPrintTemplates(printTpls);
          let targetTplId = report?.printTemplateId;
          
          if (!targetTplId) {
            const defaultTpl = printTpls.find(t => t.isDefault) || printTpls[0];
            if (defaultTpl) {
              targetTplId = defaultTpl.id;
              setSelectedPrintTemplateId(targetTplId);
            }
          }
          
          if (targetTplId) {
            const matchedTpl = printTpls.find(t => t.id === targetTplId);
            if (matchedTpl?.htmlContent) {
              setTemplateHtml(matchedTpl.htmlContent);
            } else if (template) {
              setTemplateHtml(template);
            }
          } else if (template) {
            setTemplateHtml(template);
          }
        } else if (template) {
          setTemplateHtml(template);
        }

        const cannedTemplates = await getReportTemplateSuggestions({
          modality: studyInfo?.EnrichedModality || studyInfo?.MainDicomTags?.Modality,
          bodyPart: studyInfo?.MainDicomTags?.BodyPartExamined,
        });
        setReportTemplates(cannedTemplates || []);
      } catch (error) {
        console.error("Failed to load report data", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [studyInstanceUid]);

  const printTitle = patientDetails 
    ? `Ket_Qua_CDHA_${patientDetails.MainDicomTags?.AccessionNumber || "NA"}_${(studyInstanceUid || "").split('.').pop()?.slice(-6) || "ID"}`
    : `Ket_Qua_CDHA_${(studyInstanceUid || "").split('.').pop()?.slice(-6) || "ID"}`;

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
    onAfterPrint: () => {
      logArchivePrintAction(studyInstanceUid, "PRINT").catch(console.error);
    }
  });

  const handleSave = async (status: "DRAFT" | "FINAL") => {
    setIsSaving(true);
    try {
      const result = await saveReportAction({
        studyInstanceUid,
        status,
        findings,
        conclusion,
        recommendation,
        printTemplateId: selectedPrintTemplateId || undefined,
      });

      if (result.success) {
        const returnedReportStatus = (result as any).report?.status;
        setStudyStatus(returnedReportStatus === "FINAL" ? "FINALIZED" : "READING");
        if ((result as any).report) setDoctorPrintInfo(getDoctorPrintInfo((result as any).report));
      }
    } catch (error) {
      console.error("Failed to save report", error);
    } finally {
      setIsSaving(false);
    }
  };

  const applyReportTemplate = (template: ReportTemplateOption, mode: TemplateApplyMode) => {
    if (mode === "replace") {
      setFindings(normalizeTemplateHtml(template.findings));
      setConclusion(template.conclusion || "");
      setRecommendation(template.recommendation || "");
      return;
    }

    setFindings(current => appendTemplateHtml(current, template.findings));
    setConclusion(current => appendTemplateText(current, template.conclusion));
    setRecommendation(current => appendTemplateText(current, template.recommendation));
  };

  const applyReportTemplateShortcut = (template: ReportTemplateOption) => {
    setConclusion(current => appendTemplateText(current, template.conclusion));
    setRecommendation(current => appendTemplateText(current, template.recommendation));
  };

  const patientTags = patientDetails?.PatientMainDicomTags || {};
  const studyTags = patientDetails?.MainDicomTags || {};
  const patientName = formatPatientName(patientTags.PatientName);
  const patientId = patientTags.PatientID || "-";
  const studyDate = formatDicomDateTime(studyTags.StudyDate, studyTags.StudyTime);
  const studyDesc = studyTags.StudyDescription || "-";

  return (
    <div className="min-h-screen bg-vin-root text-vin-text">
      <header className="border-b border-vin-border bg-vin-sidebar px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-lg border border-vin-border bg-vin-panel px-3 py-1.5 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-white">Phiếu kết quả chẩn đoán hình ảnh</h1>
            <p className="mt-0.5 truncate font-mono text-[11px] text-vin-muted">{studyInstanceUid}</p>
          </div>

          <div className="flex items-center gap-2">
            {viewerLink && (
              <a
                href={viewerLink}
                target="_blank"
                className="rounded-lg border border-vin-border bg-vin-panel px-3 py-1.5 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
              >
                Mở OHIF
              </a>
            )}
            <RisStatusBadge status={studyStatus} />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex h-[calc(100vh-65px)] flex-col items-center justify-center text-vin-muted">
          <Loader2 className="mb-2 h-6 w-6 animate-spin text-vin-accent" />
          Đang tải báo cáo...
        </div>
      ) : (
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 p-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <div className="rounded-xl border border-vin-border bg-vin-panel2 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold uppercase text-white">{patientName}</h2>
                  <p className="mt-1 text-xs text-vin-muted">PID: {patientId}</p>
                </div>
                <RisStatusBadge status={studyStatus} />
              </div>
              <div className="grid grid-cols-1 gap-3 text-xs text-vin-text2 sm:grid-cols-2">
                <div>
                  <span className="text-vin-muted">Ngày chụp:</span> {studyDate}
                </div>
                <div>
                  <span className="text-vin-muted">Mô tả:</span> {studyDesc}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-vin-text2">Mô tả (Findings)</label>
              <ReportTemplatePicker
                disabled={isSaving}
                templates={reportTemplates}
                onApply={applyReportTemplate}
              />
              <TiptapEditor
                value={findings}
                onChange={setFindings}
                shortcutTemplates={reportTemplates}
                onShortcutApply={applyReportTemplateShortcut}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-vin-text2">Kết luận (Conclusion)</label>
              <textarea
                value={conclusion}
                onChange={event => setConclusion(event.target.value)}
                className="h-28 w-full resize-none rounded-xl border border-vin-border bg-vin-shell p-3 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent"
                placeholder="Nhập kết luận..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-vin-text2">Đề nghị (Recommendation)</label>
              <textarea
                value={recommendation}
                onChange={event => setRecommendation(event.target.value)}
                className="h-24 w-full resize-none rounded-xl border border-vin-border bg-vin-shell p-3 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent"
                placeholder="Nhập đề nghị..."
              />
            </div>
          </section>

          <aside className="h-fit rounded-xl border border-vin-border bg-vin-panel p-4">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-vin-text2">Tác vụ</h3>
            <div className="space-y-2">
              <div className="mb-4">
                <label className="mb-1 block text-xs font-semibold text-vin-text2">Mẫu in</label>
                <select
                  value={selectedPrintTemplateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedPrintTemplateId(id);
                    const tpl = printTemplates.find(t => t.id === id);
                    if (tpl?.htmlContent) setTemplateHtml(tpl.htmlContent);
                  }}
                  className="w-full rounded-md border border-vin-border bg-vin-shell px-2 py-1.5 text-xs text-vin-text outline-none transition focus:border-vin-accent"
                >
                  {printTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  {printTemplates.length === 0 && <option value="">Mặc định (System)</option>}
                </select>
              </div>
              <button
                onClick={() => handlePrint()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
              >
                <Printer className="h-4 w-4" />
                In phiếu
              </button>
              <button
                onClick={() => handleSave("DRAFT")}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                Lưu nháp
              </button>
              <button
                onClick={() => handleSave("FINAL")}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Hoàn tất
              </button>
            </div>
          </aside>
        </main>
      )}

      <PrintTemplateViewer
        ref={printRef}
        templateHtml={templateHtml}
        context={{
          patientName,
          patientId,
          studyDate,
          studyDesc,
          reportContent: findings,
          conclusion,
          recommendation,
          ...clinicProfile,
          ...doctorPrintInfo,
        }}
      />
    </div>
  );
}
