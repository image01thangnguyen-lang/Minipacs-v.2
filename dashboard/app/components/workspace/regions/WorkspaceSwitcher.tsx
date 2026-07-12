import React from "react";

export function WorkspaceSwitcher() {
  return (
    <div className="flex h-12 flex-none items-center justify-between border-b border-vin-border/70 px-3">
      <div>
        <h2 className="text-sm font-bold text-vin-text">Màn hình bác sĩ</h2>
        <p className="text-[9px] text-vin-muted">Worklist chẩn đoán hình ảnh</p>
      </div>
      <span className="rounded bg-vin-accent/15 px-2 py-1 text-[9px] font-semibold text-vin-accent">ĐANG LÀM VIỆC</span>
    </div>
  );
}
