import type { PermissionKey } from "@/lib/permissions";
import { MACHINE_ACTION_KEYS } from "../machine-action-keys";

// Compose registry from existing machine keys and add new ones
export const SCOPE_CAPABILITIES = [
  ...MACHINE_ACTION_KEYS,
  "READ_REPORT",
  "CREATE_CONSULT",
] as const;

export type ScopeCapability = typeof SCOPE_CAPABILITIES[number];

/**
 * Maps each capability to the underlying global permission required.
 * Without the global permission, the scope grant is meaningless.
 */
export const CAPABILITY_TO_GLOBAL_PERMISSION: Record<ScopeCapability, PermissionKey> = {
  READ_STUDY: "studies.read",
  EDIT_CLINICAL: "studies.updateClinical",
  ASSIGN_CASE: "studies.assign",
  DRAFT_REPORT: "reports.write",
  SIGN_REPORT: "reports.finalize",
  APPROVE_REPORT: "reports.finalize",
  UNFINALIZE_REPORT: "reports.unfinalize",
  CANCEL_DRAFT: "reports.cancelDraft",
  DELIVER_RESULT: "archive.deliver",
  SYNC_HIS: "his.sync",
  READ_REPORT: "reports.read",
  CREATE_CONSULT: "consult.create",
};

export const CAPABILITY_LABELS: Record<ScopeCapability, string> = {
  READ_STUDY: "Xem danh sách và ảnh ca chụp",
  EDIT_CLINICAL: "Sửa thông tin lâm sàng/chỉ định",
  ASSIGN_CASE: "Phân công bác sĩ",
  DRAFT_REPORT: "Viết nháp kết quả",
  SIGN_REPORT: "Ký duyệt kết quả",
  APPROVE_REPORT: "Duyệt kết quả (Senior)",
  UNFINALIZE_REPORT: "Hủy duyệt/Mở lại kết quả",
  CANCEL_DRAFT: "Hủy phiếu đọc",
  DELIVER_RESULT: "Trả kết quả",
  SYNC_HIS: "Đồng bộ HIS",
  READ_REPORT: "Xem kết quả",
  CREATE_CONSULT: "Tạo hội chẩn",
};
