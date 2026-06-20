"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, HardDrive, LayoutDashboard, Settings, UserCog } from "lucide-react";

type ActiveMenu = "studies" | "worklist" | "users" | "templates" | "pacs" | "storage";

const mainMenuItems = [
  { key: "studies", label: "Ca chụp", href: "/", icon: LayoutDashboard },
  { key: "worklist", label: "Tạo ca", href: "/worklist/new", icon: FileText },
  { key: "users", label: "Người dùng", href: "/admin/users", icon: UserCog },
] as const;

const upcomingMenuItems = [
  { key: "templates", label: "Mẫu báo cáo", icon: FileText },
  { key: "pacs", label: "PACS / IT", icon: Settings },
  { key: "storage", label: "Dung lượng", icon: HardDrive },
] as const;

export function AppSidebar({ active }: { active: ActiveMenu }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={`relative flex h-full flex-none flex-col border-r border-vin-border bg-vin-sidebar transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-14" : "w-48"
      }`}
    >
      {/* Header */}
      <div className="border-b border-vin-border px-3 py-3">
        {collapsed ? (
          <div className="flex h-[34px] items-center justify-center">
            <span className="text-sm font-bold text-white">M</span>
          </div>
        ) : (
          <>
            <div className="text-sm font-bold text-white">Mini PACS</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-vin-muted">RIS Dashboard</div>
          </>
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

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="absolute -right-3 top-[72px] z-20 flex h-6 w-6 items-center justify-center rounded-full border border-vin-border bg-vin-panel2 text-vin-muted shadow-md transition-colors hover:border-vin-accent hover:text-white"
        title={collapsed ? "Mở menu" : "Đóng menu"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
