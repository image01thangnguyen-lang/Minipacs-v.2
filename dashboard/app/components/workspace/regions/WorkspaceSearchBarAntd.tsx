"use client";
import React from "react";
import { Input, Space, Button } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import type { DatePreset } from "@/lib/worklist/url-state";

export function WorkspaceSearchBarAntd({ value, datePreset, pending, onChange, onCommit, onDateChange }: {
  value: string; datePreset: DatePreset; pending?: boolean;
  onChange: (value: string) => void; onCommit: () => void; onDateChange: (value: DatePreset) => void;
}) {
  return (
    <div className="flex-none space-y-2 border-b border-[#303030] px-3 py-3" role="search" aria-label="Tìm kiếm worklist">
      <Input
        size="small"
        placeholder="Tên, mã BN, accession..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onPressEnter={onCommit}
        prefix={<SearchOutlined className="text-gray-400" />}
        suffix={
          value ? (
            <CloseOutlined
              className="text-gray-400 cursor-pointer hover:text-white"
              onClick={() => onChange("")}
            />
          ) : null
        }
      />
      
      <div className="flex gap-1" aria-label="Khoảng ngày">
        {(["TODAY", "YESTERDAY", "3DAYS", "7DAYS", "ALL"] as DatePreset[]).map((preset) => {
          const isActive = datePreset === preset;
          return (
            <Button
              key={preset}
              size="small"
              type={isActive ? "primary" : "default"}
              ghost={isActive}
              onClick={() => onDateChange(preset)}
              className="flex-1 px-1 text-[9px] min-w-0 font-semibold"
            >
              {{ TODAY: "Hôm nay", YESTERDAY: "Hôm qua", "3DAYS": "3 ngày", "7DAYS": "7 ngày", ALL: "Tất cả" }[preset]}
            </Button>
          );
        })}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{pending ? "Đang cập nhật danh sách" : ""}</span>
    </div>
  );
}
