import type { NavigationNode } from "./navigation-types";

export const navigationRegistry: NavigationNode[] = [
  {
    type: "group",
    id: "clinical",
    label: "Công việc lâm sàng",
    children: [
      { type: "item", id: "studies", label: "Ca chụp", href: "/", iconKey: "LayoutDashboard", permission: "studies.read", match: "exact" },
      { type: "item", id: "worklist", label: "Tiếp đón & danh sách chỉ định", href: "/worklist", iconKey: "FileText", permission: "worklist.manage" },
      { type: "item", id: "non-dicom", label: "Ca ngoài DICOM (Non-DICOM)", href: "/non-dicom", iconKey: "Camera", permission: "nonDicom.read" },
      { type: "item", id: "consultations", label: "Hội chẩn", href: "/consultations", iconKey: "Users", permission: "consult.read" },
      { type: "item", id: "archive", label: "Lưu trữ & trả kết quả", href: "/archive", iconKey: "Archive", permission: "archive.read" },
    ]
  },
  {
    type: "group",
    id: "reporting-ops",
    label: "Báo cáo & điều hành",
    children: [
      { type: "item", id: "command-center", label: "Trung tâm điều hành", href: "/command-center", iconKey: "Activity", permission: "commandCenter.read" },
      {
        type: "group",
        id: "statistics-group",
        label: "Thống kê & Phân tích",
        children: [
          { type: "item", id: "statistics", label: "Tổng quan", href: "/statistics", iconKey: "BarChart3", permission: "statistics.read", match: "exact" },
          { type: "item", id: "statistics-sla", label: "SLA & Thời gian (TAT)", href: "/statistics/sla", iconKey: "Timer", permission: "analytics.read" },
          { type: "item", id: "statistics-workload", label: "Khối lượng công việc", href: "/statistics/workload", iconKey: "UserCog", permission: "analytics.doctor" },
          { type: "item", id: "statistics-modalities", label: "Công suất thiết bị", href: "/statistics/modalities", iconKey: "ActivitySquare", permission: "analytics.read" },
        ]
      },
      { type: "item", id: "quality", label: "Trung tâm chất lượng", href: "/quality", iconKey: "Award", permission: "quality.read" },
      { type: "item", id: "report-templates", label: "Mẫu nội dung báo cáo", href: "/settings/report-templates", iconKey: "FileText", permission: "templates.manage" },
      { type: "item", id: "print-templates", label: "Mẫu phiếu in", href: "/admin/templates", iconKey: "Printer", permission: "admin.catalogs" },
    ]
  },
  {
    type: "group",
    id: "clinical-config",
    label: "Cấu hình chuyên môn",
    children: [
      { type: "item", id: "clinic-profile", label: "Hồ sơ đơn vị", href: "/settings/clinic-profile", iconKey: "Building2", permission: "clinic.manage" },
      { type: "item", id: "facilities", label: "Phòng ban / Cơ sở", href: "/admin/facilities", iconKey: "Building", permission: "admin.facilities" },
      { type: "item", id: "catalogs", label: "Danh mục chuyên môn", href: "/admin/catalogs", iconKey: "FileText", permission: "admin.catalogs" },
      { type: "item", id: "pacs-nodes", label: "Máy chụp & PACS", href: "/admin/pacs/nodes", iconKey: "Settings", permission: "pacs.manage" },
      { type: "item", id: "his", label: "Tích hợp HIS", href: "/admin/his", iconKey: "Network", permission: "his.manage" },
      { type: "item", id: "permission-matrix", label: "Ma trận quyền theo máy", href: "/admin/permissions/matrix", iconKey: "ShieldAlert", permission: "admin.permissions" },
      { type: "item", id: "sla-policies", label: "Chính sách SLA/TAT", href: "/admin/sla-policies", iconKey: "TimerReset", permission: "thresholds.read" },
      { type: "item", id: "control-thresholds", label: "Ngưỡng kiểm soát", href: "/admin/control-thresholds", iconKey: "Sliders", permission: "thresholds.read" },
      { type: "item", id: "alerts", label: "Quy tắc cảnh báo", href: "/admin/alerts", iconKey: "BellRing", permission: "alerts.read" },
    ]
  },
  {
    type: "group",
    id: "system-admin",
    label: "Quản trị hệ thống",
    children: [
      { type: "item", id: "users", label: "Người dùng & vai trò", href: "/admin/users", iconKey: "UserCog", permission: "users.manage" },
      {
        type: "group",
        id: "data-storage",
        label: "Dữ liệu & lưu trữ",
        children: [
          { type: "item", id: "storage", label: "Dung lượng & thư mục lưu trữ", href: "/admin/storage", iconKey: "HardDrive", permission: "admin.storage" },
          { type: "item", id: "retention", label: "Chính sách lưu giữ", href: "/admin/retention", iconKey: "HardDrive", permission: "retention.read" },
          { type: "item", id: "backup", label: "Sao lưu & khôi phục", href: "/admin/backup", iconKey: "Archive", permission: "backup.read" },
          { type: "item", id: "destructive", label: "Yêu cầu xóa dữ liệu", href: "/admin/destructive", iconKey: "Trash2", permission: "destructive.audit" },
        ]
      },
      {
        type: "group",
        id: "ops-safety",
        label: "Vận hành & an toàn",
        children: [
          {
            type: "group",
            id: "ops-center",
            label: "Trung tâm vận hành",
            children: [
              { type: "item", id: "ops-health", label: "Tình trạng hệ thống", href: "/admin/ops/health", iconKey: "ActivitySquare", permission: "ops.health" },
              { type: "item", id: "ops-security", label: "An toàn thông tin", href: "/admin/ops/security", iconKey: "ShieldCheck", permission: "ops.security" },
              { type: "item", id: "ops-performance", label: "Hiệu năng hệ thống", href: "/admin/ops/performance", iconKey: "Gauge", permission: "ops.performance" },
              { type: "item", id: "ops-dicom", label: "Tuân thủ DICOM", href: "/admin/ops/dicom", iconKey: "CheckCircle", permission: "ops.dicomConformance" },
              { type: "item", id: "ops-deployment", label: "Sẵn sàng triển khai", href: "/admin/ops/deployment", iconKey: "Rocket", permission: "ops.deployment" },
            ]
          },
          { type: "item", id: "native", label: "Kết nối máy trạm", href: "/admin/native", iconKey: "MonitorDot", permission: "native.manage" },
          {
            type: "group",
            id: "release-management",
            label: "Quản lý phiên bản",
            children: [
              { type: "item", id: "release", label: "Tổng quan phiên bản", href: "/admin/release", iconKey: "Tag", permission: "release.read", match: "exact" },
              { type: "item", id: "release-uat", label: "Kiểm thử chấp nhận (UAT)", href: "/admin/release/uat", iconKey: "TestTube2", permission: "uat.read" },
              { type: "item", id: "release-go-live", label: "Chuẩn bị vận hành chính thức", href: "/admin/release/go-live", iconKey: "Flag", permission: "release.read" },
            ]
          },
          { type: "item", id: "training", label: "Đào tạo", href: "/admin/training", iconKey: "GraduationCap", permission: "training.read" },
          { type: "item", id: "incidents", label: "Sự cố", href: "/support/incidents", iconKey: "AlertTriangle", permission: "incident.read" },
          { type: "item", id: "changes", label: "Yêu cầu thay đổi", href: "/admin/changes", iconKey: "FileDiff", permission: "change.read" },
          { type: "item", id: "runbooks", label: "Quy trình vận hành", href: "/admin/runbooks", iconKey: "BookOpenCheck", permission: "runbook.read" },
        ]
      }
    ]
  },
  {
    type: "group",
    id: "personal-account",
    label: "Tài khoản cá nhân",
    children: [
      { type: "item", id: "account", label: "Hồ sơ & bảo mật tài khoản", href: "/settings/account", iconKey: "User", permission: "account.selfManage" },
    ]
  }
];
