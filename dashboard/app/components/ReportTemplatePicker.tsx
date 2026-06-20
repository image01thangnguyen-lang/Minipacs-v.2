"use client";

import { FileText, PlusCircle, Replace } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

export function ReportTemplatePicker({
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
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded border border-vin-border bg-vin-panel2 px-2 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-vin-accent" />
        <select
          value={selectedId}
          onChange={event => setSelectedId(event.target.value)}
          disabled={disabled}
          className="min-w-[180px] flex-1 rounded border border-vin-border bg-vin-shell px-2 py-1.5 text-[11px] text-vin-text outline-none transition focus:border-vin-accent disabled:opacity-40"
        >
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.shortcut ? `${template.shortcut} · ` : ""}
              {template.name} · {template.modality}
              {template.bodyPart ? ` · ${template.bodyPart}` : ""}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => selectedTemplate && onApply(selectedTemplate, "append")}
        disabled={disabled || !selectedTemplate}
        className="flex items-center gap-1.5 rounded border border-vin-border bg-vin-shell px-2.5 py-1.5 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Chèn
      </button>
      <button
        type="button"
        onClick={() => selectedTemplate && onApply(selectedTemplate, "replace")}
        disabled={disabled || !selectedTemplate}
        className="flex items-center gap-1.5 rounded border border-vin-border bg-vin-shell px-2.5 py-1.5 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Replace className="h-3.5 w-3.5" />
        Thay
      </button>
    </div>
  );
}
