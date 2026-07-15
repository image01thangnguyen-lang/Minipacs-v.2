"use client";

import { FileTextOutlined, PlusCircleOutlined, SwapOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { Select, Button } from "antd";

export type ReportTemplateOption = {
  id: string;
  name: string;
  modality: string;
  bodyPart?: string | null;
  shortcut?: string | null;
  findings: string;
  conclusion: string;
  recommendation?: string | null;
  isNormal?: boolean;
  scope?: string;
};

export type TemplateApplyMode = "append" | "replace";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function normalizeTemplateHtml(value?: string | null) {
  const content = (value || "").trim();
  if (!content) return "";
  if (/<[a-z][\s\S]*>/i.test(content)) return content;

  return content
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function appendTemplateHtml(current: string, next: string) {
  const base = (current || "").trim();
  const addition = normalizeTemplateHtml(next);
  if (!addition) return base;
  if (!base || base === "<p></p>") return addition;
  return `${base}<p></p>${addition}`;
}

export function appendTemplateText(current: string, next?: string | null) {
  const base = (current || "").trim();
  const addition = (next || "").trim();
  if (!addition) return base;
  return base ? `${base}\n\n${addition}` : addition;
}

export function ReportTemplatePickerAntd({
  disabled,
  onApply,
  templates,
}: {
  disabled?: boolean;
  onApply: (template: ReportTemplateOption, mode: TemplateApplyMode) => void;
  templates: ReportTemplateOption[];
}) {
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    setSelectedId(current => {
      if (current && templates.some(template => template.id === current)) return current;
      return templates[0]?.id || "";
    });
  }, [templates]);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === selectedId) || null,
    [selectedId, templates]
  );

  if (!templates.length) return null;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded border border-[#303030] bg-[#1F1F1F] px-2 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileTextOutlined className="text-[#13C2C2]" />
        <Select
          size="middle"
          showSearch
          value={selectedId}
          onChange={val => setSelectedId(val)}
          disabled={disabled}
          className="flex-1"
          options={templates.map(template => ({
            value: template.id,
            label: `${template.shortcut ? `${template.shortcut} · ` : ""}${template.name} · ${template.modality}${template.bodyPart ? ` · ${template.bodyPart}` : ""}`
          }))}
          filterOption={(input, option) =>
            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <Button
        size="middle"
        type="default"
        icon={<PlusCircleOutlined />}
        onClick={() => selectedTemplate && onApply(selectedTemplate, "append")}
        disabled={disabled || !selectedTemplate}
        className="text-[11px] font-semibold"
      >
        Chèn
      </Button>
      <Button
        size="middle"
        type="default"
        icon={<SwapOutlined />}
        onClick={() => selectedTemplate && onApply(selectedTemplate, "replace")}
        disabled={disabled || !selectedTemplate}
        className="text-[11px] font-semibold"
      >
        Thay
      </Button>
    </div>
  );
}
