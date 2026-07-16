"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { AppShell } from "./components/shell/AppShell";
import { ScreenHeader } from "./components/navigation/ScreenHeader";
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
import { getScopedWorklistAction } from "./actions/worklist-actions";
import { createExportJobAction } from "./actions/export-actions";
import { createDestructiveRequestAction } from "./actions/destructive-actions";
import { logArchivePrintAction } from "./archive/actions";
import { StudyRowActionMenu } from "./components/StudyRowActionMenu";
import { ClinicalInfoModal } from "./components/ClinicalInfoModal";
import AssignDoctorModal from "./components/AssignDoctorModal";
import { ShareDialog } from "@/components/share/ShareDialog";
import { ConsultationDialog } from "@/components/consultation/ConsultationDialog";
import { useWorklistUrlState, mapUrlStateToQuery } from "../lib/worklist/url-state";
import { useSelectionUrlState } from "../lib/workspace/selection-state";
import { getWorkspacePreferencesAction, resetWorkspacePreferencesAction, updateWorkspacePreferencesAction } from "./actions/workspace-preferences-actions";
import { WorkspacePreferences, defaultWorkspacePreferences } from "../lib/preferences/workspace-preferences";
import { logShadowRunTelemetry } from "../lib/telemetry";
import { DoctorWorkspace } from "./components/workspace/DoctorWorkspace";
import { WorkspaceSwitcherAntd } from "./components/workspace/regions/WorkspaceSwitcherAntd";
import { WorkspaceSearchBarAntd } from "./components/workspace/regions/WorkspaceSearchBarAntd";
import { WorkQueueFacetsAntd } from "./components/workspace/regions/WorkQueueFacetsAntd";
import { FacilityScopeTreeAntd } from "./components/workspace/regions/FacilityScopeTreeAntd";
import { RelatedStudiesPanelAntd } from "./components/workspace/regions/RelatedStudiesPanelAntd";
import { PatientStudyContextPanelAntd } from "./components/workspace/regions/PatientStudyContextPanelAntd";
import { ReportWorkspacePanel } from "./components/workspace/ReportWorkspacePanel";
import { resolveWorklistMode } from "../lib/worklist/cutover";

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

import { fmtName, fmtText, fmtSex, fmtAge, fmtDateTime, fmtDateTimeIso, fmtDuration, hisStatusLabel } from "./components/workspace/formatters";
import { ModBadge, RisStatusBadge, risStatusLabels } from "./components/workspace/badges";
import { StudyDataGridAntd } from "./components/workspace/StudyDataGridAntd";

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

function MiniInfo({ label, mono, value }: { label: string; mono?: boolean; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-bold uppercase tracking-wide text-vin-muted">{label}</div>
      <div className={`mt-0.5 truncate text-sm text-vin-text2 ${mono ? "font-mono" : ""}`}>{value || "-"}</div>
    </div>
  );
}


import { Suspense } from "react";
import { WorkspaceDirtyProvider, useWorkspaceDirty } from "./components/workspace/hooks/WorkspaceDirtyContext";
import { UnsavedChangesDialogAntd } from "./components/workspace/UnsavedChangesDialogAntd";

