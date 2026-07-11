import React from "react";

const modalityClasses: Record<string, string> = {
  CT: "border-vin-accent/40 bg-vin-accentSoft/15 text-cyan-100",
  MR: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  CR: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  DX: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  US: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

export function ModBadge({ value, isNonDicom }: { value?: string; isNonDicom?: boolean }) {
  if (isNonDicom) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-bold leading-none tracking-widest text-indigo-100 shadow-[0_0_8px_rgba(99,102,241,0.15)]">
          {value || "NON"}
        </span>
        <span className="text-[9px] font-semibold text-indigo-300">Non-DICOM</span>
      </div>
    );
  }

  const label = value || "?";
  const classes = modalityClasses[label] || "border-white/10 bg-white/5 text-vin-muted";

  return (
    <span className={`inline-flex min-w-9 items-center justify-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold leading-none ${classes}`}>
      {label}
    </span>
  );
}

export const risStatusLabels: Record<string, string> = {
  ORDERED: "Chờ chụp",
  READY_FOR_SCAN: "Sẵn sàng chụp",
  IN_PROGRESS: "Đang chụp",
  RECEIVED: "Đã nhận ảnh",
  STABLE: "Ảnh ổn định",
  NEEDS_QC: "Cần QC",
  QC_REJECTED: "Chụp lại",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  REPORTED: "Đã có báo cáo",
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ARCHIVED: "Lưu trữ",
  DELETED_FROM_PACS: "Đã xóa ảnh",
  ERROR: "Lỗi",
};

export function RisStatusBadge({ status }: { status?: string }) {
  const value = status || "READY_TO_READ";
  const label = risStatusLabels[value] || value;

  const classes =
    value === "FINALIZED" || value === "DELIVERED"
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
      : value === "READING" || value === "REPORTED"
        ? "border-amber-400/35 bg-amber-500/15 text-amber-100"
        : value === "QC_REJECTED" || value === "ERROR"
          ? "border-red-400/35 bg-red-500/15 text-red-100"
          : value === "READY_TO_READ" || value === "RECEIVED" || value === "STABLE"
            ? "border-cyan-400/35 bg-cyan-500/15 text-cyan-100"
            : "border-white/10 bg-white/5 text-vin-text2";

  return <span className={`inline-flex max-w-[118px] items-center justify-center truncate rounded-full border px-2.5 py-1 text-[9px] font-bold leading-none ${classes}`}>{label}</span>;
}
