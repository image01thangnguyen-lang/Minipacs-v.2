export type WorklistOrderView = {
  id: string;
  patientName: string;
  patientId: string;
  dob?: string | null;
  gender?: string;
  phone?: string;
  referringPhysician?: string;
  referringDepartment?: string;
  sourceFacility?: string;
  modality: string;
  bodyPart?: string;
  procedureCode?: string;
  procedureName?: string;
  procedureDescription?: string;
  serviceTypeName?: string;
  clinicalInfo?: string;
  technologistId?: string;
  technologistName?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  reportDoctorId?: string;
  reportDoctorName?: string;
  reportStatus?: string;
  price?: number | null;
  paymentStatus?: string;
  priority: string;
  scheduledStationAeTitle?: string;
  scheduledStationName?: string;
  accessionNumber: string;
  requestedStudyInstanceUid?: string;
  scheduledDate?: string | null;
  arrivedAt?: string | null;
  cancelledAt?: string | null;
  notes?: string;
  orderStatus: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  studyStatus?: string | null;
  orthancStudyId?: string | null;
  studyInstanceUid?: string;
  isDicomMatched?: boolean;
  noDicomOverdue?: boolean;
  waitingMinutes?: number | null;
  waitingSince?: string | null;
  stationAeTitle?: string;
  machineName?: string;
  facilityName?: string;
  room?: string;
  hisSyncStatus?: string | null;
  hisResultStatus?: string | null;
  hisLastError?: string | null;
  hisLastSyncedAt?: string | null;
  hisLastResultSentAt?: string | null;
  hisOrderId?: string | null;
  isNonDicomEligible: boolean;
  isNonDicom: boolean;
  nonDicomExamId: string | null;
  allowedActions?: Record<string, boolean>;
};

export const orderStatusLabels: Record<string, string> = {
  REQUESTED: "Mới tạo",
  SCHEDULED: "Đã hẹn",
  ARRIVED: "Đã đến",
  CANCELLED: "Đã hủy",
  EXPIRED: "Quá hạn",
};

export const studyStatusLabels: Record<string, string> = {
  ORDERED: "Chờ chụp",
  READY_FOR_SCAN: "Sẵn sàng chụp",
  RECEIVED: "Đã nhận ảnh",
  STABLE: "Ảnh ổn định",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ERROR: "Lỗi",
};

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDuration(minutes?: number | null) {
  if (minutes === null || minutes === undefined) return "-";
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}p` : `${hours}h`;
}

export function statusClass(status: string) {
  if (status === "ARRIVED") return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
  if (status === "SCHEDULED") return "border-cyan-400/35 bg-cyan-500/15 text-cyan-100";
  if (status === "CANCELLED" || status === "EXPIRED") return "border-red-400/35 bg-red-500/15 text-red-100";
  return "border-white/10 bg-white/5 text-vin-text2";
}

export function priorityClass(priority: string) {
  if (priority === "STAT") return "border-red-400/35 bg-red-500/15 text-red-100";
  if (priority === "URGENT") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  return "border-white/10 bg-white/5 text-vin-muted";
}