function DashboardPageContent() {
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studyLoadError, setStudyLoadError] = useState<string | null>(null);
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
  const [preferences, setPreferences] = useState<WorkspacePreferences>(defaultWorkspacePreferences);
  const layoutDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingLayoutRef = useRef<Partial<WorkspacePreferences["layout"]>>({});

  const handlePreferencesChange = useCallback((updates: Partial<WorkspacePreferences>) => {
    setPreferences(current => ({ ...current, ...updates, columns: updates.columns ? { ...current.columns, ...updates.columns } : current.columns, layout: updates.layout ? { ...current.layout, ...updates.layout } : current.layout }));
    updateWorkspacePreferencesAction(updates).then(setPreferences).catch(console.error);
  }, []);
  const handleResetPreferences = useCallback(() => { resetWorkspacePreferencesAction().then(setPreferences).catch(console.error); }, []);

  const handleLayoutChange = useCallback((updates: Partial<WorkspacePreferences['layout']>) => {
    setPreferences(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        ...updates
      }
    }));
    pendingLayoutRef.current = { ...pendingLayoutRef.current, ...updates };

    if (layoutDebounceRef.current) {
      clearTimeout(layoutDebounceRef.current);
    }
    layoutDebounceRef.current = setTimeout(() => {
      const layout = pendingLayoutRef.current;
      pendingLayoutRef.current = {};
      layoutDebounceRef.current = null;
      updateWorkspacePreferencesAction({ layout }).catch(console.error);
    }, 500);
  }, []);

  const { state, setFilters, localSearchQuery, setLocalSearchQuery, commitSearchNow, isPending } = useWorklistUrlState();
  const { studyUid, setSelection } = useSelectionUrlState();
  const { interceptNavigation } = useWorkspaceDirty();
  const [patientDetails, setPatientDetails] = useState<any>(null);

  const selectedStudy = useMemo(() => {
    if (!studyUid) return null;
    const listedStudy = studies.find(s => s.MainDicomTags?.StudyInstanceUID === studyUid);
    const detailsMatch = patientDetails?.MainDicomTags?.StudyInstanceUID === studyUid;
    if (listedStudy && detailsMatch) return { ...listedStudy, ...patientDetails };
    return listedStudy || (detailsMatch ? patientDetails : { MainDicomTags: { StudyInstanceUID: studyUid } });
  }, [studies, studyUid, patientDetails]);

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
      setPatientDetails((cur: any) => (cur ? { ...cur, ...data } : cur));
    }
    return result;
  };

  const handleExportDicom = async (uid: string) => {
    try {
      await createExportJobAction({
        jobType: "EXPORT_STUDY_DICOM",
        scope: "STUDY",
        studyInstanceUid: uid,
        format: "DICOM",
      });
      alert("Đã tạo yêu cầu tải xuống DICOM thành công. Vui lòng kiểm tra Quản lý tải xuống.");
    } catch (err: any) {
      alert("Lỗi tạo yêu cầu tải xuống: " + err.message);
    }
  };

  const handleExportAnonymized = async (uid: string) => {
    try {
      await createExportJobAction({
        jobType: "EXPORT_STUDY_DICOM",
        scope: "STUDY",
        studyInstanceUid: uid,
        format: "DICOM",
        anonymize: true
      });
      alert("Đã tạo yêu cầu tải xuống (Ẩn thông tin) thành công.");
    } catch (err: any) {
      alert("Lỗi tạo yêu cầu tải xuống: " + err.message);
    }
  };

  const handleRequestDelete = async (uid: string) => {
    const reason = prompt("Vui lòng nhập lý do xóa ca chụp này:");
    if (!reason) return;
    try {
      await createDestructiveRequestAction({
        operationType: "DELETE_STUDY",
        entityType: "STUDY",
        studyInstanceUid: uid,
        reason: reason
      });
      alert("Đã gửi yêu cầu xóa thành công. Vui lòng chờ người duyệt.");
    } catch (err: any) {
      alert("Lỗi gửi yêu cầu xóa: " + err.message);
    }
  };



  useEffect(() => {
    let abort = false;
    async function loadStudies() {
      try {
        setIsLoading(true);
        setStudyLoadError(null);
        // FALLBACK: flag controls whether we use the old un-scoped Orthanc query or the new scoped Prisma query
        let data = [];
        const [clinic, perms, prefs] = await Promise.all([
          getClinicProfile(),
          getUserPermissionsAction(),
          getWorkspacePreferencesAction().catch(() => defaultWorkspacePreferences)
        ]);
        if (abort) return;
        setPermissions(perms.permissions);
        setUserRole(perms.role);
        setPreferences(prefs);
        // Determine execution mode
        const mode = resolveWorklistMode(
          process.env.NEXT_PUBLIC_WORKLIST_MODE,
          process.env.NEXT_PUBLIC_USE_SCOPED_WORKLIST,
        );

        const mapScopedRow = (row: any) => ({
          ...row,
          ID: row.studyInstanceUid,
          MainDicomTags: {
            StudyInstanceUID: row.studyInstanceUid,
            StudyDate: (row.studyDate || row.createdAt).substring(0, 10).replace(/-/g, ''),
            StudyTime: (row.studyDate || row.createdAt).substring(11, 19).replace(/:/g, ''),
            StudyDescription: row.procedureDescription || row.bodyPart || "",
            AccessionNumber: row.accessionNumber,
            Modality: row.modality,
            StationName: row.stationAeTitle
          },
          PatientMainDicomTags: {
            PatientName: row.patientName,
            PatientID: row.patientId,
            PatientBirthDate: row.patientBirthDate,
            PatientSex: row.patientSex,
            PatientAge: row.ageAtStudy,
          },
          EnrichedModality: row.modality,
          WorkflowStatus: row.status,
          AssignedDoctorId: row.assignedDoctorId,
          AssignedDoctorName: row.assignedDoctorName,
          hisSyncStatus: row.hisSyncStatus,
          stationAeTitle: row.stationAeTitle,
          performingUnitId: row.performingUnitId,
          facilityName: row.facilityName,
          machineName: row.machineName,
          isNonDicom: row.isNonDicom,
          nonDicomExamId: row.nonDicomExamId,
          procedureName: row.procedureDescription || row.bodyPart,
          TechnologistName: row.technologistName,
          ReportStatus: row.reportStatus,
          Revision: row.revision,
          allowedActions: row.allowedActions,
        });

        if (mode === 'SCOPED') {
          const req = mapUrlStateToQuery(state);
          const response = await getScopedWorklistAction(req);
          if (abort) return;
          data = response.rows.map(mapScopedRow);
        } else if (mode === 'LEGACY') {
          const result = await getStudies();
          if (abort) return;
          data = result;
        } else {
          // SHADOW mode
          const req = mapUrlStateToQuery(state);

          const t0 = performance.now();
          const pLegacy = getStudies().then(res => {
            const lat = performance.now() - t0;
            return { data: res, error: null, latency: lat };
          }).catch(error => {
            return { data: null, error, latency: performance.now() - t0 };
          });
          const pScoped = getScopedWorklistAction(req).then(res => {
            const lat = performance.now() - t0;
            return { data: res, error: null, latency: lat };
          }).catch(err => {
            return { data: null, error: err, latency: performance.now() - t0 };
          });

          const [legacyRes, scopedRes] = await Promise.all([pLegacy, pScoped]);
          if (abort) return;

          if (!legacyRes.error) {
            data = legacyRes.data!;
          } else if (!scopedRes.error) {
            // A scoped fallback is authorization-safe and avoids an outage when
            // Orthanc is unavailable during the shadow soak period.
            data = scopedRes.data!.rows.map(mapScopedRow);
          } else {
            throw new Error("Both worklist read paths are unavailable");
          }

          // Aggregate-only telemetry (fire and forget). Do not pass query,
          // patient/accession identifiers, errors, or raw response payloads.
          const scopedRows = scopedRes.error ? 0 : scopedRes.data!.rows.length;
          try {
            logShadowRunTelemetry({
              legacyLatencyMs: Math.round(legacyRes.latency),
              scopedLatencyMs: Math.round(scopedRes.latency),
              legacyRowsCount: legacyRes.error ? 0 : legacyRes.data!.length,
              scopedRowsCount: scopedRows,
              legacySucceeded: !legacyRes.error,
              scopedSucceeded: !scopedRes.error,
            });
          } catch (telemetryError) {
            // Observability must never make the clinical read path fail.
            console.error("Failed to emit shadow-run telemetry", telemetryError);
          }
        }

        setStudies(data || []);

        if (perms.permissions.includes("studies.assign")) {
          try {
            const docs = await getActiveDoctorsAction();
            if (!abort) setActiveDoctors(docs || []);
          } catch (err) {
            console.error("Failed to fetch doctors", err);
            if (!abort) setActiveDoctors([]);
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
        if (abort) return;
        console.error(error);
        setStudyLoadError("Không thể tải danh sách ca chụp. Vui lòng thử lại.");
      } finally {
        if (!abort) setIsLoading(false);
      }
    }

    loadStudies();
    return () => { abort = true; };
  }, [state]);

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
    { value: "30DAYS", label: "30 ngày gần đây" },
  ], []);

  const filteredStudies = useMemo(() => {
    let list = studies;

    if (state.q) {
      const query = state.q.toLowerCase();
      list = list.filter(study => {
        const patient = study.PatientMainDicomTags || {};
        const main = study.MainDicomTags || {};
        return `${patient.PatientName || ""} ${patient.PatientID || ""} ${main.AccessionNumber || ""} ${main.StudyDescription || ""} ${study.AssignedDoctorName || ""} ${study.ReportDoctorName || ""} ${study.procedureName || ""} ${study.procedureCode || ""} ${study.machineName || ""}`
          .toLowerCase()
          .includes(query);
      });
    }

    if (state.modality && state.modality !== "ALL") {
      list = list.filter(study => study.EnrichedModality === state.modality);
    }

    if (state.workflowStatus && state.workflowStatus !== "ALL") {
      list = list.filter(study => (study.WorkflowStatus || "READY_TO_READ") === state.workflowStatus);
    }

    if (state.stationAe && state.stationAe !== "ALL") {
      list = list.filter(study => {
        const station = study.stationAeTitle || study.machineName || study.MainDicomTags?.StationName || study.MainDicomTags?.InstitutionName;
        return station === state.stationAe;
      });
    }

    if (state.assignedDoctor === "UNASSIGNED") {
      list = list.filter(study => !study.AssignedDoctorId);
    } else if (state.assignedDoctor && state.assignedDoctor !== "ALL") {
      list = list.filter(study => study.AssignedDoctorId === state.assignedDoctor);
    }

    if (state.hisStatus === "EMPTY") {
      list = list.filter(study => !study.hisSyncStatus && !study.hisResultStatus);
    } else if (state.hisStatus && state.hisStatus !== "ALL") {
      list = list.filter(study => study.hisSyncStatus === state.hisStatus || study.hisResultStatus === state.hisStatus);
    }

    if (state.facilityUnitId && state.facilityUnitId !== "ALL") {
      list = list.filter(study => (study.performingUnitId || study.facilityUnitId || study.facilityId) === state.facilityUnitId);
    }

    if (state.datePreset !== "ALL") {
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

        if (state.datePreset === "TODAY") return diffDays <= 0 && diffDays > -1;
        if (state.datePreset === "YESTERDAY") return diffDays > 0 && diffDays <= 1;
        if (state.datePreset === "3DAYS") return diffDays >= 0 && diffDays <= 3;
        if (state.datePreset === "7DAYS") return diffDays >= 0 && diffDays <= 7;
        return true;
      });
    }

    return list;
  }, [state, studies]);

  const totalPages = Math.ceil(filteredStudies.length / rowsPerPage) || 1;
  const pageStudies = filteredStudies.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);



  const studiesRef = useRef(studies);
  useEffect(() => { studiesRef.current = studies; }, [studies]);
  const requestRaceToken = useRef<string | null>(null);

  useEffect(() => {
    if (!studyUid) {
      requestRaceToken.current = null;
      setIsReportLoading(false);
      setPatientDetails(null);
      setFindings("");
      setConclusion("");
      setRecommendation("");
      setStudyStatus("READY_TO_READ");
      setDoctorPrintInfo({});
      setReportTemplates([]);
      setTemplateHtml("");
      return;
    }

    const currentToken = studyUid;
    requestRaceToken.current = currentToken;
    let isMounted = true;

    async function loadSelectionData() {
      try {
        setIsReportLoading(true);
        setFindings("");
        setConclusion("");
        setRecommendation("");
        setStudyStatus("READY_TO_READ");
        setDoctorPrintInfo({});
        setReportTemplates([]);
        setPatientDetails(null);

        const [report, details, template] = await Promise.all([
          getReport(studyUid!),
          getStudyDetails(studyUid!),
          getDefaultTemplate(),
        ]);

        if (!isMounted || requestRaceToken.current !== currentToken) return;

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

        const studyObj = studiesRef.current.find(s => s.MainDicomTags?.StudyInstanceUID === studyUid);
        const modality = studyObj?.EnrichedModality || studyObj?.MainDicomTags?.Modality;
        const bodyPart = studyObj?.MainDicomTags?.BodyPartExamined;

        const cannedTemplates = await getReportTemplateSuggestions({
          modality,
          bodyPart,
        });

        if (isMounted && requestRaceToken.current === currentToken) {
          setReportTemplates(cannedTemplates || []);
        }

      } catch (error) {
        if (!isMounted || requestRaceToken.current !== currentToken) return;
        console.error(error);
        setStudyStatus("NOT_FOUND");
        setPatientDetails({
          error: true,
          message: "Ca chụp không tồn tại hoặc bạn không có quyền truy cập."
        });
      } finally {
        if (isMounted && requestRaceToken.current === currentToken) {
          setIsReportLoading(false);
        }
      }
    }

    loadSelectionData();

    return () => {
      isMounted = false;
    };
  }, [studyUid]); // intentionally omit studies to avoid wiping out draft on polling

  const handleSelect = async (study: any) => {
    const uid = study?.MainDicomTags?.StudyInstanceUID;
    if (uid) {
      interceptNavigation(() => setSelection(uid));
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

  const handleCancelDraft = async (uid: string, baseRevision: number = 0) => {
    if (confirm("Bạn có chắc chắn muốn hủy phiên bản nháp này?")) {
      const reason = prompt("Lý do hủy (tùy chọn):") || "Hủy nháp";
      const res = await cancelReportDraft(uid, baseRevision, reason);
      if (res.success) {
        setStudies(current =>
          current.map(study => (
            study.MainDicomTags?.StudyInstanceUID === uid
              ? { ...study, ReportStatus: "CANCELLED", WorkflowStatus: "READY_TO_READ", Revision: res.newRevision ?? baseRevision + 1 }
              : study
          ))
        );
        if (selectedStudy?.MainDicomTags?.StudyInstanceUID === uid) {
          setStudyStatus("READY_TO_READ");
        }
      } else {
        alert((res as any).error || "Lỗi hủy nháp");
      }
    }
  };

  const handleUnfinalize = async (uid: string, baseRevision: number = 0) => {
    const reason = prompt("Lý do hủy duyệt (bắt buộc):");
    if (!reason) return;
    const res = await unfinalizeReport(uid, baseRevision, reason);
    if (res.success) {
      setStudies(current =>
        current.map(study => (
          study.MainDicomTags?.StudyInstanceUID === uid
            ? { ...study, ReportStatus: "DRAFT", WorkflowStatus: "READING", Revision: res.newRevision ?? baseRevision + 1 }
            : study
        ))
      );
      if (selectedStudy?.MainDicomTags?.StudyInstanceUID === uid) {
        setStudyStatus("READING");
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
      const baseRevision = selectedStudy?.Revision || 0;
      const draftResult = await saveReportDraft(uid, baseRevision, { findings, conclusion, recommendation });
      if (!draftResult.success) {
        alert((draftResult as any).error || "Lỗi lưu nháp báo cáo");
        setIsSaving(false);
        return;
      }

      let nextStudyStatus = "READING";
      let nextReportStatus = "DRAFT";
      let nextHisResultStatus: string | undefined = undefined;
      let nextRevision = draftResult.newRevision ?? baseRevision + 1;

      if (status === "FINAL") {
        const finalResult = await finalizeReport(uid, draftResult.newRevision || baseRevision + 1);
        if (!finalResult.success) {
          alert((finalResult as any).error || "Lỗi ký duyệt báo cáo");
          setIsSaving(false);
          return;
        }
        nextStudyStatus = finalResult.workflowStatus || "FINALIZED";
        nextReportStatus = finalResult.reportStatus || "FINAL";
        nextHisResultStatus = finalResult.hisResultStatus;
        nextRevision = finalResult.newRevision ?? nextRevision + 1;
      }

      setStudyStatus(nextStudyStatus);

      setStudies(current =>
        current.map(study => (
          study.MainDicomTags?.StudyInstanceUID === uid
            ? {
                ...study,
                WorkflowStatus: nextStudyStatus,
                ReportStatus: nextReportStatus,
                Revision: nextRevision,
                hisResultStatus: nextHisResultStatus || study.hisResultStatus,
              }
            : study
        ))
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

  const sharedGrid = (
    <StudyDataGridAntd
      studies={pageStudies}
      isLoading={isLoading}
      errorMessage={studyLoadError}
      selectedUid={selectedUid}
      startIndex={(currentPage - 1) * rowsPerPage}
      onSelect={handleSelect}
      onDoubleClick={openViewer}
      preferences={preferences}
      onPreferencesChange={handlePreferencesChange}
      onResetPreferences={handleResetPreferences}
      renderActions={(study) => {
        const uid = study.MainDicomTags?.StudyInstanceUID;
        const patient = study.PatientMainDicomTags || {};
        return (
          <StudyRowActionMenu
            studyInstanceUid={uid}
            studyStatus={study.WorkflowStatus}
            reportStatus={study.ReportStatus}
            revision={study.Revision}
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
            onCancelDraft={(rev) => handleCancelDraft(uid, rev || study.Revision || 0)}
            onUnfinalize={(rev) => handleUnfinalize(uid, rev || study.Revision || 0)}
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
            canExport={permissions.includes("export.create")}
            canExportAnonymized={permissions.includes("export.anonymize")}
            canDeleteStudy={permissions.includes("destructive.request")}
            onExportDicom={() => handleExportDicom(uid)}
            onExportAnonymized={() => handleExportAnonymized(uid)}
            onRequestDelete={() => handleRequestDelete(uid)}
            allowedActions={study.allowedActions}
          />
        );
      }}
    />
  );

  // The seven-region doctor workspace is the only production doctor screen.
  // Do not gate this render path with a NEXT_PUBLIC build-time flag: stale
  // Docker args previously baked `false` into the client bundle and silently
  // brought the retired two-pane UI back after every rebuild.
  const isPhase4 = true;
  const isReportPanelEnabled = process.env.NEXT_PUBLIC_ENABLE_REPORT_PANEL === 'true';

  if (isPhase4) {
    const statusCounts = new Map<string, number>();
    const modalityCounts = new Map<string, number>();
    const facilityCounts = new Map<string, { name: string; count: number }>();
    studies.forEach((study: any) => {
      const status = study.WorkflowStatus || "READY_TO_READ";
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      const modality = study.EnrichedModality || study.MainDicomTags?.Modality;
      if (modality) modalityCounts.set(modality, (modalityCounts.get(modality) || 0) + 1);
      const id = study.performingUnitId || study.facilityUnitId || study.facilityId;
      if (id) { const old = facilityCounts.get(id); facilityCounts.set(id, { name: study.facilityName || id, count: (old?.count || 0) + 1 }); }
    });
    const workspaceStatuses = [{ value: "ALL", label: "Tất cả", count: studies.length }, ...workflowStatusSelectOptions.filter(o => o.value !== "ALL").map(o => ({ ...o, count: statusCounts.get(o.value) || 0 })).filter(o => o.count > 0)];
    const workspaceModalities = [{ value: "ALL", label: "Tất cả" }, ...Array.from(modalityCounts.keys()).sort().map(value => ({ value, label: value, count: modalityCounts.get(value) }))];
    const workspaceFacilities = Array.from(facilityCounts.entries()).map(([id, item]) => ({ id, ...item })).sort((a, b) => a.name.localeCompare(b.name, "vi"));
    const selectedStudyData = selectedStudy;
    const studyContext = selectedStudyData ? {
      patientName: fmtName(selectedStudyData.PatientMainDicomTags?.PatientName),
      patientId: fmtText(selectedStudyData.PatientMainDicomTags?.PatientID),
      studyDate: fmtDateTime(selectedStudyData.MainDicomTags?.StudyDate, selectedStudyData.MainDicomTags?.StudyTime),
      studyDescription: fmtText(selectedStudyData.MainDicomTags?.StudyDescription),
      modality: selectedStudyData.EnrichedModality || selectedStudyData.MainDicomTags?.Modality,
      status: selectedStudyData.WorkflowStatus,
      accessionNumber: selectedStudyData.MainDicomTags?.AccessionNumber,
    } : null;

    return (
      <AppShell contentClassName="flex w-full overflow-hidden bg-vin-root font-sans text-vin-text" contentOverflow="hidden">
        <DoctorWorkspace
          switcher={<WorkspaceSwitcherAntd role={userRole} permissions={permissions} />}
          searchBar={<WorkspaceSearchBarAntd value={localSearchQuery} datePreset={state.datePreset} pending={isPending} onChange={value => { setLocalSearchQuery(value); setCurrentPage(1); }} onCommit={commitSearchNow} onDateChange={datePreset => { setFilters({ datePreset }); setCurrentPage(1); }} />}
          facets={<WorkQueueFacetsAntd status={state.workflowStatus} modality={state.modality} statuses={workspaceStatuses} modalities={workspaceModalities} onStatusChange={workflowStatus => { setFilters({ workflowStatus }); setCurrentPage(1); }} onModalityChange={modality => { setFilters({ modality }); setCurrentPage(1); }} onClear={() => setFilters({ workflowStatus: "ALL", modality: "ALL" })} />}
          scopeTree={<FacilityScopeTreeAntd facilities={workspaceFacilities} value={state.facilityUnitId} onChange={facilityUnitId => { setFilters({ facilityUnitId }); setCurrentPage(1); }} />}
          grid={<>
            <div className="flex h-10 flex-none items-center justify-between border-b border-vin-border bg-vin-panel2 px-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-vin-text2">Danh sách ca chụp</h2>
                <p className="text-sm text-vin-muted">{filteredStudies.length} ca · Trang {currentPage}/{totalPages}</p>
              </div>
              <div className="flex items-center gap-1" aria-label="Phân trang">
                <button type="button" aria-label="Trang trước" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded border border-vin-border p-1 text-vin-muted hover:border-vin-accent hover:text-white disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label="Trang sau" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages} className="rounded border border-vin-border p-1 text-vin-muted hover:border-vin-accent hover:text-white disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1">{sharedGrid}</div>
          </>}
          relatedPanel={<RelatedStudiesPanelAntd anchorStudyUid={studyUid} selectedUid={studyUid} onSelect={handleSelect} onDoubleClick={openViewer} />}
          contextPanel={<PatientStudyContextPanelAntd studyUid={studyUid} />}
          reportPanel={isReportPanelEnabled && studyUid ? <ReportWorkspacePanel studyUid={studyUid} studyContext={studyContext} /> : undefined}
          layoutPrefs={preferences.layout}
          onLayoutChange={handleLayoutChange}
        />
      </AppShell>
    );
  }

  return (
    <AppShell contentClassName="flex w-full overflow-hidden bg-vin-root font-sans text-vin-text" contentOverflow="hidden">
      <section className="flex h-full w-[52%] min-w-[640px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2">
            <ScreenHeader
              extraContent={
                <div className="flex items-center gap-3">
                  <p className="text-sm text-vin-muted">
                    {filteredStudies.length} ca · Trang {currentPage}/{totalPages}
                  </p>
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
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
                <input
                  value={localSearchQuery}
                  onKeyDown={event => {
                    if (event.key === "Enter") commitSearchNow();
                  }}
                  onChange={event => {
                    setLocalSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-[2.25rem] w-full rounded-md border border-white/10 bg-transparent py-1.5 pl-7 pr-7 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent focus:bg-vin-root/20"
                  placeholder="Tìm tên, mã bệnh nhân, accession..."
                />
                {localSearchQuery && (
                  <button
                    onClick={() => {
                      setLocalSearchQuery("");
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
                  value={state.modality}
                  onChange={val => {
                    setFilters({ modality: val });
                    setCurrentPage(1);
                  }}
                  compact
                  mono
                />
              </div>
              <div className="w-[10rem]">
                <CustomSelect
                  options={datePresetSelectOptions}
                  value={state.datePreset}
                  onChange={val => {
                    setFilters({ datePreset: val as any });
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
                  value={state.workflowStatus}
                  onChange={val => {
                    setFilters({ workflowStatus: val });
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  options={stationAeSelectOptions}
                  value={state.stationAe}
                  onChange={val => {
                    setFilters({ stationAe: val });
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  options={assignedDoctorSelectOptions}
                  value={state.assignedDoctor}
                  onChange={val => {
                    setFilters({ assignedDoctor: val });
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
              <div className="w-[9rem]">
                <CustomSelect
                  options={hisStatusSelectOptions}
                  value={state.hisStatus}
                  onChange={val => {
                    setFilters({ hisStatus: val });
                    setCurrentPage(1);
                  }}
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        {sharedGrid}

        <div className="h-[28%] min-h-[180px] flex-none border-t border-vin-border bg-vin-sidebar">
          <RelatedStudiesPanelAntd anchorStudyUid={studyUid} selectedUid={studyUid} onSelect={handleSelect} onDoubleClick={openViewer} />
        </div>
      </section>

      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        {!selectedStudy ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-vin-border bg-vin-shell">
              <ImageIcon className="h-7 w-7 text-vin-faint" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-vin-text2">Chưa chọn ca chụp</h3>
            <p className="max-w-[250px] text-sm leading-relaxed text-vin-muted">
              Click vào ca chụp bên trái để viết kết quả. Double-click để mở OHIF Viewer.
            </p>
          </div>
        ) : isReportLoading ? (
          <div className="flex h-full flex-col items-center justify-center bg-vin-panel">
            <Loader2 className="mb-2 h-5 w-5 animate-spin text-vin-accent" />
            <span className="text-sm text-vin-muted">Đang tải thông tin ca chụp...</span>
          </div>
        ) : (
          <>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="truncate text-sm font-bold uppercase tracking-wide text-white">{patientName}</h2>
                  <p className="mt-1 text-sm text-vin-muted">
                    {patientId} · {fmtSex(selectedPatient.PatientSex)} · {patientAge}T
                  </p>
                </div>
                <RisStatusBadge status={studyStatus} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
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
                <div className="mt-2 rounded border border-vin-border/70 bg-vin-shell/60 px-3 py-2 text-sm leading-relaxed text-vin-text2">
                  <span className="font-bold uppercase tracking-wide text-vin-muted">Lam sang: </span>
                  {clinicalDisplay}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-vin-text2">Mô tả (Findings)</label>
                  <span className="rounded bg-vin-shell px-2 py-0.5 font-mono text-sm text-vin-muted">Paste/Drop ảnh</span>
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
                <label className="mb-2 block text-sm font-semibold text-vin-text2">Kết luận (Conclusion)</label>
                <textarea
                  value={conclusion}
                  onChange={event => setConclusion(event.target.value)}
                  className="h-24 w-full resize-none rounded-lg border border-vin-border bg-vin-shell p-3 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent"
                  placeholder="Nhập kết luận..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-vin-text2">Đề nghị (Recommendation)</label>
                <textarea
                  value={recommendation}
                  onChange={event => setRecommendation(event.target.value)}
                  className="h-20 w-full resize-none rounded-lg border border-vin-border bg-vin-shell p-3 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent"
                  placeholder="Nhập đề nghị..."
                />
              </div>
            </div>

            <div className="flex flex-none items-center justify-between border-t border-vin-border bg-vin-panel2 px-4 py-3">
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 rounded-lg border border-vin-border bg-vin-shell px-3 py-1.5 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                In phiếu
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave("DRAFT")}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg border border-vin-border bg-vin-shell px-3 py-1.5 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  Lưu nháp
                </button>
                <button
                  onClick={() => handleSave("FINAL")}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg border-0 bg-vin-accent px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
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
    </AppShell>
  );
}

export function WorkspaceAntd() {
  return (
    <Suspense fallback={<div className="p-4 text-white">Đang tải cấu hình...</div>}>
      <WorkspaceDirtyProvider>
        <DashboardPageContent />
        <UnsavedChangesDialogAntd />
      </WorkspaceDirtyProvider>
    </Suspense>
  );
}
