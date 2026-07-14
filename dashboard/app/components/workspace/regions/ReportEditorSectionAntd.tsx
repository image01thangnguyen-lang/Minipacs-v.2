"use client";

import React from "react";
import { Input, Typography } from "antd";
import TiptapEditor from "@/app/report/[studyInstanceUid]/components/TiptapEditor";
import {
  ReportTemplatePickerAntd,
  type ReportTemplateOption,
  type TemplateApplyMode,
  normalizeTemplateHtml,
  appendTemplateHtml,
  appendTemplateText,
} from "@/app/components/ReportTemplatePickerAntd";

const { Text } = Typography;
const { TextArea } = Input;

export interface ReportEditorState {
  findings: string;
  conclusion: string;
  recommendation: string;
}

interface ReportEditorSectionAntdProps {
  state: ReportEditorState;
  onChange: (updates: Partial<ReportEditorState>) => void;
  readOnly: boolean;
  templates: ReportTemplateOption[];
  isSaving?: boolean;
}

export function ReportEditorSectionAntd({
  state,
  onChange,
  readOnly,
  templates,
  isSaving,
}: ReportEditorSectionAntdProps) {
  const handleApplyTemplate = (template: ReportTemplateOption, mode: TemplateApplyMode) => {
    if (readOnly) return;

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
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-gray-300"
          id="report-findings-label"
        >
          Mô tả (Findings)
        </label>
        {!readOnly && templates.length > 0 && (
          <ReportTemplatePickerAntd
            disabled={isSaving}
            templates={templates}
            onApply={handleApplyTemplate}
          />
        )}
        <div className={readOnly ? "opacity-80" : ""}>
          <TiptapEditor
            value={state.findings}
            onChange={(html) => onChange({ findings: html })}
            shortcutTemplates={readOnly ? [] : templates}
            onShortcutApply={handleShortcutApply}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="report-conclusion"
          className="mb-2 block text-sm font-semibold text-gray-300"
        >
          Kết luận (Conclusion)
        </label>
        <TextArea
          id="report-conclusion"
          value={state.conclusion}
          onChange={(e) => onChange({ conclusion: e.target.value })}
          readOnly={readOnly}
          disabled={readOnly}
          aria-readonly={readOnly || undefined}
          style={{ height: 112, resize: 'none' }}
          placeholder={readOnly ? "" : "Nhập kết luận..."}
          className="bg-[#141414] border-[#303030] text-gray-300 hover:border-[#13C2C2] focus:border-[#13C2C2]"
        />
      </div>

      <div>
        <label
          htmlFor="report-recommendation"
          className="mb-2 block text-sm font-semibold text-gray-300"
        >
          Đề nghị (Recommendation)
        </label>
        <TextArea
          id="report-recommendation"
          value={state.recommendation}
          onChange={(e) => onChange({ recommendation: e.target.value })}
          readOnly={readOnly}
          disabled={readOnly}
          aria-readonly={readOnly || undefined}
          style={{ height: 96, resize: 'none' }}
          placeholder={readOnly ? "" : "Nhập đề nghị..."}
          className="bg-[#141414] border-[#303030] text-gray-300 hover:border-[#13C2C2] focus:border-[#13C2C2]"
        />
      </div>
    </section>
  );
}
