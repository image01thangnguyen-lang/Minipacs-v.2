"use client";
import React from "react";
import type { DatePreset } from "@/lib/worklist/url-state";

export function WorkspaceSearchBar({ value, datePreset, pending, onChange, onCommit, onDateChange }: {
  value: string; datePreset: DatePreset; pending?: boolean;
  onChange: (value: string) => void; onCommit: () => void; onDateChange: (value: DatePreset) => void;
}) {
  return (
    <div className="flex-none space-y-2 border-b border-vin-border/70 px-3 py-3" role="search" aria-label="Tìm kiếm worklist">
      <label className="relative block">
        <span className="sr-only">Tìm bệnh nhân, mã bệnh nhân hoặc accession</span>
        <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-vin-faint">⌕</span>
        <input value={value} maxLength={200} onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onCommit()} placeholder="Tên, mã BN, accession..."
          className="h-9 w-full rounded-md border border-vin-border bg-vin-root/40 pl-8 pr-8 text-sm text-vin-text outline-none transition focus:border-vin-accent focus:ring-1 focus:ring-vin-accent" />
        {value && <button type="button" onClick={() => onChange("")} aria-label="Xóa tìm kiếm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 text-vin-muted hover:text-white">×</button>}
      </label>
      <div className="flex gap-1" aria-label="Khoảng ngày">
        {(["TODAY", "YESTERDAY", "3DAYS", "7DAYS", "30DAYS", "ALL"] as DatePreset[]).map((preset) => (
          <button key={preset} type="button" onClick={() => onDateChange(preset)} aria-pressed={datePreset === preset}
            className={`min-w-0 flex-1 rounded border px-1 py-1.5 text-sm font-semibold ${datePreset === preset ? "border-vin-accent bg-vin-accent/20 text-vin-accent" : "border-vin-border text-vin-muted hover:text-vin-text"}`}>
            {{ TODAY: "Hôm nay", YESTERDAY: "Hôm qua", "3DAYS": "3 ngày", "7DAYS": "7 ngày", "30DAYS": "30 ngày", ALL: "Tất cả" }[preset]}
          </button>
        ))}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{pending ? "Đang cập nhật danh sách" : ""}</span>
    </div>
  );
}
