"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Loader2,
  Printer,
  Save,
  Search,
  X,
} from "lucide-react";
import { CustomSelect, type SelectOption } from "./components/CustomSelect";
import { useReactToPrint } from "react-to-print";
import { AppSidebar } from "./components/AppSidebar";
import {
  appendTemplateHtml,
  appendTemplateText,
  normalizeTemplateHtml,
  ReportTemplateOption,
  ReportTemplatePicker,
  TemplateApplyMode,
} from "./components/ReportTemplatePicker";
import {
  getStudies,
  saveReportAction,
  updateClinicalInfoAction,
  markStudyDeliveredAction,
  assignStudyDoctorAction,
  startReadingStudyAction,
  getUserPermissionsAction,
  getActiveDoctorsAction
} from "./actions";
import { logArchivePrintAction } from "./archive/actions";
import { StudyRowActionMenu } from "./components/StudyRowActionMenu";
import { ClinicalInfoModal } from "./components/ClinicalInfoModal";
import AssignDoctorModal from "./components/AssignDoctorModal";
import { ShareDialog } from "@/components/share/ShareDialog";
import { ConsultationDialog } from "@/components/consultation/ConsultationDialog";

import {
  getDefaultTemplate,
  getReport,
  getStudyDetails,
  saveReportDraft,
  finalizeReport,
  cancelReportDraft,
  unfinalizeReport
} from "./report/[studyInstanceUid]/actions";
import { getClinicProfile } from "./settings/clinic-profile/actions";
import { getReportTemplateSuggestions } from "./settings/report-templates/actions";
import TiptapEditor from "./report/[studyInstanceUid]/components/TiptapEditor";
import { PrintTemplateViewer } from "./report/[studyInstanceUid]/components/PrintTemplateViewer";

const fmtName = (name?: string) => (name ? name.replace(/\^/g, " ") : "Unknown Patient");
const fmtText = (value?: string) => value || "-";
const fmtSex = (sex?: string) => (sex === "M" ? "Nam" : sex === "F" ? "Nữ" : sex || "?");
const fmtAge = (age?: string) => (age ? age.replace(/\D/g, "") : "?");

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

const fmtDateTime = (date?: string, time?: string) => {
  if (!date) return "-";
  const dateValue = date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1");
  const timeValue = time ? time.substring(0, 4).replace(/(\d{2})(\d{2})/, "$1:$2") : "";
  return timeValue ? `${dateValue} ${timeValue}` : dateValue;
};

