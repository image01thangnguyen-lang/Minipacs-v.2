export const systemRoles = ["ADMIN", "DOCTOR", "TECHNICIAN", "RECEPTION"] as const;

export type SystemRole = (typeof systemRoles)[number];
export type AppRole = SystemRole;

export const permissionKeys = [
  "studies.read",
  "reports.read",
  "reports.write",
  "worklist.manage",
  "archive.read",
  "archive.deliver",
  "statistics.read",
  "statistics.doctorStats",
  "users.manage",
  "templates.manage",
  "clinic.manage",
  "pacs.manage",
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
  "reports.read": "Mở phiếu báo cáo",
  "reports.write": "Lưu nháp/ký báo cáo",
  "worklist.manage": "Tạo và cập nhật Worklist",
  "archive.read": "Tra cứu Archive và in lại",
  "archive.deliver": "Ghi nhận đã trả kết quả",
  "statistics.read": "Xem dashboard thống kê",
  "statistics.doctorStats": "Xem thống kê theo bác sĩ",
  "users.manage": "Quản lý người dùng và phân quyền",
  "templates.manage": "Quản lý mẫu báo cáo",
  "clinic.manage": "Cấu hình thông tin phòng khám",
  "pacs.manage": "Quản trị PACS/DICOM nodes",
};

export const permissionGroups: Array<{ title: string; permissions: PermissionKey[] }> = [
  {
    title: "Lâm sàng",
    permissions: ["studies.read", "reports.read", "reports.write"],
  },
  {
    title: "Tiếp đón & trả kết quả",
    permissions: ["worklist.manage", "archive.read", "archive.deliver"],
  },
  {
    title: "Quản trị & thống kê",
    permissions: ["statistics.read", "statistics.doctorStats", "users.manage", "templates.manage", "clinic.manage", "pacs.manage"],
  },
];

export const rolePermissions: Record<SystemRole, PermissionKey[]> = {
  ADMIN: [
    "studies.read",
    "reports.read",
    "reports.write",
    "worklist.manage",
    "archive.read",
    "archive.deliver",
    "statistics.read",
    "statistics.doctorStats",
    "users.manage",
    "templates.manage",
    "clinic.manage",
    "pacs.manage",
  ],
  DOCTOR: [
    "studies.read",
    "reports.read",
    "reports.write",
    "archive.read",
    "statistics.read",
    "statistics.doctorStats",
    "templates.manage",
  ],
  TECHNICIAN: [
    "studies.read",
    "worklist.manage",
    "archive.read",
    "statistics.read",
  ],
  RECEPTION: [
    "studies.read",
    "worklist.manage",
    "archive.read",
    "archive.deliver",
    "statistics.read",
  ],
};

const permissionSet = new Set<string>(permissionKeys);

const routePermissions: Array<{ prefix: string; permission: PermissionKey }> = [
  { prefix: "/admin/users", permission: "users.manage" },
  { prefix: "/admin/pacs", permission: "pacs.manage" },
  { prefix: "/settings/clinic-profile", permission: "clinic.manage" },
  { prefix: "/settings/report-templates", permission: "templates.manage" },
  { prefix: "/worklist", permission: "worklist.manage" },
  { prefix: "/archive", permission: "archive.read" },
  { prefix: "/statistics", permission: "statistics.read" },
  { prefix: "/report", permission: "reports.read" },
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
