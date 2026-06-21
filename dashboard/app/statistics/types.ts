export type StatisticsFilters = {
  dateFrom?: string;
  dateTo?: string;
  drilldown?: string;
  drilldownValue?: string;
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

export type StatisticsDoctorOption = {
  id: string;
  name: string;
};

export type StatisticsWorkloadDoctorRow = {
  doctorId: string;
  doctorName: string;
  assignedActive: number;
  readyToRead: number;
  reading: number;
  draftReports: number;
  finalizedInPeriod: number;
  averageTatMinutes: number | null;
  p90TatMinutes: number | null;
  slaBreaches: number;
};

export type StatisticsWorkloadQueueRow = {
  id: string;
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  studyDescription: string;
  status: string;
  statusLabel: string;
  priority: string;
  stationAeTitle: string;
  assignedDoctorId: string | null;
  assignedDoctorName: string;
  waitingMinutes: number;
  href: string;
};

export type StatisticsWorkload = {
  canManageAssignments: boolean;
  currentDoctorOnly: boolean;
  doctors: StatisticsDoctorOption[];
  rows: StatisticsWorkloadDoctorRow[];
  queue: StatisticsWorkloadQueueRow[];
  unassignedCount: number;
  totalAssignedActive: number;
};

export type StatisticsAlertRow = {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string | null;
  studyInstanceUid: string | null;
  patientName: string | null;
  priority: string | null;
  ageMinutes: number;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  href: string;
};

export type StatisticsAlerts = {
  canManageAlerts: boolean;
  open: number;
  acknowledged: number;
  critical: number;
  rows: StatisticsAlertRow[];
};

export type StatisticsStorage = {
  available: boolean;
  patients: number;
  studies: number;
  series: number;
  instances: number;
  diskSizeMb: number;
  uncompressedSizeMb: number;
  growthMbPerDay: number | null;
  forecastDays: number | null;
  latestSnapshotAt: string | null;
  warningLevel: "normal" | "warning" | "critical" | "unknown";
  message: string;
};

export type StatisticsPacsNodeHealthRow = {
  id: string;
  name: string;
  aeTitle: string;
  modality: string;
  room: string;
  orthancAlias: string;
  echoStatus: string;
  echoMessage: string;
  lastEchoAt: string | null;
  minutesSinceLastEcho: number | null;
  lastStudyReceivedAt: string | null;
  minutesSinceLastStudy: number | null;
  warningLevel: "normal" | "warning" | "critical" | "unknown";
};

export type StatisticsPacsLastReceivedRow = {
  modality: string;
  stationAeTitle: string;
  studyCount: number;
  lastReceivedAt: string | null;
  minutesSinceLastStudy: number | null;
  warningLevel: "normal" | "warning" | "critical" | "unknown";
};

export type StatisticsPacsMetadataIssueRow = {
  id: string;
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  stationAeTitle: string;
  issue: string;
  href: string;
};

export type StatisticsPacsDuplicateAccessionRow = {
  accessionNumber: string;
  count: number;
  patientNames: string;
  modalities: string;
};

export type StatisticsPacsHealth = {
  system: {
    orthancOnline: boolean;
    version: string;
    dicomAet: string;
    dicomPort: number | null;
    message: string;
  };
  nodes: StatisticsPacsNodeHealthRow[];
  lastReceivedByModality: StatisticsPacsLastReceivedRow[];
  metadataIssues: {
    missingPatientId: number;
    missingAccession: number;
    missingModality: number;
    duplicateAccessions: number;
    rows: StatisticsPacsMetadataIssueRow[];
    duplicateRows: StatisticsPacsDuplicateAccessionRow[];
  };
  storageForecast: {
    growthMbPerDay: number | null;
    forecastDays: number | null;
    warningLevel: "normal" | "warning" | "critical" | "unknown";
  };
};

export type StatisticsQualityReasonRow = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type StatisticsQualityStudyRow = {
  id: string;
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  stationAeTitle: string;
  status: string;
  reason: string;
  createdAt: string | null;
  href: string;
};

export type StatisticsCriticalResultRow = {
  id: string;
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  severity: string;
  communicationStatus: string;
  finding: string;
  createdAt: string;
  communicatedAt: string | null;
  href: string;
};

export type StatisticsDoseOutlierRow = {
  id: string;
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  metricType: string;
  value: number;
  unit: string;
  threshold: number | null;
  createdAt: string;
  href: string;
};

export type StatisticsQualityBreakdownRow = {
  key: string;
  label: string;
  count: number;
  rate: number;
};

export type StatisticsQualitySafety = {
  kpis: {
    qcEvents: number;
    qcRejected: number;
    qcRejectRate: number;
    repeatStudyRate: number;
    missingCriticalData: number;
    criticalPending: number;
    addendumCount: number;
    addendumRate: number;
    doseOutliers: number | null;
  };
  qcReasons: StatisticsQualityReasonRow[];
  qcRecent: StatisticsQualityStudyRow[];
  missingCriticalDataRows: StatisticsQualityStudyRow[];
  criticalResults: StatisticsCriticalResultRow[];
  doseOutliers: StatisticsDoseOutlierRow[];
  addendumByDoctor: StatisticsQualityBreakdownRow[];
  addendumByModality: StatisticsQualityBreakdownRow[];
};

export type StatisticsBusinessBreakdownRow = {
  key: string;
  label: string;
  count: number;
  percent: number;
  cancelled: number;
  noShow: number;
  estimatedRevenue: number | null;
};

export type StatisticsProcedureMixRow = {
  code: string;
  label: string;
  modality: string;
  count: number;
  percent: number;
  estimatedRevenue: number | null;
};

export type StatisticsBusinessTrendRow = {
  date: string;
  studyCount: number;
  orderCount: number;
  estimatedRevenue: number | null;
};

export type StatisticsBusinessAnalytics = {
  kpis: {
    ordersInPeriod: number;
    studiesInPeriod: number;
    referringSources: number;
    departments: number;
    noShow: number;
    cancelled: number;
    estimatedRevenue: number | null;
  };
  byReferringPhysician: StatisticsBusinessBreakdownRow[];
  byDepartment: StatisticsBusinessBreakdownRow[];
  bySourceFacility: StatisticsBusinessBreakdownRow[];
  modalityMix: StatisticsBusinessBreakdownRow[];
  procedureMix: StatisticsProcedureMixRow[];
  dailyTrend: StatisticsBusinessTrendRow[];
};

export type StatisticsDrilldownRow = {
  id: string;
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  status: string;
  statusLabel: string;
  priority: string;
  stationAeTitle: string;
  referringPhysician: string;
  sourceFacility: string;
  procedureCode: string;
  procedureDescription: string;
  scheduledAt: string | null;
  receivedAt: string | null;
  finalizedAt: string | null;
  href: string;
};

export type StatisticsDrilldown = {
  activeFilter: string;
  activeValue: string;
  title: string;
  rows: StatisticsDrilldownRow[];
  total: number;
  csvUrl: string;
};

export type StatisticsFilterPreset = {
  id: string;
  name: string;
  filters: StatisticsFilters;
  isShared: boolean;
  createdAt: string;
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
  workload: StatisticsWorkload;
  alerts: StatisticsAlerts;
  storage: StatisticsStorage;
  pacsHealth: StatisticsPacsHealth;
  qualitySafety: StatisticsQualitySafety;
  business: StatisticsBusinessAnalytics;
  drilldown: StatisticsDrilldown;
  filterPresets: StatisticsFilterPreset[];
};
