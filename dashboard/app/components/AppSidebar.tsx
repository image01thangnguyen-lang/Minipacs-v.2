"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, signOut } from "next-auth/react";
import { Archive, BarChart3, Building2, FileText, HardDrive, LayoutDashboard, LogOut, Menu, Settings, UserCog, X, User, Printer, Camera, Network } from "lucide-react";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

type ActiveMenu = "studies" | "worklist" | "archive" | "statistics" | "users" | "templates" | "printTemplates" | "clinic" | "pacs" | "his" | "storage" | "catalogs" | "non-dicom" | "consultations" | "admin_retention" | "admin_backup" | "admin_destructive";

const mainMenuItems = [
  { key: "studies", label: "Ca chụp", href: "/", icon: LayoutDashboard, permission: "studies.read" },
  { key: "worklist", label: "Tiếp đón", href: "/worklist", icon: FileText, permission: "worklist.manage" },
  { key: "non-dicom", label: "Non-DICOM", href: "/non-dicom", icon: Camera, permission: "nonDicom.read" },
  { key: "archive", label: "Lưu trữ", href: "/archive", icon: Archive, permission: "archive.read" },
  { key: "statistics", label: "Thống kê", href: "/statistics", icon: BarChart3, permission: "statistics.read" },
  { key: "users", label: "Người dùng", href: "/admin/users", icon: UserCog, permission: "users.manage" },
  { key: "templates", label: "Mẫu báo cáo", href: "/settings/report-templates", icon: FileText, permission: "templates.manage" },
  { key: "printTemplates", label: "Mẫu in ấn", href: "/admin/templates", icon: Printer, permission: "admin.catalogs" },
  { key: "clinic", label: "Phòng khám", href: "/settings/clinic-profile", icon: Building2, permission: "clinic.manage" },
  { key: "pacs", label: "PACS / IT", href: "/admin/pacs/nodes", icon: Settings, permission: "pacs.manage" },
  { key: "his", label: "Tích hợp HIS", href: "/admin/his", icon: Network, permission: "his.manage" },
  { key: "catalogs", label: "Danh mục", href: "/admin/catalogs", icon: FileText, permission: "admin.catalogs" },
  { key: "admin_retention", label: "Retention", href: "/admin/retention", icon: HardDrive, permission: "retention.read" },
  { key: "admin_backup", label: "Backup", href: "/admin/backup", icon: Archive, permission: "backup.read" },
  { key: "admin_destructive", label: "Destructive", href: "/admin/destructive", icon: Settings, permission: "destructive.audit" },
] as const;

const upcomingMenuItems = [
  { key: "storage", label: "Dung lượng", icon: HardDrive },
] as const;

let globalSidebarCollapsed = true;

export function AppSidebar({ active }: { active: ActiveMenu }) {
  const [collapsed, setCollapsedState] = useState(globalSidebarCollapsed);
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [userInfo, setUserInfo] = useState<{ username?: string; fullName?: string } | null>(null);

  const setCollapsed = (val: boolean) => {
    globalSidebarCollapsed = val;
    setCollapsedState(val);
  };

  useEffect(() => {
    let mounted = true;
    getSession().then(session => {
      if (mounted) {
        setRole(session?.user?.role || null);
        setPermissions(session?.user?.permissions || null);
        if (session?.user) {
          setUserInfo({
            username: (session.user as any).username || session.user.name,
            fullName: (session.user as any).fullName || session.user.name
          });
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  const visibleMenuItems = role
    ? mainMenuItems.filter(item => hasPermission(role, item.permission as PermissionKey, permissions))
    : mainMenuItems.filter(item => item.key === active || item.key === "studies");

  return (
    <aside
      className={`relative flex h-full flex-none flex-col border-r border-vin-border bg-vin-sidebar transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-14" : "w-48"
      }`}
    >
      {/* Header with toggle */}
      <div className="border-b border-vin-border px-2 py-2.5">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-[34px] w-full items-center justify-center rounded text-vin-muted transition-colors hover:bg-vin-panel hover:text-white"
            title="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex h-[34px] items-center justify-between pl-2">
            <div>
              <div className="text-sm font-bold leading-tight text-white">Mini PACS</div>
              <div className="text-[10px] uppercase tracking-wide text-vin-muted">RIS Dashboard</div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-vin-muted transition-colors hover:bg-vin-panel hover:text-white"
              title="Đóng menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-3 scr-dark">
        {visibleMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold transition ${
                isActive
                  ? "bg-vin-tableSelected text-white"
                  : "text-vin-text2 hover:bg-vin-panel hover:text-white"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-vin-accent" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <div className="px-3 pb-1 pt-4 text-[9px] font-bold uppercase tracking-wider text-vin-faint">
            Sắp triển khai
          </div>
        )}

        {collapsed && <div className="my-3 border-t border-vin-border/50" />}

        {upcomingMenuItems.map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className={`flex cursor-not-allowed items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold text-vin-faint opacity-70 ${
                collapsed ? "justify-center px-0" : ""
              }`}
              title={item.label + " — Sẽ mở ở các phần tiếp theo"}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-vin-border px-2 py-2.5">
        {collapsed ? (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Đăng xuất"
            className="flex w-full items-center justify-center rounded py-2 text-[12px] font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 ${loggingOut ? "animate-pulse" : ""}`} />
          </button>
        ) : userInfo ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-vin-shell border border-vin-border">
              <User className="h-4 w-4 text-vin-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold text-white">{userInfo.fullName || userInfo.username}</div>
              {userInfo.fullName && userInfo.username && (
                <div className="truncate text-[9px] text-vin-muted">@{userInfo.username}</div>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Đăng xuất"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className={`h-4 w-4 ${loggingOut ? "animate-pulse" : ""}`} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Đăng xuất"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 ${loggingOut ? "animate-pulse" : ""}`} />
            <span className="truncate">{loggingOut ? "Đang xuất..." : "Đăng xuất"}</span>
          </button>
        )}
      </div>
    </aside>
  );
}


