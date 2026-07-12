export const statusLabels: Record<string, string> = {
  REQUESTED: "Đã yêu cầu",
  ACTIVE: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

export const statusClasses: Record<string, string> = {
  REQUESTED: "bg-vin-status-new-bg text-white",
  ACTIVE: "bg-indigo-500 text-white",
  COMPLETED: "bg-vin-status-approved-bg text-white",
  CANCELLED: "bg-vin-status-danger-bg text-white",
};

export interface ConsultationView {
  id: string;
  title: string;
  status: string;
  description?: string;
  createdAt: string | Date;
  createdByUser: { fullName?: string; username?: string };
  participants: Array<{
    id?: string;
    userId?: string;
    status?: string;
  }>;
}
