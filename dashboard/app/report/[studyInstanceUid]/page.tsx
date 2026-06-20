"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, Loader2, Printer, Save } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import TiptapEditor from "./components/TiptapEditor";
import { PrintTemplateViewer } from "./components/PrintTemplateViewer";
import { getDefaultTemplate, getReport, getStudyDetails, upsertReport } from "./actions";

const formatPatientName = (name?: string) => (name ? name.replace(/\^/g, " ") : "Unknown Patient");

const formatDicomDateTime = (date?: string, time?: string) => {
  if (!date) return "-";
  const dateValue = date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1");
  const timeValue = time ? time.substring(0, 4).replace(/(\d{2})(\d{2})/, "$1:$2") : "";
  return timeValue ? `${dateValue} ${timeValue}` : dateValue;
};

function StatusBadge({ status }: { status?: string }) {
  if (status === "COMPLETED" || status === "FINAL") {
    return <span className="rounded bg-vin-status-approved-bg px-2 py-0.5 text-[10px] font-bold text-white">ĐÃ DUYỆT</span>;
  }

  if (status === "DRAFTING" || status === "DRAFT") {
    return <span className="rounded bg-vin-status-warning-bg px-2 py-0.5 text-[10px] font-bold text-white">ĐANG SOẠN</span>;
  }

  return <span className="rounded bg-vin-status-new-bg px-2 py-0.5 text-[10px] font-bold text-white">MỚI</span>;
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
  const [reportStatus, setReportStatus] = useState<string>("UNREAD");
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [viewerLink, setViewerLink] = useState("");

  useEffect(() => {
    const currentHost = window.location.hostname;
    setViewerLink(`http://${currentHost}:3000/viewer/${encodeURIComponent(studyInstanceUid)}`);
  }, [studyInstanceUid]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [report, studyInfo, template] = await Promise.all([
          getReport(studyInstanceUid),
          getStudyDetails(studyInstanceUid),
          getDefaultTemplate(),
        ]);

        if (report) {
          setFindings(report.findings || "");
          setConclusion(report.conclusion || "");
          setRecommendation(report.recommendation || "");
          setReportStatus(report.status);
        }

        if (studyInfo) setPatientDetails(studyInfo);
        if (template) setTemplateHtml(template);
      } catch (error) {
        console.error("Failed to load report data", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [studyInstanceUid]);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ket_Qua_CDHA_${studyInstanceUid}`,
  });

  const handleSave = async (status: "DRAFTING" | "COMPLETED") => {
    setIsSaving(true);
    try {
      const result = await upsertReport(studyInstanceUid, {
        status,
        findings,
        conclusion,
        recommendation,
      });

      if (result.success) setReportStatus(status);
    } catch (error) {
      console.error("Failed to save report", error);
    } finally {
      setIsSaving(false);
    }
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
            <StatusBadge status={reportStatus} />
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
                <StatusBadge status={reportStatus} />
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
              <TiptapEditor value={findings} onChange={setFindings} />
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
              <button
                onClick={() => handlePrint()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
              >
                <Printer className="h-4 w-4" />
                In phiếu
              </button>
              <button
                onClick={() => handleSave("DRAFTING")}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-border bg-vin-shell px-4 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                Lưu nháp
              </button>
              <button
                onClick={() => handleSave("COMPLETED")}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
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
        }}
      />
    </div>
  );
}
