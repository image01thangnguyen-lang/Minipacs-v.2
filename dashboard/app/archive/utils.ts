export const studyStatusLabels: Record<string, string> = {
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ARCHIVED: "Lưu trữ",
  DELETED_FROM_PACS: "Đã xóa ảnh",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  REPORTED: "Đã có báo cáo",
};

export const reportStatusLabels: Record<string, string> = {
  PENDING_APPROVAL: "Chờ duyệt",
  DRAFT: "Nháp",
  FINAL: "Đã duyệt",
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

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

export function statusClass(status: string) {
  if (status === "DELIVERED" || status === "FINALIZED") return "bg-vin-status-approved-bg text-white";
  if (status === "ARCHIVED") return "bg-vin-accentSoft text-white";
  if (status === "DELETED_FROM_PACS") return "bg-vin-status-danger-bg text-white";
  return "bg-vin-status-new-bg text-white";
}
