"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Archive, BarChart3, ChevronDown, ClipboardList, Images, Users } from "lucide-react";

const destinations = [
  { href: "/", label: "Màn hình bác sĩ", description: "Danh sách ca chụp", icon: Images },
  { href: "/archive", label: "Lưu trữ & in", description: "Tìm, trả kết quả và in lại", icon: Archive },
  { href: "/worklist", label: "Tiếp đón & chỉ định", description: "Quản lý danh sách chỉ định", icon: ClipboardList },
  { href: "/consultations", label: "Hội chẩn", description: "Ca gửi và nhận hội chẩn", icon: Users },
  { href: "/statistics", label: "Thống kê", description: "Báo cáo hoạt động", icon: BarChart3 },
];

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex h-14 flex-none items-center border-b border-vin-border/70 px-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition-colors hover:bg-vin-panel focus:outline-none focus:ring-1 focus:ring-vin-accent"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-vin-text">Màn hình bác sĩ</span>
          <span className="block truncate text-[10px] font-medium text-vin-accent">Chuyển màn hình</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded bg-vin-accent/15 px-2 py-1 text-[9px] font-semibold text-vin-accent">ĐANG LÀM VIỆC</span>
          <ChevronDown className={`h-4 w-4 text-vin-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Chuyển sang màn hình khác"
          className="absolute left-2 right-2 top-[calc(100%+4px)] z-50 overflow-hidden rounded-md border border-vin-border bg-vin-sidebar p-1.5 shadow-2xl"
        >
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chọn màn hình</p>
          {destinations.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 rounded px-2 py-2 transition-colors hover:bg-vin-panel focus:bg-vin-panel focus:outline-none ${href === "/" ? "bg-vin-accent/10" : ""}`}
            >
              <Icon className="h-4 w-4 flex-none text-vin-accent" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-vin-text">{label}</span>
                <span className="block truncate text-[9px] text-vin-muted">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
