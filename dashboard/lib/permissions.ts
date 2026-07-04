export const systemRoles = ["ADMIN", "DOCTOR", "TECHNICIAN", "RECEPTION"] as const;

export type SystemRole = (typeof systemRoles)[number];
export type AppRole = SystemRole;

export const permissionKeys = [
  "studies.read",
  "studies.assign",
  "studies.updateClinical",
  "reports.read",
  "reports.write",
  "reports.finalize",
  "reports.cancelDraft",
  "reports.unfinalize",
  "reports.print",
  "worklist.manage",
  "archive.read",
  "archive.deliver",
  "statistics.read",
  "statistics.doctorStats",
  "users.manage",
  "templates.manage",
  "clinic.manage",
  "pacs.manage",
  "his.read",
  "his.sync",
  "his.retry",
  "his.manage",
  "his.apiLogs",
  "his.apiTest",
  "his.mapping",
  "his.conflictReview",
  "admin.catalogs",
  "admin.facilities",
  "admin.permissions",
  "admin.storage",
  "viewer.configure",
  "viewer.export",
  "viewer.anonymize",
  "viewer.history",
  "viewer.deleteSeries",
  "nonDicom.read",
  "nonDicom.create",
  "nonDicom.capture",
  "nonDicom.edit",
  "nonDicom.deleteMedia",
  "nonDicom.copyMedia",
  "nonDicom.print",
  "nonDicom.video",
  "share.manage",
  "share.read",
  "share.create",
  "share.revoke",
  "consult.manage",
  "consult.read",
  "consult.create",
  "consult.invite",
  "consult.start",
  "consult.message",
  "consult.finish",
  "consult.cancel",
  "consult.admin",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

export const roleLabels: Record<SystemRole, string> = {
  ADMIN: "Admin",
  DOCTOR: "Bác sĩ",
  TECHNICIAN: "Kỹ thuật viên",
  RECEPTION: "Lễ tân",
};

export const roleDescriptions: Record<SystemRole, string> = {
  ADMIN: "Toàn quyền cấu hình hệ thống, PACS, người dùng và dữ liệu vận hành.",
  DOCTOR: "Đọc phim, soạn/ký báo cáo, quản lý mẫu cá nhân và xem thống kê chuyên môn.",
  TECHNICIAN: "Theo dõi danh sách ca, tiếp nhận/worklist và xử lý vận hành kỹ thuật.",
  RECEPTION: "Tạo order, check-in, tìm/in lại kết quả và xem thống kê vận hành cơ bản.",
};

export const permissionLabels: Record<PermissionKey, string> = {
  "studies.read": "Xem danh sách ca chụp",
  "studies.assign": "Gán bác sĩ đọc cho ca",
  "studies.updateClinical": "Cập nhật thông tin lâm sàng",
  "reports.read": "Mở phiếu báo cáo",
  "reports.write": "Lưu nháp báo cáo",
  "reports.finalize": "Duyệt/ký kết quả",
  "reports.cancelDraft": "Hủy phiếu nháp",
  "reports.unfinalize": "Hủy duyệt/sửa sau final",
  "reports.print": "In phiếu/xuất PDF",
  "worklist.manage": "Tạo và cập nhật Worklist",
  "archive.read": "Tra cứu Archive và in lại",
  "archive.deliver": "Ghi nhận đã trả kết quả",
  "statistics.read": "Xem dashboard thống kê",
  "statistics.doctorStats": "Xem thống kê theo bác sĩ",
  "users.manage": "Quản lý người dùng và phân quyền",
  "templates.manage": "Quản lý mẫu báo cáo",
  "clinic.manage": "Cấu hình thông tin phòng khám",
  "pacs.manage": "Quản trị PACS/DICOM nodes",
  "his.read": "Xem trạng thái đồng bộ HIS",
  "his.sync": "Đồng bộ HIS",
  "his.retry": "Thử lại đồng bộ HIS",
  "his.manage": "Cấu hình HIS",
  "his.apiLogs": "Xem API call log chi tiết",
  "his.apiTest": "Dùng API Explorer Try request",
  "his.mapping": "Quản lý field mapping",
  "his.conflictReview": "Xử lý conflict HIS",
  "admin.catalogs": "Quản lý danh mục",
  "admin.facilities": "Quản lý phòng ban/cơ sở",
  "admin.permissions": "Quản lý phân quyền chi tiết",
  "admin.storage": "Quản lý lưu trữ/backup",
  "viewer.configure": "Cấu hình Viewer",
  "viewer.export": "Xuất/tải dữ liệu Viewer",
  "viewer.anonymize": "Ẩn danh dữ liệu",
  "viewer.history": "Xem lịch sử tác vụ",
  "viewer.deleteSeries": "Yêu cầu xóa Series",
  "nonDicom.read": "Xem danh sách ca Non-DICOM",
  "nonDicom.create": "Tạo ca Non-DICOM",
  "nonDicom.capture": "Chụp/Tải ảnh Non-DICOM",
  "nonDicom.edit": "Sửa thông tin ca Non-DICOM",
  "nonDicom.deleteMedia": "Xóa/Hủy media",
  "nonDicom.copyMedia": "Sao chép media giữa các ca",
  "nonDicom.print": "In/Xuất media Non-DICOM",
  "nonDicom.video": "Ghi/Quản lý video",
  "share.manage": "Quản lý toàn bộ link chia sẻ",
  "share.read": "Xem danh sách link chia sẻ",
  "share.create": "Tạo link chia sẻ",
  "share.revoke": "Thu hồi link chia sẻ",
  "consult.manage": "Quản lý hội chẩn chung",
  "consult.read": "Xem danh sách hội chẩn",
  "consult.create": "Tạo yêu cầu hội chẩn",
  "consult.invite": "Mời người tham gia hội chẩn",
  "consult.start": "Bắt đầu hội chẩn",
  "consult.message": "Gửi tin nhắn hội chẩn",
  "consult.finish": "Kết thúc hội chẩn",
  "consult.cancel": "Hủy hội chẩn",
  "consult.admin": "Quản trị hội chẩn (toàn quyền)",
};

export const permissionGroups: Array<{ title: string; permissions: PermissionKey[] }> = [
  {
    title: "Lâm sàng",
    permissions: ["studies.read", "studies.assign", "studies.updateClinical", "reports.read", "reports.write", "reports.finalize", "reports.cancelDraft", "reports.unfinalize", "reports.print"],
  },
  {
    title: "Tiếp đón & trả kết quả",
    permissions: ["worklist.manage", "archive.read", "archive.deliver"],
  },
  {
    title: "Quản trị & thống kê",
    permissions: ["statistics.read", "statistics.doctorStats", "users.manage", "templates.manage", "clinic.manage", "pacs.manage", "admin.catalogs", "admin.facilities", "admin.permissions", "admin.storage"],
  },
  {
    title: "Tích hợp HIS",
    permissions: ["his.read", "his.sync", "his.retry", "his.manage", "his.apiLogs", "his.apiTest", "his.mapping", "his.conflictReview"],
  },
  {
    title: "Viewer & Hình ảnh",
    permissions: ["viewer.configure", "viewer.export", "viewer.anonymize", "viewer.history", "viewer.deleteSeries"],
  },
  {
    title: "Non-DICOM Capture",
    permissions: [
      "nonDicom.read",
      "nonDicom.create",
      "nonDicom.capture",
      "nonDicom.edit",
      "nonDicom.deleteMedia",
      "nonDicom.copyMedia",
      "nonDicom.print",
      "nonDicom.video"
    ],
  },
  {
    title: "Chia sẻ & Hội chẩn",
    permissions: [
      "share.manage", "share.read", "share.create", "share.revoke",
      "consult.manage", "consult.read", "consult.create", "consult.invite",
      "consult.start", "consult.message", "consult.finish", "consult.cancel", "consult.admin"
    ],
  },
];

export const rolePermissions: Record<SystemRole, PermissionKey[]> = {
  ADMIN: [
    "studies.read",
    "studies.assign",
    "studies.updateClinical",
    "reports.read",
    "reports.write",
    "reports.finalize",
    "reports.cancelDraft",
    "reports.unfinalize",
    "reports.print",
    "worklist.manage",
    "archive.read",
    "archive.deliver",
    "statistics.read",
    "statistics.doctorStats",
    "users.manage",
    "templates.manage",
    "clinic.manage",
    "pacs.manage",
    "his.read",
    "his.sync",
    "his.retry",
    "his.manage",
    "his.apiLogs",
    "his.apiTest",
    "his.mapping",
    "his.conflictReview",
    "admin.catalogs",
    "admin.facilities",
    "admin.permissions",
    "admin.storage",
    "viewer.configure",
    "viewer.export",
    "viewer.anonymize",
    "viewer.history",
    "viewer.deleteSeries",
    "nonDicom.read",
    "nonDicom.create",
    "nonDicom.capture",
    "nonDicom.edit",
    "nonDicom.deleteMedia",
    "nonDicom.copyMedia",
    "nonDicom.print",
    "nonDicom.video",
    "share.manage",
    "share.read",
    "share.create",
    "share.revoke",
    "consult.manage",
    "consult.read",
    "consult.create",
    "consult.invite",
    "consult.start",
    "consult.message",
    "consult.finish",
    "consult.cancel",
    "consult.admin",
  ],
  DOCTOR: [
    "studies.read",
    "studies.updateClinical",
    "reports.read",
    "reports.write",
    "reports.finalize",
    "reports.cancelDraft",
    "reports.print",
    "archive.read",
    "statistics.read",
    "statistics.doctorStats",
    "templates.manage",
    "his.read",
    "his.sync",
    "his.retry",
    "viewer.configure",
    "viewer.export",
    "viewer.history",
    "viewer.anonymize",
    "nonDicom.read",
    "nonDicom.capture",
    "nonDicom.copyMedia",
    "nonDicom.print",
    "nonDicom.video",
    "share.read",
    "share.create",
    "share.revoke",
    "consult.read",
    "consult.create",
    "consult.invite",
    "consult.start",
    "consult.message",
    "consult.finish",
    "consult.cancel",
  ],
  TECHNICIAN: [
    "studies.read",
    "studies.assign",
    "studies.updateClinical",
    "worklist.manage",
    "archive.read",
    "statistics.read",
    "his.read",
    "his.sync",
    "his.retry",
    "viewer.configure",
    "viewer.export",
    "viewer.anonymize",
    "viewer.history",
    "nonDicom.read",
    "nonDicom.create",
    "nonDicom.capture",
    "nonDicom.edit",
    "nonDicom.deleteMedia",
    "nonDicom.copyMedia",
    "nonDicom.print",
    "nonDicom.video",
    "share.read",
    "share.create",
    "share.revoke",
    "consult.read",
    "consult.create",
    "consult.invite",
    "consult.start",
    "consult.message",
    "consult.finish",
    "consult.cancel",
  ],
  RECEPTION: [
    "studies.read",
    "reports.print",
    "worklist.manage",
    "archive.read",
    "archive.deliver",
    "statistics.read",
    "his.read",
    "his.sync",
    "his.retry",
    "nonDicom.read",
    "nonDicom.create",
    "share.read",
    "share.create",
    "share.revoke",
    "consult.read",
    "consult.create",
    "consult.message",
  ],
};

const permissionSet = new Set<string>(permissionKeys);

const routePermissions: Array<{ prefix: string; permission: PermissionKey }> = [
  { prefix: "/admin/catalogs", permission: "admin.catalogs" },
  { prefix: "/admin/templates", permission: "admin.catalogs" },
  { prefix: "/admin/permissions", permission: "admin.permissions" },
  { prefix: "/admin/storage", permission: "admin.storage" },
  { prefix: "/admin/users", permission: "users.manage" },
  { prefix: "/admin/pacs", permission: "pacs.manage" },
  { prefix: "/admin/his", permission: "his.manage" },
  { prefix: "/settings/clinic-profile", permission: "clinic.manage" },
  { prefix: "/settings/report-templates", permission: "templates.manage" },
  { prefix: "/worklist", permission: "worklist.manage" },
  { prefix: "/archive", permission: "archive.read" },
  { prefix: "/statistics", permission: "statistics.read" },
  { prefix: "/report", permission: "reports.read" },
  { prefix: "/non-dicom", permission: "nonDicom.read" },
  { prefix: "/consultations", permission: "consult.read" },
  { prefix: "/", permission: "studies.read" },
];

export function isPermissionKey(value: string): value is PermissionKey {
  return permissionSet.has(value);
}

export function normalizePermissions(values?: readonly string[] | null): PermissionKey[] {
  if (!values?.length) return [];
  return Array.from(new Set(values.filter(isPermissionKey)));
}

export function normalizeRole(role?: string | null): SystemRole {
  return systemRoles.includes(role as SystemRole) ? (role as SystemRole) : "DOCTOR";
}

export function getPermissionsForRole(role?: string | null, explicitPermissions?: readonly string[] | null) {
  const customPermissions = normalizePermissions(explicitPermissions);
  if (customPermissions.length > 0) return customPermissions;
  return rolePermissions[normalizeRole(role)];
}

export function hasPermission(
  role: string | null | undefined,
  permission: PermissionKey,
  explicitPermissions?: readonly string[] | null,
) {
  return getPermissionsForRole(role, explicitPermissions).includes(permission);
}

export function getRoutePermission(pathname: string) {
  const match = routePermissions
    .filter(route => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`) || route.prefix === "/")
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return match?.permission || null;
}

export function getDefaultPathForRole(role?: string | null, explicitPermissions?: readonly string[] | null) {
  const permissions = getPermissionsForRole(role, explicitPermissions);
  if (permissions.includes("studies.read")) return "/";
  if (permissions.includes("worklist.manage")) return "/worklist";
  if (permissions.includes("archive.read")) return "/archive";
  if (permissions.includes("statistics.read")) return "/statistics";
  if (permissions.includes("users.manage")) return "/admin/users";
  if (permissions.includes("templates.manage")) return "/settings/report-templates";
  if (permissions.includes("clinic.manage")) return "/settings/clinic-profile";
  if (permissions.includes("pacs.manage")) return "/admin/pacs/nodes";
  return "/";
}
