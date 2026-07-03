export type ArchiveSearchFilters = {
  patientName?: string;
  patientId?: string;
  accessionNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  modality?: string;
  doctorId?: string;
  status?: string;
};

export type ArchiveDoctorOption = {
  id: string;
  name: string;
};

export type ArchiveStudyRow = {
  id: string;
  studyInstanceUid: string;
  reportStatus: string;
  studyStatus: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  bodyPart: string;
  studyDescription: string;
  studyDate: string | null;
  finalizedAt: string | null;
  deliveredAt: string | null;
  doctorName: string;
  doctorId: string;
  canOpenViewer: boolean;
  imageWarning: string;
};

export type ArchiveReportDetail = ArchiveStudyRow & {
  findings: string;
  conclusion: string;
  recommendation: string;
  templateHtml: string;
  clinicProfile: Record<string, string>;
  doctorPrintInfo: Record<string, string>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    source: string;
    createdAt: string;
  }>;
};

export const finalReportStatuses = ["FINAL"] as const;

export const archiveStudyStatuses = [
  "FINALIZED",
  "DELIVERED",
  "ARCHIVED",
  "DELETED_FROM_PACS",
] as const;
