"use client";

import React from "react";
import TiptapEditor from "@/app/report/[studyInstanceUid]/components/TiptapEditor";
import {
  ReportTemplatePicker,
  type ReportTemplateOption,
  type TemplateApplyMode,
  normalizeTemplateHtml,
  appendTemplateHtml,
  appendTemplateText,
} from "@/app/components/ReportTemplatePicker";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ReportEditorState {
  findings: string;
  conclusion: string;
  recommendation: string;
}

interface ReportEditorSectionProps {
  /** Current editor content */
  state: ReportEditorState;
  /** Update handler — not called in read-only mode */
  onChange: (updates: Partial<ReportEditorState>) => void;
  /** If true, editor is read-only: no toolbar, no editing, no template apply */
  readOnly: boolean;
  /** Report templates for the template picker (modality/bodyPart-filtered) */
  templates: ReportTemplateOption[];
  /** Whether save is in progress — disables template controls */
  isSaving?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ReportEditorSection({
  state,
  onChange,
  readOnly,
  templates,
  isSaving,
}: ReportEditorSectionProps) {
  const handleApplyTemplate = (template: ReportTemplateOption, mode: TemplateApplyMode) => {
    if (readOnly) return; // defense-in-depth: should not be callable

    if (mode === "replace") {
      onChange({
        findings: normalizeTemplateHtml(template.findings),
        conclusion: template.conclusion || "",
        recommendation: template.recommendation || "",
      });
      return;
    }

    onChange({
      findings: appendTemplateHtml(state.findings, template.findings),
      conclusion: appendTemplateText(state.conclusion, template.conclusion),
      recommendation: appendTemplateText(state.recommendation, template.recommendation),
    });
  };

  const handleShortcutApply = (template: ReportTemplateOption) => {
    if (readOnly) return;
    onChange({
      conclusion: appendTemplateText(state.conclusion, template.conclusion),
      recommendation: appendTemplateText(state.recommendation, template.recommendation),
    });
  };

  return (
    <section className="space-y-4" aria-label="Report editor">
      {/* Findings — rich text editor */}
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-vin-text2"
          id="report-findings-label"
        >
          Mô tả (Findings)
        </label>
        {!readOnly && templates.length > 0 && (
          <ReportTemplatePicker
            disabled={isSaving}
            templates={templates}
            onApply={handleApplyTemplate}
          />
        )}
        <TiptapEditor
          value={state.findings}
          onChange={(html) => onChange({ findings: html })}
          shortcutTemplates={readOnly ? [] : templates}
          onShortcutApply={handleShortcutApply}
          readOnly={readOnly}
        />
      </div>

      {/* Conclusion — plain textarea */}
      <div>
        <label
          htmlFor="report-conclusion"
          className="mb-2 block text-sm font-semibold text-vin-text2"
        >
          Kết luận (Conclusion)
        </label>
        <textarea
          id="report-conclusion"
          value={state.conclusion}
          onChange={(e) => onChange({ conclusion: e.target.value })}
          readOnly={readOnly}
          disabled={readOnly}
          aria-readonly={readOnly || undefined}
          className={`h-28 w-full resize-none rounded-xl border border-vin-border bg-vin-shell p-3 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent ${
            readOnly ? "cursor-default opacity-80" : ""
          }`}
          placeholder={readOnly ? "" : "Nhập kết luận..."}
        />
      </div>

      {/* Recommendation — plain textarea */}
      <div>
        <label
          htmlFor="report-recommendation"
          className="mb-2 block text-sm font-semibold text-vin-text2"
        >
          Đề nghị (Recommendation)
        </label>
        <textarea
          id="report-recommendation"
          value={state.recommendation}
          onChange={(e) => onChange({ recommendation: e.target.value })}
          readOnly={readOnly}
          disabled={readOnly}
          aria-readonly={readOnly || undefined}
          className={`h-24 w-full resize-none rounded-xl border border-vin-border bg-vin-shell p-3 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent ${
            readOnly ? "cursor-default opacity-80" : ""
          }`}
          placeholder={readOnly ? "" : "Nhập đề nghị..."}
        />
      </div>
    </section>
  );
}
