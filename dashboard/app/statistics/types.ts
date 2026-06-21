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

export type StatisticsOperationKpis = {
  scheduled: number;
  arrived: number;
  readyForScan: number;
  received: number;
  readyToRead: number;
  reading: number;
  finalized: number;
  delivered: number;
  slaBreaches: number;
  stuckWorkflow: number;
};

export type StatisticsOperationRow = {
  id: string;
  studyInstanceUid: string;
  accessionNumber: string;
  patientName: string;
  patientId: string;
  modality: string;
  studyDescription: string;
  status: string;
  statusLabel: string;
  priority: string;
  stationAeTitle: string;
  waitingMinutes: number;
  waitingSince: string | null;
  reason: string;
  href: string;
};

export type StatisticsOperations = {
  generatedAt: string;
  autoRefreshSeconds: number;
  kpis: StatisticsOperationKpis;
  slaBreaches: StatisticsOperationRow[];
  stuckWorkflow: StatisticsOperationRow[];
  liveQueue: StatisticsOperationRow[];
};

export type StatisticsDurationSummary = {
  key: string;
  label: string;
  targetMinutes: number | null;
  count: number;
  averageMinutes: number | null;
  p50Minutes: number | null;
  p90Minutes: number | null;
  p95Minutes: number | null;
  breachCount: number;
  breachRate: number;
};

export type StatisticsTrendPoint = {
  date: string;
  count: number;
  averageTatMinutes: number | null;
  p90TatMinutes: number | null;
  breachRate: number;
};

export type StatisticsBreakdownRow = {
  key: string;
  label: string;
  count: number;
  averageTatMinutes: number | null;
  p90TatMinutes: number | null;
  breachCount: number;
  breachRate: number;
};

export type StatisticsPerformanceOutlier = {
  id: string;
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  priority: string;
  stationAeTitle: string;
  turnaroundMinutes: number;
  thresholdMinutes: number;
  finalizedAt: string | null;
  href: string;
};

export type StatisticsPerformance = {
  segments: StatisticsDurationSummary[];
  dailyTrend: StatisticsTrendPoint[];
  modalityBreakdown: StatisticsBreakdownRow[];
  priorityBreakdown: StatisticsBreakdownRow[];
  outliers: StatisticsPerformanceOutlier[];
};

export type StatisticsUtilizationKpis = {
  totalStudies: number;
  activeRooms: number;
  noShow: number;
  cancelled: number;
  qcRejected: number;
  estimatedBusyMinutes: number;
  estimatedUtilizationPercent: number | null;
  peakHour: string;
};

export type StatisticsRoomUtilizationRow = {
  stationAeTitle: string;
  roomName: string;
  modality: string;
  studyCount: number;
  scheduledCount: number;
  finalizedCount: number;
  qcRejectedCount: number;
  noShowCount: number;
  cancelledCount: number;
  averageScanMinutes: number | null;
  estimatedBusyMinutes: number;
  utilizationPercent: number | null;
  lastActivityAt: string | null;
};

export type StatisticsHourlyUtilizationRow = {
  hour: number;
  label: string;
  studyCount: number;
  scheduledCount: number;
  arrivedCount: number;
  finalizedCount: number;
  busyMinutes: number;
};

export type StatisticsUtilization = {
  kpis: StatisticsUtilizationKpis;
  rooms: StatisticsRoomUtilizationRow[];
  hourly: StatisticsHourlyUtilizationRow[];
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
  operations: StatisticsOperations;
  performance: StatisticsPerformance;
  utilization: StatisticsUtilization;
  storage: StatisticsStorage;
};
