export type StatisticsFilters = {
  dateFrom?: string;
  dateTo?: string;
};

export type StatisticsKpis = {
  studiesInPeriod: number;
  readyToRead: number;
  readingOrDraft: number;
  finalizedInPeriod: number;
  deliveredInPeriod: number;
  qcIssues: number;
  averageReceivedToFinalizedMinutes: number | null;
};

export type StatisticsStatusCount = {
  status: string;
  label: string;
  count: number;
};

export type StatisticsModalityCount = {
  modality: string;
  count: number;
  percent: number;
};

export type StatisticsDoctorRow = {
  doctorId: string;
  doctorName: string;
  finalInPeriod: number;
  finalThisMonth: number;
  draftCount: number;
};

export type StatisticsQueueRow = {
  id: string;
  studyInstanceUid: string;
  accessionNumber: string;
  patientName: string;
  patientId: string;
  modality: string;
  studyDescription: string;
  status: string;
  priority: string;
  waitingMinutes: number;
  waitingSince: string | null;
};

export type StatisticsStorage = {
  available: boolean;
  patients: number;
  studies: number;
  series: number;
  instances: number;
  diskSizeMb: number;
  uncompressedSizeMb: number;
  warningLevel: "normal" | "warning" | "critical" | "unknown";
  message: string;
};

export type StatisticsPayload = {
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  role: string;
  canViewDoctorStats: boolean;
  kpis: StatisticsKpis;
  statusCounts: StatisticsStatusCount[];
  modalityCounts: StatisticsModalityCount[];
  doctorRows: StatisticsDoctorRow[];
  pendingQueue: StatisticsQueueRow[];
  storage: StatisticsStorage;
};
