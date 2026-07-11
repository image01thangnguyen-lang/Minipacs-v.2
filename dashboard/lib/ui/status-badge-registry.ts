import type { StatusBadgeDomain } from "../../app/components/ui/shared-contracts";

export type StatusDefinition = Readonly<{ label: string; className: string }>;
type StatusRegistry = Readonly<Record<string, StatusDefinition>>;

const neutral = "border-vin-border bg-vin-panel2 text-vin-text2";
const info = "border-vin-accent/40 bg-vin-accentSoft/20 text-vin-text";
const warning = "border-vin-borderStrong bg-vin-status-warning-bg text-vin-text";
const danger = "border-vin-borderStrong bg-vin-status-danger-bg text-vin-text";
const success = "border-vin-borderStrong bg-vin-status-approved-bg text-vin-status-approved-text";

const studyStatusRegistry: StatusRegistry = {
  ORDERED: { label: "Chờ chụp", className: neutral }, READY_FOR_SCAN: { label: "Sẵn sàng chụp", className: neutral },
  IN_PROGRESS: { label: "Đang chụp", className: info }, RECEIVED: { label: "Đã nhận ảnh", className: info },
  STABLE: { label: "Ảnh ổn định", className: info }, NEEDS_QC: { label: "Cần QC", className: warning },
  QC_REJECTED: { label: "Chụp lại", className: danger }, READY_TO_READ: { label: "Chờ đọc", className: info },
  READING: { label: "Đang đọc", className: warning }, REPORTED: { label: "Đã có báo cáo", className: warning },
  FINALIZED: { label: "Đã ký", className: success }, DELIVERED: { label: "Đã trả", className: success },
  ARCHIVED: { label: "Lưu trữ", className: neutral }, DELETED_FROM_PACS: { label: "Đã xóa ảnh", className: danger },
  ERROR: { label: "Lỗi", className: danger },
};

const adminCatalogRegistry: StatusRegistry = {
  ACTIVE: { label: "Kích hoạt", className: success },
  INACTIVE: { label: "Tạm ngưng", className: neutral },
};

const registries: Partial<Record<StatusBadgeDomain, StatusRegistry>> = {
  study: studyStatusRegistry,
  admin: adminCatalogRegistry,
  catalog: adminCatalogRegistry,
};

export function resolveStatusBadge(domain: StatusBadgeDomain, status: string): StatusDefinition {
  const normalized = status.trim().toUpperCase();
  return registries[domain]?.[normalized] ?? {
    label: normalized || "Không xác định",
    className: neutral,
  };
}