const fmtDateTimeIso = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtDuration = (minutes?: number | null) => {
  if (minutes === null || minutes === undefined) return "-";
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}p` : `${hours}h`;
};

const hisStatusLabel = (status?: string | null) => {
  if (!status) return "-";
  if (status === "SYNCED" || status === "SENT") return "Da dong bo";
  if (status === "FAILED") return "Loi";
  if (status === "PENDING") return "Dang cho";
  if (status === "DISABLED") return "Tat HIS";
  if (status === "SKIPPED") return "Bo qua";
  return status;
};

function MiniInfo({ label, mono, value }: { label: string; mono?: boolean; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-wide text-vin-muted">{label}</div>
      <div className={`mt-0.5 truncate text-[11px] text-vin-text2 ${mono ? "font-mono" : ""}`}>{value || "-"}</div>
    </div>
  );
}

const modalityClasses: Record<string, string> = {
  CT: "border-vin-accent/40 bg-vin-accentSoft/15 text-cyan-100",
  MR: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  CR: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  DX: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  US: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

function ModBadge({ value, isNonDicom }: { value?: string; isNonDicom?: boolean }) {
  if (isNonDicom) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-bold leading-none tracking-widest text-indigo-100 shadow-[0_0_8px_rgba(99,102,241,0.15)]">
          {value || "NON"}
        </span>
        <span className="text-[9px] font-semibold text-indigo-300">Non-DICOM</span>
      </div>
    );
  }

  const label = value || "?";
  const classes = modalityClasses[label] || "border-white/10 bg-white/5 text-vin-muted";

  return (
    <span className={`inline-flex min-w-9 items-center justify-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold leading-none ${classes}`}>
      {label}
    </span>
  );
}

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
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
      : value === "READING" || value === "REPORTED"
        ? "border-amber-400/35 bg-amber-500/15 text-amber-100"
        : value === "QC_REJECTED" || value === "ERROR"
          ? "border-red-400/35 bg-red-500/15 text-red-100"
          : value === "READY_TO_READ" || value === "RECEIVED" || value === "STABLE"
            ? "border-cyan-400/35 bg-cyan-500/15 text-cyan-100"
            : "border-white/10 bg-white/5 text-vin-text2";

  return <span className={`inline-flex max-w-[118px] items-center justify-center truncate rounded-full border px-2.5 py-1 text-[9px] font-bold leading-none ${classes}`}>{label}</span>;
}

export default function DashboardPage() {
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [clinicalModalOpen, setClinicalModalOpen] = useState(false);
  const [clinicalModalMode, setClinicalModalMode] = useState<"CLINICAL_INFO" | "INDICATION">("CLINICAL_INFO");

  const [assignDoctorModalOpen, setAssignDoctorModalOpen] = useState(false);
  const [activeDoctors, setActiveDoctors] = useState<{value: string, label: string}[]>([]);

  const [activeStudy, setActiveStudy] = useState<any>(null);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [consultDialogOpen, setConsultDialogOpen] = useState(false);
  const [actionResourceId, setActionResourceId] = useState("");
  const [actionResourceType, setActionResourceType] = useState<'DICOM' | 'NON_DICOM'>('DICOM');

  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>("GUEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState("ALL");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState("ALL");
  const [stationAeFilter, setStationAeFilter] = useState("ALL");
  const [assignedDoctorFilter, setAssignedDoctorFilter] = useState("ALL");
  const [hisStatusFilter, setHisStatusFilter] = useState("ALL");
  const [datePresetFilter, setDatePresetFilter] = useState("ALL");

  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [studyStatus, setStudyStatus] = useState("READY_TO_READ");
  const [doctorPrintInfo, setDoctorPrintInfo] = useState<Record<string, string>>({});
  const [templateHtml, setTemplateHtml] = useState("");
  const [clinicProfile, setClinicProfile] = useState<Record<string, string>>({});
  const [reportTemplates, setReportTemplates] = useState<ReportTemplateOption[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openClinicalModal = (study: any, mode: "CLINICAL_INFO" | "INDICATION") => {
    setActiveStudy(study);
    setClinicalModalMode(mode);
    setClinicalModalOpen(true);
  };

  const handleMarkDelivered = async (uid: string) => {
    if (confirm("Ghi nhận đã trả kết quả cho ca này?")) {
      const res = await markStudyDeliveredAction(uid);
      if (res.success) {
         setStudies(cur => cur.map(s => s.MainDicomTags?.StudyInstanceUID === uid ? { ...s, WorkflowStatus: "DELIVERED" } : s));
         if (uid === selectedStudy?.MainDicomTags?.StudyInstanceUID) setStudyStatus("DELIVERED");
      } else alert((res as any).error || "Lỗi hệ thống");
    }
  };

  const handleClinicalSave = async (data: any) => {
    const uid = activeStudy?.MainDicomTags?.StudyInstanceUID;
    if (!uid) return { success: false, error: "No active study" };
    const result = await updateClinicalInfoAction(uid, data);
    if (result.success) {
      setStudies(cur => cur.map(s => s.MainDicomTags?.StudyInstanceUID === uid ? { ...s, ...data } : s));
      if (selectedStudy?.MainDicomTags?.StudyInstanceUID === uid) {
        setSelectedStudy((cur: any) => ({ ...cur, ...data }));
      }
      setPatientDetails((cur: any) => (cur ? { ...cur, ...data } : cur));
    }
    return result;
  };



  useEffect(() => {
    async function loadStudies() {
      try {
        setIsLoading(true);
        const [data, clinic, perms] = await Promise.all([
          getStudies(),
          getClinicProfile(),
          getUserPermissionsAction()
        ]);
        setPermissions(perms.permissions);
        setUserRole(perms.role);
        setStudies(data || []);

        if (perms.permissions.includes("studies.assign")) {
          try {
            const docs = await getActiveDoctorsAction();
            setActiveDoctors(docs || []);
          } catch (err) {
            console.error("Failed to fetch doctors", err);
            setActiveDoctors([]);
          }
        } else {
          setActiveDoctors([]);
        }
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
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudies();
  }, []);

  useEffect(() => {
    document.title = "Mini PACS - Danh sách ca chụp";
  }, []);

  const modalities = useMemo(() => {
    const values = new Set<string>();
    studies.forEach(study => {
      if (study.EnrichedModality) values.add(study.EnrichedModality);
    });
    return Array.from(values).sort();
  }, [studies]);

  const modalitySelectOptions = useMemo<SelectOption[]>(() => [
    { value: "ALL", label: "Tất cả" },
    ...modalities.map(m => ({ value: m, label: m })),
  ], [modalities]);

  const stationAEs = useMemo(() => {
    const values = new Set<string>();
    studies.forEach(study => {
      const station = study.stationAeTitle || study.machineName || study.MainDicomTags?.StationName || study.MainDicomTags?.InstitutionName;
      if (station) values.add(station);
    });
    return Array.from(values).sort();
  }, [studies]);

  const stationAeSelectOptions = useMemo<SelectOption[]>(() => [
    { value: "ALL", label: "Tất cả máy chụp" },
    ...stationAEs.map(ae => ({ value: ae, label: ae })),
  ], [stationAEs]);

  const assignedDoctorSelectOptions = useMemo<SelectOption[]>(() => {
    const doctorMap = new Map<string, string>();
    studies.forEach(study => {
      if (study.AssignedDoctorId) {
        doctorMap.set(study.AssignedDoctorId, study.AssignedDoctorName || study.AssignedDoctorId);
      }
    });
    activeDoctors.forEach(doctor => {
      if (!doctorMap.has(doctor.value)) doctorMap.set(doctor.value, doctor.label);
    });
    return [
      { value: "ALL", label: "Tat ca bac si" },
      { value: "UNASSIGNED", label: "Chua gan bac si" },
      ...Array.from(doctorMap.entries())
        .sort((a, b) => a[1].localeCompare(b[1], "vi"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [activeDoctors, studies]);

  const hisStatusSelectOptions = useMemo<SelectOption[]>(() => [
    { value: "ALL", label: "Tat ca HIS" },
    { value: "FAILED", label: "HIS loi" },
    { value: "PENDING", label: "HIS dang cho" },
    { value: "SYNCED", label: "HIS da dong bo" },
    { value: "SENT", label: "HIS da gui" },
    { value: "EMPTY", label: "Chua co HIS" },
  ], []);

  const workflowStatusSelectOptions = useMemo<SelectOption[]>(() => [
    { value: "ALL", label: "Tất cả trạng thái" },
    ...Object.entries(risStatusLabels).map(([key, label]) => ({ value: key, label })),
  ], []);

  const datePresetSelectOptions: SelectOption[] = useMemo(() => [
    { value: "ALL", label: "Tất cả thời gian" },
    { value: "TODAY", label: "Hôm nay" },
    { value: "YESTERDAY", label: "Hôm qua" },
    { value: "3DAYS", label: "3 ngày gần đây" },
    { value: "7DAYS", label: "7 ngày gần đây" },
  ], []);

  const filteredStudies = useMemo(() => {
    let list = studies;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(study => {
        const patient = study.PatientMainDicomTags || {};
        const main = study.MainDicomTags || {};
        return `${patient.PatientName || ""} ${patient.PatientID || ""} ${main.AccessionNumber || ""} ${main.StudyDescription || ""} ${study.AssignedDoctorName || ""} ${study.ReportDoctorName || ""} ${study.procedureName || ""} ${study.procedureCode || ""} ${study.machineName || ""}`
          .toLowerCase()
          .includes(query);
      });
    }

    if (modalityFilter !== "ALL") {
      list = list.filter(study => study.EnrichedModality === modalityFilter);
    }

    if (workflowStatusFilter !== "ALL") {
      list = list.filter(study => (study.WorkflowStatus || "READY_TO_READ") === workflowStatusFilter);
    }

    if (stationAeFilter !== "ALL") {
      list = list.filter(study => {
        const station = study.stationAeTitle || study.machineName || study.MainDicomTags?.StationName || study.MainDicomTags?.InstitutionName;
        return station === stationAeFilter;
      });
    }

    if (assignedDoctorFilter === "UNASSIGNED") {
      list = list.filter(study => !study.AssignedDoctorId);
    } else if (assignedDoctorFilter !== "ALL") {
      list = list.filter(study => study.AssignedDoctorId === assignedDoctorFilter);
    }

    if (hisStatusFilter === "EMPTY") {
      list = list.filter(study => !study.hisSyncStatus && !study.hisResultStatus);
    } else if (hisStatusFilter !== "ALL") {
      list = list.filter(study => study.hisSyncStatus === hisStatusFilter || study.hisResultStatus === hisStatusFilter);
    }

    if (datePresetFilter !== "ALL") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      list = list.filter(study => {
        const dateStr = study.MainDicomTags?.StudyDate; // "YYYYMMDD"
        if (!dateStr || dateStr.length !== 8) return false;
        
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1;
        const day = parseInt(dateStr.substring(6, 8), 10);
        const studyDate = new Date(year, month, day);

        const diffTime = now.getTime() - studyDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (datePresetFilter === "TODAY") return diffDays <= 0 && diffDays > -1;
        if (datePresetFilter === "YESTERDAY") return diffDays > 0 && diffDays <= 1;
        if (datePresetFilter === "3DAYS") return diffDays >= 0 && diffDays <= 3;
        if (datePresetFilter === "7DAYS") return diffDays >= 0 && diffDays <= 7;
        return true;
      });
    }

    return list;
  }, [assignedDoctorFilter, datePresetFilter, hisStatusFilter, modalityFilter, searchQuery, stationAeFilter, studies, workflowStatusFilter]);

  const totalPages = Math.ceil(filteredStudies.length / rowsPerPage) || 1;
  const pageStudies = filteredStudies.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const patientHistory = useMemo(() => {
    if (!selectedStudy) return [];
    const patientId = selectedStudy.PatientMainDicomTags?.PatientID;
    if (!patientId) return [];
    return studies.filter(study => study.PatientMainDicomTags?.PatientID === patientId);
  }, [selectedStudy, studies]);

  const handleSelect = async (study: any) => {
    setSelectedStudy(study);
    const uid = study.MainDicomTags?.StudyInstanceUID;
    if (!uid) return;

    try {
      setIsReportLoading(true);
      setFindings("");
      setConclusion("");
      setRecommendation("");
      setStudyStatus(study.WorkflowStatus || "READY_TO_READ");
      setDoctorPrintInfo({});
      setReportTemplates([]);

      const [report, details, template] = await Promise.all([
        getReport(uid),
        getStudyDetails(uid),
        getDefaultTemplate(),
      ]);

      if (report) {
        setFindings(report.findings || "");
        setConclusion(report.conclusion || "");
        setRecommendation(report.recommendation || "");
        if (report.imagingStudy?.status) setStudyStatus(report.imagingStudy.status);
        setDoctorPrintInfo(getDoctorPrintInfo(report));
      }

      if (details) {
        setPatientDetails(details);
        if (details.WorkflowStatus) setStudyStatus(details.WorkflowStatus);
      }
      if (template) setTemplateHtml(template);

      const cannedTemplates = await getReportTemplateSuggestions({
        modality: study.EnrichedModality || study.MainDicomTags?.Modality,
        bodyPart: study.MainDicomTags?.BodyPartExamined,
      });
      setReportTemplates(cannedTemplates || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsReportLoading(false);
    }
  };

  const openViewer = (study: any) => {
    if (study.isNonDicom && study.nonDicomExamId) {
      window.open(`/non-dicom/${study.nonDicomExamId}`, "_blank");
      return;
    }
    const uid = study.MainDicomTags?.StudyInstanceUID;
    if (!uid) return;
    window.open(`/viewer/minipacs?StudyInstanceUIDs=${encodeURIComponent(uid)}`, "_blank");
  };



  const handleStartReading = async (uid: string) => {
    const res = await startReadingStudyAction(uid);
    if (res.success) {
      setStudies(cur => cur.map(s => s.MainDicomTags?.StudyInstanceUID === uid ? { ...s, WorkflowStatus: "READING" } : s));
      if (uid === selectedStudy?.MainDicomTags?.StudyInstanceUID) setStudyStatus("READING");
    } else {
      alert((res as any).error || "Lỗi khi nhận đọc");
    }
  };

  const handleAssignDoctor = async (doctorId: string) => {
    const uid = activeStudy?.MainDicomTags?.StudyInstanceUID;
    if (!uid) return false;
    const res = await assignStudyDoctorAction(uid, doctorId);
    if (res.success) {
      const selectedDoctor = activeDoctors.find(doctor => doctor.value === doctorId);
      const assignedDoctorName = selectedDoctor?.label?.replace(/\s*\([^)]*\)\s*$/, "") || selectedDoctor?.label || doctorId;
      setStudies(current =>
        current.map(study =>
          study.MainDicomTags?.StudyInstanceUID === uid
            ? { ...study, AssignedDoctorId: doctorId, AssignedDoctorName: assignedDoctorName }
            : study
        )
      );
      if (selectedStudy?.MainDicomTags?.StudyInstanceUID === uid) {
        setSelectedStudy((current: any) => ({
          ...current,
          AssignedDoctorId: doctorId,
          AssignedDoctorName: assignedDoctorName,
        }));
      }
      setActiveStudy((current: any) =>
        current?.MainDicomTags?.StudyInstanceUID === uid
          ? { ...current, AssignedDoctorId: doctorId, AssignedDoctorName: assignedDoctorName }
          : current
      );
      return true;
    } else {
      alert((res as any).error || "Lỗi khi gán");
      return false;
    }
  };

  const openAssignModal = (study: any) => {
    setActiveStudy(study);
    setAssignDoctorModalOpen(true);
  };

  const handleCancelDraft = async (uid: string) => {
    if (confirm("Bạn có chắc chắn muốn hủy phiên bản nháp này?")) {
      const reason = prompt("Lý do hủy (tùy chọn):") || "Hủy nháp";
      const res = await cancelReportDraft(uid, reason);
      if (res.success) {
        setStudies(current =>
          current.map(study => (
            study.MainDicomTags?.StudyInstanceUID === uid
              ? { ...study, ReportStatus: "CANCELLED", WorkflowStatus: "READY_TO_READ" }
              : study
          ))
        );
        if (selectedStudy?.MainDicomTags?.StudyInstanceUID === uid) {
          setStudyStatus("READY_TO_READ");
          setSelectedStudy((cur: any) => ({ ...cur, WorkflowStatus: "READY_TO_READ", ReportStatus: "CANCELLED" }));
        }
      } else {
        alert((res as any).error || "Lỗi hủy nháp");
      }
    }
  };

  const handleUnfinalize = async (uid: string) => {
    const reason = prompt("Lý do hủy duyệt (bắt buộc):");
    if (!reason) return;
    const res = await unfinalizeReport(uid, reason);
    if (res.success) {
      setStudies(current =>
        current.map(study => (
          study.MainDicomTags?.StudyInstanceUID === uid
            ? { ...study, ReportStatus: "DRAFT", WorkflowStatus: "READING" }
            : study
        ))
      );
      if (selectedStudy?.MainDicomTags?.StudyInstanceUID === uid) {
        setStudyStatus("READING");
        setSelectedStudy((cur: any) => ({ ...cur, WorkflowStatus: "READING", ReportStatus: "DRAFT" }));
      }
    } else {
      alert((res as any).error || "Lỗi hủy duyệt");
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

  const handleSave = async (status: "DRAFT" | "FINAL") => {
    const uid = selectedStudy?.MainDicomTags?.StudyInstanceUID;
    if (!uid) return;

    setIsSaving(true);
    try {
      const draftResult = await saveReportDraft(uid, { findings, conclusion, recommendation });
      if (!draftResult.success) {
        alert((draftResult as any).error || "Lỗi lưu nháp báo cáo");
        setIsSaving(false);
        return;
      }

      let nextStudyStatus = "READING";
      let nextReportStatus = "DRAFT";
      let nextHisResultStatus: string | undefined = undefined;

      if (status === "FINAL") {
        const finalResult = await finalizeReport(uid);
        if (!finalResult.success) {
          alert((finalResult as any).error || "Lỗi ký duyệt báo cáo");
          setIsSaving(false);
          return;
        }
        nextStudyStatus = finalResult.workflowStatus || "FINALIZED";
        nextReportStatus = finalResult.reportStatus || "FINAL";
        nextHisResultStatus = finalResult.hisResultStatus;
      }

      setStudyStatus(nextStudyStatus);
      
      setStudies(current =>
        current.map(study => (
          study.MainDicomTags?.StudyInstanceUID === uid
            ? { ...study, WorkflowStatus: nextStudyStatus, ReportStatus: nextReportStatus, hisResultStatus: nextHisResultStatus || study.hisResultStatus }
            : study
        ))
      );
      setSelectedStudy((current: any) =>
        current?.MainDicomTags?.StudyInstanceUID === uid
          ? { ...current, WorkflowStatus: nextStudyStatus, ReportStatus: nextReportStatus, hisResultStatus: nextHisResultStatus || current.hisResultStatus }
          : current
      );
      setPatientDetails((current: any) =>
        current
          ? { ...current, WorkflowStatus: nextStudyStatus, ReportStatus: nextReportStatus, hisResultStatus: nextHisResultStatus || current.hisResultStatus }
          : current
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedStudy ? `Ket_Qua_CDHA_${selectedStudy.MainDicomTags?.AccessionNumber || "NA"}_${(selectedStudy.MainDicomTags?.StudyInstanceUID || "").split('.').pop()?.slice(-6) || "ID"}` : "Ket_Qua_CDHA",
    onAfterPrint: () => {
      const uid = selectedStudy?.MainDicomTags?.StudyInstanceUID;
      if (uid) {
        logArchivePrintAction(uid, "PRINT").catch(console.error);
      }
    }
  });

  const selectedUid = selectedStudy?.MainDicomTags?.StudyInstanceUID;
  const selectedPatient = selectedStudy?.PatientMainDicomTags || {};
  const selectedMain = selectedStudy?.MainDicomTags || {};
  const patientName = fmtName(selectedPatient.PatientName);
  const patientId = fmtText(selectedPatient.PatientID);
  const patientSex = fmtSex(selectedPatient.PatientSex);
  const patientAge = fmtAge(selectedPatient.PatientAge);
  const studyDate = fmtDateTime(selectedMain.StudyDate, selectedMain.StudyTime);
  const studyDesc = fmtText(selectedMain.StudyDescription);
  const assignedDoctorName = selectedStudy?.AssignedDoctorName || patientDetails?.AssignedDoctorName || "";
  const reportDoctorName = selectedStudy?.ReportDoctorName || patientDetails?.ReportDoctorName || doctorPrintInfo.doctorName || "";
  const technologistName = selectedStudy?.TechnologistName || patientDetails?.TechnologistName || "";
  const procedureDisplay = selectedStudy?.procedureName || selectedStudy?.procedureDescription || patientDetails?.procedureName || patientDetails?.procedureDescription || studyDesc;
  const serviceDisplay = selectedStudy?.serviceTypeName || patientDetails?.serviceTypeName || "";
  const machineDisplay = selectedStudy?.machineName || patientDetails?.machineName || selectedStudy?.stationAeTitle || patientDetails?.stationAeTitle || "";
  const facilityDisplay = selectedStudy?.facilityName || patientDetails?.facilityName || "";
  const clinicalDisplay = selectedStudy?.clinicalInfo || patientDetails?.clinicalInfo || "";
  const hisOrderDisplay = selectedStudy?.hisSyncStatus || patientDetails?.hisSyncStatus || "";
  const hisResultDisplay = selectedStudy?.hisResultStatus || patientDetails?.hisResultStatus || "";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="studies" />
      <section className="flex h-full w-[52%] min-w-[640px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">Danh sách ca chụp</h1>
              <p className="mt-0.5 text-[10px] text-vin-muted">
                {filteredStudies.length} ca · Trang {currentPage}/{totalPages}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded border border-vin-border bg-vin-panel p-1 text-vin-muted transition hover:border-vin-accent hover:text-vin-text disabled:cursor-not-allowed disabled:opacity-30"
                title="Trang trước"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="rounded border border-vin-border bg-vin-panel p-1 text-vin-muted transition hover:border-vin-accent hover:text-vin-text disabled:cursor-not-allowed disabled:opacity-30"
                title="Trang sau"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
                <input
                  value={searchQuery}
                  onChange={event => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-[2.25rem] w-full rounded-md border border-white/10 bg-transparent py-1.5 pl-7 pr-7 text-[11px] text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent focus:bg-vin-root/20"
                  placeholder="Tìm tên, mã bệnh nhân, accession..."
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-vin-faint transition hover:text-vin-text"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="w-[7rem]">
                <CustomSelect
                  options={modalitySelectOptions}
                  value={modalityFilter}
                  onChange={val => {
                    setModalityFilter(val);
                    setCurrentPage(1);
                  }}
                  compact
                  mono
                />
              </div>
              <div className="w-[10rem]">
                <CustomSelect
                  options={datePresetSelectOptions}
                  value={datePresetFilter}
                  onChange={val => {
                    setDatePresetFilter(val);
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CustomSelect
                  options={workflowStatusSelectOptions}
                  value={workflowStatusFilter}
                  onChange={val => {
                    setWorkflowStatusFilter(val);
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  options={stationAeSelectOptions}
                  value={stationAeFilter}
                  onChange={val => {
                    setStationAeFilter(val);
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  options={assignedDoctorSelectOptions}
                  value={assignedDoctorFilter}
                  onChange={val => {
                    setAssignedDoctorFilter(val);
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
              <div className="w-[9rem]">
                <CustomSelect
                  options={hisStatusSelectOptions}
                  value={hisStatusFilter}
                  onChange={val => {
                    setHisStatusFilter(val);
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scr-dark">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 border-b border-white/10 bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
              <tr>
                <th className="w-9 py-2 pl-2 pr-1 text-center">TT</th>
                <th className="px-2 py-2">Bệnh nhân</th>
                <th className="px-2 py-2">Mô tả</th>
                <th className="px-2 py-2 text-center">Mod</th>
                <th className="px-2 py-2 text-center">Trạng thái</th>
                <th className="px-2 py-2">Phu trach</th>
                <th className="px-2 py-2">Ngày chụp</th>
                <th className="px-2 py-2 text-center">Ảnh</th>
                <th className="w-10 px-2 py-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-vin-muted">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
                    Đang tải danh sách ca chụp...
                  </td>
                </tr>
              ) : pageStudies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-vin-muted">
                    Không có ca chụp nào.
                  </td>
                </tr>
              ) : (
                pageStudies.map((study, index) => {
                  const uid = study.MainDicomTags?.StudyInstanceUID;
                  const isSelected = uid === selectedUid;
                  const patient = study.PatientMainDicomTags || {};
                  const main = study.MainDicomTags || {};

                  return (
                    <tr
                      key={study.ID || uid}
                      onClick={() => handleSelect(study)}
                      onDoubleClick={() => openViewer(study)}
                      className={`cursor-pointer select-none border-b border-l-2 border-white/5 transition-colors last:border-b-0 ${
                        isSelected
                          ? "border-l-vin-accent bg-vin-tableSelected text-white"
                          : "border-l-transparent odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 hover:bg-vin-tableHover"
                      }`}
                      title="Click: chọn · Double-click: mở OHIF"
                    >
                      <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-2 py-2">
                        <div className="max-w-[210px] truncate font-semibold uppercase tracking-[0.01em] text-white">{fmtName(patient.PatientName)}</div>
                        <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
                          {fmtText(patient.PatientID)} &bull; {fmtSex(patient.PatientSex)} &bull; {fmtAge(patient.PatientAge)}T
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="max-w-[260px] truncate font-medium text-vin-text2" title={study.procedureDescription || main.StudyDescription || ""}>
                          {fmtText(study.procedureName || study.procedureDescription || main.StudyDescription)}
                        </div>
                        <div className="mt-0.5 max-w-[260px] truncate font-mono text-[10px] text-vin-muted">
                          {fmtText(study.procedureCode || main.AccessionNumber)}{study.serviceTypeName ? ` · ${study.serviceTypeName}` : ""}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <ModBadge value={study.EnrichedModality || main.Modality} isNonDicom={study.isNonDicom} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <RisStatusBadge status={study.WorkflowStatus} />
                        {(study.hisSyncStatus || study.hisResultStatus) && (
                          <div className="mt-1 flex flex-col gap-0.5 text-[9px] font-semibold">
                            {study.hisSyncStatus && (
                              <span className={study.hisSyncStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}>
                                HIS Sync: {study.hisSyncStatus}
                              </span>
                            )}
                            {study.hisResultStatus && (
                              <span className={study.hisResultStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}>
                                HIS Result: {study.hisResultStatus}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className={`max-w-[150px] truncate font-semibold ${study.AssignedDoctorName ? "text-vin-text2" : "text-amber-200"}`}>
                          {study.AssignedDoctorName || "Chua gan bac si"}
                        </div>
                        <div className="mt-0.5 max-w-[150px] truncate text-[10px] text-vin-muted">
                          {study.ReportDoctorName ? `Report: ${study.ReportDoctorName}` : `SLA: ${fmtDuration(study.waitingMinutes)}`}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-vin-text2">
                        {fmtDateTime(main.StudyDate, main.StudyTime)}
                        <div className="mt-0.5 max-w-[140px] truncate font-sans text-[10px] text-vin-muted">
                          {study.machineName || study.stationAeTitle || "-"}{study.facilityName ? ` · ${study.facilityName}` : ""}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center font-mono text-vin-muted">
                        {study.EnrichedInstancesCount ?? study.Instances?.length ?? "-"}
                      </td>
                      <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <StudyRowActionMenu
                          studyInstanceUid={uid}
                          studyStatus={study.WorkflowStatus}
                          reportStatus={study.ReportStatus}
                          patientName={fmtName(patient.PatientName)}
                          canReadReport={permissions.includes("reports.read")}
                          canWriteReport={permissions.includes("reports.write")}
                          canAssign={permissions.includes("studies.assign")}
                          canUpdateClinical={permissions.includes("studies.updateClinical")}
                          canCancelDraft={permissions.includes("reports.cancelDraft")}
                          canUnfinalize={permissions.includes("reports.unfinalize")}
                          canDeliver={permissions.includes("archive.deliver") && study.WorkflowStatus === "FINALIZED"}
                          canShare={permissions.includes("share.create")}
                          canConsult={permissions.includes("consult.create")}
                          onMarkDelivered={() => handleMarkDelivered(uid)}
                          onUpdateClinical={() => openClinicalModal(study, "CLINICAL_INFO")}
                          onAddIndication={() => openClinicalModal(study, "INDICATION")}
                          onStartReading={() => handleStartReading(uid)}
                          onAssignDoctor={() => openAssignModal(study)}
                          onCancelDraft={() => handleCancelDraft(uid)}
                          onUnfinalize={() => handleUnfinalize(uid)}
                          onShare={() => {
                            setActionResourceId(study.isNonDicom ? study.nonDicomExamId : uid);
                            setActionResourceType(study.isNonDicom ? 'NON_DICOM' : 'DICOM');
                            setShareDialogOpen(true);
                          }}
                          onConsult={() => {
                            setActionResourceId(study.isNonDicom ? study.nonDicomExamId : uid);
                            setActionResourceType(study.isNonDicom ? 'NON_DICOM' : 'DICOM');
                            setConsultDialogOpen(true);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="h-[28%] min-h-[180px] flex-none border-t border-vin-border bg-vin-sidebar">
          <div className="flex items-center gap-2 border-b border-vin-border px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-vin-accent" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-vin-muted">Lịch sử chụp</span>
            {selectedStudy && (
              <span className="font-mono text-[10px] text-vin-faint">
                · PID: {patientId} · {patientHistory.length} ca
              </span>
            )}
          </div>

          <div className="h-[calc(100%-34px)] overflow-auto scr-dark">
            {!selectedStudy ? (
              <div className="flex h-full items-center justify-center text-[11px] text-vin-faint">
                Chọn một bệnh nhân để xem lịch sử chụp
              </div>
            ) : patientHistory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[11px] text-vin-faint">Không có lịch sử</div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 border-b border-white/10 bg-vin-panel2 text-[9px] font-semibold uppercase tracking-wider text-vin-muted">
                  <tr>
                    <th className="py-1 pl-2 pr-1">Ngày chụp</th>
                    <th className="w-10 px-1 py-1 text-center">Mod</th>
                    <th className="px-1 py-1">Mô tả</th>
                    <th className="w-8 py-1 pl-1 pr-2 text-center">TT</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {patientHistory.map(history => {
                    const uid = history.MainDicomTags?.StudyInstanceUID;
                    const isCurrent = uid === selectedUid;

                    return (
                      <tr
                        key={history.ID || uid}
                        onClick={() => handleSelect(history)}
                        onDoubleClick={() => openViewer(history)}
                        className={`cursor-pointer border-b border-white/5 transition-colors last:border-b-0 ${
                          isCurrent ? "bg-vin-tableSelected text-white" : "text-vin-text2 hover:bg-vin-tableHover"
                        }`}
                      >
                        <td className="whitespace-nowrap py-1 pl-2 pr-1 font-mono">
                          {fmtDateTime(history.MainDicomTags?.StudyDate, history.MainDicomTags?.StudyTime)}
                        </td>
                        <td className="px-1 py-1 text-center">
                          <ModBadge value={history.EnrichedModality || "?"} />
                        </td>
                        <td className="max-w-[220px] truncate px-1 py-1">{fmtText(history.MainDicomTags?.StudyDescription)}</td>
                        <td className="py-1 pl-1 pr-2 text-center">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${(history.IsStable ?? true) ? "bg-emerald-400" : "bg-amber-400"}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        {!selectedStudy ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-vin-border bg-vin-shell">
              <ImageIcon className="h-7 w-7 text-vin-faint" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-vin-text2">Chưa chọn ca chụp</h3>
            <p className="max-w-[250px] text-[11px] leading-relaxed text-vin-muted">
              Click vào ca chụp bên trái để viết kết quả. Double-click để mở OHIF Viewer.
            </p>
          </div>
        ) : isReportLoading ? (
          <div className="flex h-full flex-col items-center justify-center bg-vin-panel">
            <Loader2 className="mb-2 h-5 w-5 animate-spin text-vin-accent" />
            <span className="text-[11px] text-vin-muted">Đang tải thông tin ca chụp...</span>
          </div>
        ) : (
          <>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="truncate text-sm font-bold uppercase tracking-wide text-white">{patientName}</h2>
                  <p className="mt-1 text-[10px] text-vin-muted">
                    {patientId} · {fmtSex(selectedPatient.PatientSex)} · {patientAge}T
                  </p>
                </div>
                <RisStatusBadge status={studyStatus} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px]">
                <div>
                  <span className="text-vin-muted">Ngày:</span> <span className="font-semibold text-vin-text2">{studyDate}</span>
                </div>
                <div>
                  <span className="text-vin-muted">Mod:</span> <span className="font-semibold text-vin-text2">{selectedStudy.EnrichedModality || "-"}</span>
                </div>
                <div className="truncate">
                  <span className="text-vin-muted">Chỉ định:</span> <span className="font-semibold text-vin-text2">{procedureDisplay}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded border border-vin-border/70 bg-vin-shell/60 p-3 lg:grid-cols-4">
                <MiniInfo label="Bac si duoc gan" value={assignedDoctorName || "Chua gan"} />
                <MiniInfo label="Bac si report/ky" value={reportDoctorName || "Chua co"} />
                <MiniInfo label="KTV" value={technologistName || "Chua chon"} />
                <MiniInfo label="Procedure" value={procedureDisplay} />
                <MiniInfo label="Service" value={serviceDisplay || "Fallback DICOM"} />
                <MiniInfo label="May/Phong" value={machineDisplay || "-"} />
                <MiniInfo label="Co so" value={facilityDisplay || "-"} />
                <MiniInfo label="SLA cho" value={`${fmtDuration(selectedStudy?.waitingMinutes)} · ${selectedStudy?.slaStatus || "UNKNOWN"}`} />
                <MiniInfo label="Report status" value={selectedStudy?.ReportStatus || "Chua co"} mono />
                <MiniInfo label="HIS order" value={hisStatusLabel(hisOrderDisplay)} />
                <MiniInfo label="HIS result" value={hisStatusLabel(hisResultDisplay)} />
                <MiniInfo label="Tra ket qua" value={fmtDateTimeIso(selectedStudy?.deliveredAt || patientDetails?.deliveredAt)} />
              </div>
              {clinicalDisplay && (
                <div className="mt-2 rounded border border-vin-border/70 bg-vin-shell/60 px-3 py-2 text-[11px] leading-relaxed text-vin-text2">
                  <span className="font-bold uppercase tracking-wide text-vin-muted">Lam sang: </span>
                  {clinicalDisplay}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-vin-text2">Mô tả (Findings)</label>
                  <span className="rounded bg-vin-shell px-2 py-0.5 font-mono text-[9px] text-vin-muted">Paste/Drop ảnh</span>
                </div>
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
                <label className="mb-2 block text-[11px] font-semibold text-vin-text2">Kết luận (Conclusion)</label>
                <textarea
                  value={conclusion}
                  onChange={event => setConclusion(event.target.value)}
                  className="h-24 w-full resize-none rounded-lg border border-vin-border bg-vin-shell p-3 text-[12px] text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent"
                  placeholder="Nhập kết luận..."
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold text-vin-text2">Đề nghị (Recommendation)</label>
                <textarea
                  value={recommendation}
                  onChange={event => setRecommendation(event.target.value)}
                  className="h-20 w-full resize-none rounded-lg border border-vin-border bg-vin-shell p-3 text-[12px] text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent"
                  placeholder="Nhập đề nghị..."
                />
              </div>
            </div>

            <div className="flex flex-none items-center justify-between border-t border-vin-border bg-vin-panel2 px-4 py-3">
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 rounded-lg border border-vin-border bg-vin-shell px-3 py-1.5 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                In phiếu
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave("DRAFT")}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg border border-vin-border bg-vin-shell px-3 py-1.5 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  Lưu nháp
                </button>
                <button
                  onClick={() => handleSave("FINAL")}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg border-0 bg-vin-accent px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Hoàn tất
                </button>
              </div>
            </div>

            <PrintTemplateViewer
              ref={printRef}
              templateHtml={templateHtml}
              context={{
                patientName,
                patientId,
                studyDate,
                studyDesc: procedureDisplay,
                reportContent: findings,
                conclusion,
                recommendation,
                ...clinicProfile,
                ...doctorPrintInfo,
              }}
            />
          </>
        )}
      </section>

      <style>{`
        select option{background:var(--vin-bg-shell);color:var(--vin-text-primary)}
        .scr-dark::-webkit-scrollbar{width:5px;height:5px}
        .scr-dark::-webkit-scrollbar-track{background:transparent}
        .scr-dark::-webkit-scrollbar-thumb{background:var(--vin-border-subtle);border-radius:10px}
        .scr-dark::-webkit-scrollbar-thumb:hover{background:var(--vin-border-strong)}
      `}</style>
      <ClinicalInfoModal
        isOpen={clinicalModalOpen}
        onClose={() => setClinicalModalOpen(false)}
        mode={clinicalModalMode}
        studyInstanceUid={activeStudy?.MainDicomTags?.StudyInstanceUID || ""}
        initialData={activeStudy || {}}
        onSave={handleClinicalSave}
      />
      <AssignDoctorModal
        isOpen={assignDoctorModalOpen}
        onClose={() => setAssignDoctorModalOpen(false)}
        doctors={activeDoctors}
        onAssign={handleAssignDoctor}
      />
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        scope={actionResourceType === 'NON_DICOM' ? 'NON_DICOM_EXAM' : 'STUDY'}
        resourceId={actionResourceId}
      />
      <ConsultationDialog
        isOpen={consultDialogOpen}
        onClose={() => setConsultDialogOpen(false)}
        sourceType={actionResourceType}
        studyInstanceUid={actionResourceType === 'DICOM' ? actionResourceId : undefined}
        nonDicomExamId={actionResourceType === 'NON_DICOM' ? actionResourceId : undefined}
      />
    </div>
  );
}
