"use client";

import Link from "next/link";
import { FileText, HardDrive, LayoutDashboard, Settings, UserCog } from "lucide-react";

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
  return (
    <aside className="flex h-full w-48 flex-none flex-col border-r border-vin-border bg-vin-sidebar">
      <div className="border-b border-vin-border px-3 py-3">
        <div className="text-sm font-bold text-white">Mini PACS</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-vin-muted">RIS Dashboard</div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {mainMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold transition ${
                isActive
                  ? "bg-vin-tableSelected text-white"
                  : "text-vin-text2 hover:bg-vin-panel hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 text-vin-accent" />
              {item.label}
            </Link>
          );
        })}

        <div className="px-3 pb-1 pt-4 text-[9px] font-bold uppercase tracking-wider text-vin-faint">
          Sắp triển khai
        </div>
        {upcomingMenuItems.map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className="flex cursor-not-allowed items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold text-vin-faint opacity-70"
              title="Sẽ mở ở các phần tiếp theo"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
