import { ImagingStudy, WorklistOrder, FacilityUnit, Report, NonDicomExam } from "@prisma/client";
import { WorklistRow } from "./contract";

export type PopulatedStudy = ImagingStudy & {
  order: WorklistOrder | null;
  performingUnit: FacilityUnit | null;
  nonDicomExam: NonDicomExam | null;
  reports: Report[];
};

export type UserDictionary = Record<string, string>;

/**
 * Calculates the SLA status for a study (just for UI).
 */
function calculateSlaStatus(study: { status: string; createdAt: Date }) {
  if (study.status === "FINALIZED" || study.status === "DELIVERED") return "COMPLETED";
  if (!study.createdAt) return "NORMAL";
  const hoursSince = (Date.now() - study.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSince > 24) return "VIOLATED";
  if (hoursSince > 12) return "WARNING";
  return "NORMAL";
}

function calculateAgeAtStudy(dob?: Date | null, studyDate?: Date | null): number | undefined {
  if (!dob || !studyDate) return undefined;

  let age = studyDate.getFullYear() - dob.getFullYear();
  const m = studyDate.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && studyDate.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 0 ? age : undefined;
}

export function mapStudyToWorklistRow(
  study: PopulatedStudy,
  allowedActions: Record<string, boolean>,
  usersMap: UserDictionary
): WorklistRow {
  const allowedActionsList = Object.entries(allowedActions || {})
    .filter(([_, allowed]) => allowed)
    .map(([key]) => key);

  const latestReport = study.reports?.[0];

  // Time processing
  const receivedAt = study.receivedAt?.toISOString() || study.createdAt.toISOString(); // Fallback for stability
  const studyDateObj = study.scanStartedAt || study.receivedAt;
  const studyDate = studyDateObj?.toISOString() || receivedAt;

  // Patient info
  const dob = study.order?.dob;
  const ageAtStudy = calculateAgeAtStudy(dob, studyDateObj);

  return {
    id: study.id,
    studyInstanceUid: study.studyInstanceUid,
    orderId: study.orderId || undefined,

    // Display fields
    patientName: study.patientName || "Unknown",
    patientId: study.patientId || "Unknown",
    accessionNumber: study.accessionNumber || "Unknown",
    modality: study.modality || "Unknown",
    bodyPart: study.bodyPart || study.order?.bodyPart || undefined,
    procedureDescription: study.procedureDescription || study.order?.procedureDescription || undefined,
    // clinicalInfo is intentionally not exposed as diagnosis until its
    // clinical semantics are confirmed by the product owner.
    priority: study.priority || "NORMAL",
    status: study.status,

    // Patient details
    patientBirthDate: dob?.toISOString() || undefined,
    patientSex: study.order?.gender || undefined,
    ageAtStudy: ageAtStudy,

    // Time fields
    createdAt: study.createdAt.toISOString(),
    studyDate,
    scheduledAt: study.scheduledAt?.toISOString() || study.order?.scheduledDate?.toISOString(),
    receivedAt,
    finalizedAt: latestReport?.finalizedAt?.toISOString(),

    // Facility / Equipment
    performingUnitId: study.performingUnitId || undefined,
    facilityName: study.performingUnit?.name || undefined,
    machineName: study.stationAeTitle || undefined, // Fallback to AE title
    stationAeTitle: study.stationAeTitle || undefined,
    referringDepartment: study.order?.referringDepartment || undefined,
    referringPhysician: study.order?.referringPhysician || undefined,

    // People
    assignedDoctorId: study.assignedDoctorId || undefined,
    assignedDoctorName: study.assignedDoctorId ? usersMap[study.assignedDoctorId] : undefined,
    technologistName: study.technologistId ? usersMap[study.technologistId] : undefined,

    // Integration
    hisSyncStatus: study.hisSyncStatus || undefined,

    // Authorization
    allowedActions: allowedActionsList,

    // UI Helpers
    isNonDicom: !!study.nonDicomExam,
    nonDicomExamId: study.nonDicomExam?.id,
    slaStatus: calculateSlaStatus(study)
  };
}
