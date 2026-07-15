"use client";
import React from "react";
import { Button, Badge } from "antd";

type Option = { value: string; label: string; count?: number };
export function WorkQueueFacetsAntd({ status, modality, statuses, modalities, onStatusChange, onModalityChange, onClear }: {
  status: string; modality: string; statuses: Option[]; modalities: Option[];
  onStatusChange: (value: string) => void; onModalityChange: (value: string) => void; onClear: () => void;
}) {
  const active = status !== "ALL" || modality !== "ALL";
  return (
    <section className="max-h-[42%] overflow-auto border-b border-[#303030] p-3" aria-labelledby="work-queue-heading">
      <div className="mb-2 flex items-center justify-between">
        <h3 id="work-queue-heading" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hàng đợi</h3>
        {active && <Button type="link" size="middle" onClick={onClear} className="text-[10px] h-auto p-0">Xóa lọc</Button>}
      </div>
      <fieldset className="mb-3">
        <legend className="mb-1 text-[10px] font-semibold text-gray-500">Trạng thái</legend>
        <div className="space-y-0.5">
          {statuses.map(o => (
            <Button
              key={o.value}
              type={status === o.value ? "primary" : "text"}
              ghost={status === o.value}
              size="middle"
              onClick={() => onStatusChange(o.value)}
              className="w-full flex justify-between items-center text-left text-[11px] h-auto py-1"
            >
              <span>{o.label}</span>
              {o.count !== undefined && (
                <Badge
                  count={o.count}
                  color={status === o.value ? "#13C2C2" : "#424242"}
                  className="font-mono text-[9px] shadow-none"
                  style={{ minWidth: "16px", height: "16px", lineHeight: "16px", padding: "0 4px" }}
                />
              )}
            </Button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-[10px] font-semibold text-gray-500">Phương thức</legend>
        <div className="flex flex-wrap gap-1">
          {modalities.map(o => (
            <Button
              key={o.value}
              type={modality === o.value ? "primary" : "default"}
              ghost={modality === o.value}
              size="middle"
              onClick={() => onModalityChange(o.value)}
              className="text-[10px]"
            >
              {o.label}
            </Button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
