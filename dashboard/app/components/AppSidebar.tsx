"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Building2, FileText, HardDrive, LayoutDashboard, LogOut, Menu, Settings, UserCog, X } from "lucide-react";

type ActiveMenu = "studies" | "worklist" | "users" | "templates" | "clinic" | "pacs" | "storage";

const mainMenuItems = [
  { key: "studies", label: "Ca chụp", href: "/", icon: LayoutDashboard },
  { key: "worklist", label: "Tiếp đón", href: "/worklist", icon: FileText },
  { key: "users", label: "Người dùng", href: "/admin/users", icon: UserCog },
  { key: "templates", label: "Mẫu báo cáo", href: "/settings/report-templates", icon: FileText },
  { key: "clinic", label: "Phòng khám", href: "/settings/clinic-profile", icon: Building2 },
  { key: "pacs", label: "PACS / IT", href: "/admin/pacs/nodes", icon: Settings },
] as const;

const upcomingMenuItems = [
  { key: "storage", label: "Dung lượng", icon: HardDrive },
] as const;

export function AppSidebar({ active }: { active: ActiveMenu }) {
  const [collapsed, setCollapsed] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

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
      <nav className="flex-1 space-y-1 px-2 py-3">
        {mainMenuItems.map(item => {
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

      {/* Logout Button */}
      <div className="border-t border-vin-border px-2 py-2.5">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Đăng xuất"
          className={`flex w-full items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className={`h-4 w-4 flex-shrink-0 ${loggingOut ? "animate-pulse" : ""}`} />
          {!collapsed && <span className="truncate">{loggingOut ? "Đang xuất..." : "Đăng xuất"}</span>}
        </button>
      </div>
    </aside>
  );
}

