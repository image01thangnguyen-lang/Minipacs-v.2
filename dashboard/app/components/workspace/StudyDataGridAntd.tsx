"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Checkbox, Dropdown, Table, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowDown, ArrowUp, Columns3, Minus, Plus, RotateCcw } from "lucide-react";
import { fmtName, fmtText, fmtSex, fmtAge, fmtDateTime, fmtDateTimeIso, fmtDuration } from "./formatters";
import { ModBadge, RisStatusBadge } from "./badges";
import { WORKSPACE_COLUMN_IDS, WorkspaceColumnIdSchema, WorkspacePreferences } from "../../../lib/preferences/workspace-preferences";

const { Text } = Typography;
type ColumnId = typeof WorkspaceColumnIdSchema._type;

const COLUMN_LABELS: Record<ColumnId, string> = {
  patient: "Bệnh nhân", patientBirthDate: "Ngày sinh", patientSex: "Giới tính", ageAtStudy: "Tuổi",
  description: "Mô tả", procedureDescription: "Chỉ định", modality: "Mod", bodyPart: "Bộ phận",
  status: "Trạng thái", assigned: "Phụ trách", referringPhysician: "BS CĐ", referringDepartment: "Khoa CĐ",
  technologist: "KTV", date: "Ngày chụp", machine: "Máy", images: "Ảnh", hisVisitId: "Mã LK",
  reviewerName: "BS Duyệt", reportConclusion: "Kết luận", aiStatus: "AI",
};

interface StudyDataGridAntdProps {
  studies: any[];
  isLoading: boolean;
  errorMessage?: string | null;
  selectedUid: string | null;
  startIndex: number;
  onSelect: (study: any) => void;
  onDoubleClick: (study: any) => void;
  renderActions: (study: any) => React.ReactNode;
  preferences?: WorkspacePreferences;
  onPreferencesChange?: (updates: Partial<WorkspacePreferences>) => void;
  onResetPreferences?: () => void;
}

export function StudyDataGridAntd({
  studies,
  isLoading,
  errorMessage,
  selectedUid,
  startIndex,
  onSelect,
  onDoubleClick,
  renderActions,
  preferences,
  onPreferencesChange,
  onResetPreferences,
}: StudyDataGridAntdProps) {
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const visible = preferences?.columns.visible ?? [...WORKSPACE_COLUMN_IDS];
  const order = preferences?.columns.order ?? [...WORKSPACE_COLUMN_IDS];
  const widths = preferences?.columns.widths ?? {};
  const isVis = useCallback((colId: ColumnId) => visible.includes(colId), [visible]);
  const updateColumns = useCallback((updates: Partial<WorkspacePreferences["columns"]>) => {
    if (preferences && onPreferencesChange) onPreferencesChange({ columns: { ...preferences.columns, ...updates } });
  }, [onPreferencesChange, preferences]);
  const moveColumn = (id: ColumnId, delta: number) => {
    const next = [...order]; const from = next.indexOf(id); const to = Math.max(0, Math.min(next.length - 1, from + delta));
    if (from === to) return; next.splice(from, 1); next.splice(to, 0, id); updateColumns({ order: next });
  };
  const resizeColumn = (id: ColumnId, delta: number) => updateColumns({ widths: { ...widths, [id]: Math.max(64, Math.min(640, (widths[id] ?? 140) + delta)) } });

  const columns = useMemo<ColumnsType<any>>(() => {
    const cols: ColumnsType<any> = [
      {
        title: "TT",
        key: "index",
        width: 40,
        fixed: "left",
        align: "center",
        render: (_: any, __: any, index: number) => (
          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>{startIndex + index + 1}</Text>
        )
      }
    ];

    if (isVis("patient")) {
      cols.push({
        title: "Bệnh nhân",
        key: "patient",
        fixed: "left",
        width: 220,
        render: (_: any, study: any) => {
          const patient = study.PatientMainDicomTags || {};
          return (
            <div className="flex flex-col">
              <span className="truncate font-semibold uppercase tracking-[0.01em] text-white text-sm">
                {fmtName(patient.PatientName)}
              </span>
              <span className="truncate font-mono text-sm text-gray-400">
                {fmtText(patient.PatientID)} &bull; {fmtSex(patient.PatientSex)} &bull; {fmtAge(patient.PatientAge)}T
              </span>
            </div>
          );
        }
      });
    }

    if (isVis("patientBirthDate")) cols.push({ title: "Ngày sinh", key: "patientBirthDate", width: 115, render: (_, s) => <span className="font-mono text-sm text-gray-300">{fmtText(s.patientBirthDate || s.PatientMainDicomTags?.PatientBirthDate)}</span> });
    if (isVis("patientSex")) cols.push({ title: "Giới tính", key: "patientSex", width: 90, render: (_, s) => <span className="text-sm text-gray-300">{fmtSex(s.patientSex || s.PatientMainDicomTags?.PatientSex)}</span> });
    if (isVis("ageAtStudy")) cols.push({ title: "Tuổi", key: "ageAtStudy", width: 70, align: "center", render: (_, s) => <span className="text-sm text-gray-300">{fmtText(s.ageAtStudy ?? s.PatientMainDicomTags?.PatientAge)}</span> });

    if (isVis("description")) {
      cols.push({
        title: "Mô tả",
        key: "description",
        width: 260,
        render: (_: any, study: any) => {
          const main = study.MainDicomTags || {};
          return (
            <div className="flex flex-col">
              <span className="truncate font-medium text-sm text-gray-300" title={study.procedureDescription || main.StudyDescription || ""}>
                {fmtText(study.procedureName || study.procedureDescription || main.StudyDescription)}
              </span>
              <span className="truncate font-mono text-sm text-gray-500">
                {fmtText(study.procedureCode || main.AccessionNumber)}{study.serviceTypeName ? ` · ${study.serviceTypeName}` : ""}
              </span>
            </div>
          );
        }
      });
    }

    if (isVis("procedureDescription")) cols.push({ title: "Chỉ định", key: "procedureDescription", width: 210, render: (_, s) => <Tooltip title={s.procedureDescription}><div className="truncate text-sm text-gray-300">{fmtText(s.procedureDescription)}</div></Tooltip> });

    if (isVis("modality")) {
      cols.push({
        title: "Mod",
        key: "modality",
        align: "center",
        width: 70,
        render: (_: any, study: any) => {
          const main = study.MainDicomTags || {};
          return <ModBadge value={study.EnrichedModality || main.Modality} isNonDicom={study.isNonDicom} />;
        }
      });
    }
    if (isVis("bodyPart")) cols.push({ title: "Bộ phận", key: "bodyPart", width: 120, render: (_, s) => <div className="truncate text-sm text-gray-300">{fmtText(s.bodyPart)}</div> });

    if (isVis("status")) {
      cols.push({
        title: "Trạng thái",
        key: "status",
        align: "center",
        width: 140,
        render: (_: any, study: any) => {
          return (
            <div className="flex flex-col items-center">
              <RisStatusBadge status={study.WorkflowStatus} />
              {(study.hisSyncStatus || study.hisResultStatus) && (
                <div className="mt-1 flex flex-col items-center gap-0.5 text-sm font-semibold">
                  {study.hisSyncStatus && (
                    <span className={study.hisSyncStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}>
                      HIS Sync: {study.hisSyncStatus}
                    </span>
                  )}
                  {study.hisResultStatus && (
                    <span className={study.hisResultStatus === 'FAILED' ? 'text-red-400' : 'text-emerald-400'}>
                      HIS Result: {study.hisResultStatus}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        }
      });
    }

    if (isVis("assigned")) {
      cols.push({
        title: "Phụ trách",
        key: "assigned",
        width: 160,
        render: (_: any, study: any) => {
          return (
            <div className="flex flex-col">
              <span className={`truncate font-semibold text-sm ${study.AssignedDoctorName ? "text-gray-300" : "text-amber-200"}`}>
                {study.AssignedDoctorName || "Chưa gán bác sĩ"}
              </span>
              <span className="truncate text-sm text-gray-500">
                {study.ReportDoctorName ? `Report: ${study.ReportDoctorName}` : `SLA: ${fmtDuration(study.waitingMinutes)}`}
              </span>
            </div>
          );
        }
      });
    }

    if (isVis("referringDepartment")) cols.push({ title: "Khoa CĐ", key: "referringDepartment", width: 140, render: (_, s) => <div className="truncate text-sm text-gray-300">{fmtText(s.referringDepartment)}</div> });
    if (isVis("referringPhysician")) cols.push({ title: "BS CĐ", key: "referringPhysician", width: 150, render: (_, s) => <div className="truncate text-sm text-gray-300">{fmtText(s.referringPhysician)}</div> });
    if (isVis("technologist")) cols.push({ title: "KTV", key: "technologist", width: 140, render: (_, s) => <div className="truncate text-sm text-gray-300">{fmtText(s.technologistName || s.TechnologistName)}</div> });

    if (isVis("date")) {
      cols.push({
        title: "Ngày chụp",
        key: "date",
        width: 160,
        render: (_: any, study: any) => {
          const main = study.MainDicomTags || {};
          return (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-mono text-sm text-gray-300">
                {study.studyDate ? fmtDateTimeIso(study.studyDate) : fmtDateTime(main.StudyDate, main.StudyTime)}
              </span>
              <span className="truncate font-sans text-sm text-gray-500">
                {study.machineName || study.stationAeTitle || "-"}{study.facilityName ? ` · ${study.facilityName}` : ""}
              </span>
            </div>
          );
        }
      });
    }

    if (isVis("machine")) cols.push({ title: "Máy", key: "machine", width: 145, render: (_, s) => <div className="truncate font-mono text-sm text-gray-300">{fmtText(s.machineName || s.stationAeTitle)}</div> });

    if (isVis("images")) {
      cols.push({
        title: "Ảnh",
        key: "images",
        align: "center",
        width: 60,
        render: (_: any, study: any) => (
          <span className="font-mono text-sm text-gray-500">{study.EnrichedInstancesCount ?? study.Instances?.length ?? "-"}</span>
        ),
      });
    }

    if (isVis("hisVisitId")) cols.push({ title: "Mã LK", key: "hisVisitId", width: 130, render: (_, s) => <div className="truncate font-mono text-sm text-gray-300">{fmtText(s.hisVisitId)}</div> });
    if (isVis("reviewerName")) cols.push({ title: "BS Duyệt", key: "reviewerName", width: 150, render: (_, s) => <div className="truncate text-sm text-gray-300">{fmtText(s.reviewerName)}</div> });
    if (isVis("reportConclusion")) cols.push({ title: "Kết luận", key: "reportConclusion", width: 260, render: (_, s) => <Tooltip title={s.reportConclusion}><div className="truncate text-sm text-gray-300">{fmtText(s.reportConclusion)}</div></Tooltip> });
    if (isVis("aiStatus")) cols.push({ title: "AI", key: "aiStatus", width: 105, align: "center", render: (_, s) => <span className={`text-sm font-semibold ${s.aiStatus === "ABNORMAL" ? "text-red-400" : s.aiStatus === "NORMAL" ? "text-emerald-400" : "text-gray-400"}`}>{s.aiStatus === "ABNORMAL" ? `Bất thường${s.aiFindingCount != null ? ` (${s.aiFindingCount})` : ""}` : s.aiStatus === "NORMAL" ? "Bình thường" : s.aiStatus === "RUNNING" ? "Đang chạy" : s.aiStatus === "FAILED" ? "Lỗi" : "-"}</span> });

    cols.push({
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 60,
      align: "center",
      render: (_: any, study: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          {renderActions(study)}
        </div>
      ),
    });

    const fixed = cols.filter(c => c.key === "index" || c.key === "actions");
    const dynamic = cols.filter(c => c.key !== "index" && c.key !== "actions");
    dynamic.sort((a, b) => order.indexOf(a.key as ColumnId) - order.indexOf(b.key as ColumnId));
    dynamic.forEach(c => { c.width = widths[c.key as ColumnId] ?? c.width; });
    return [fixed[0], ...dynamic, fixed[1]];
  }, [isVis, order, renderActions, startIndex, widths]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-9 flex-none items-center justify-end border-b border-[#303030] bg-[#141414] px-2">
        <Dropdown open={columnMenuOpen} onOpenChange={setColumnMenuOpen} trigger={["click"]} placement="bottomRight" dropdownRender={() => (
          <div className="max-h-[70vh] w-[360px] overflow-y-auto rounded border border-[#303030] bg-[#1f1f1f] p-2 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between border-b border-[#303030] pb-2"><strong className="text-gray-200">Cấu hình cột</strong><div className="flex gap-1"><Button size="small" type={preferences?.density === "compact" ? "primary" : "default"} onClick={() => onPreferencesChange?.({ density: "compact" })}>Gọn</Button><Button size="small" type={preferences?.density === "comfortable" ? "primary" : "default"} onClick={() => onPreferencesChange?.({ density: "comfortable" })}>Thoáng</Button><Tooltip title="Khôi phục mặc định"><Button size="small" icon={<RotateCcw size={14} />} onClick={onResetPreferences} /></Tooltip></div></div>
            {order.map((id, index) => <div key={id} className="flex items-center gap-1 py-1"><Checkbox checked={visible.includes(id)} onChange={e => { const next = e.target.checked ? [...visible, id] : visible.filter(x => x !== id); if (next.length) updateColumns({ visible: Array.from(new Set(next)) }); }}><span className="inline-block w-[105px] truncate text-gray-300">{COLUMN_LABELS[id]}</span></Checkbox><Button size="small" type="text" disabled={!index} icon={<ArrowUp size={13} />} onClick={() => moveColumn(id, -1)} /><Button size="small" type="text" disabled={index === order.length - 1} icon={<ArrowDown size={13} />} onClick={() => moveColumn(id, 1)} /><Button size="small" type="text" icon={<Minus size={13} />} onClick={() => resizeColumn(id, -16)} /><span className="w-10 text-center font-mono text-sm text-gray-500">{widths[id] ?? 140}</span><Button size="small" type="text" icon={<Plus size={13} />} onClick={() => resizeColumn(id, 16)} /></div>)}
          </div>
        )}><Button size="small" icon={<Columns3 size={14} />}>Cột ({visible.length})</Button></Dropdown>
      </div>
      {errorMessage ? (
        <div className="p-4 text-center text-red-400">{errorMessage}</div>
      ) : (
        <Table
          size={preferences?.density === "compact" ? "small" : "middle"}
          className="h-full"
          dataSource={studies}
          columns={columns}
          rowKey={(study) => study.ID || study.id || study.MainDicomTags?.StudyInstanceUID}
          loading={isLoading}
          pagination={false}
          scroll={{ x: "max-content", y: "calc(42vh - 116px)" }}
          virtual // Enable virtualization for performance
          rowClassName={(record) => {
            const uid = record.ID || record.id || record.MainDicomTags?.StudyInstanceUID;
            return uid === selectedUid ? "bg-[#13C2C2] text-white" : "";
          }}
          onRow={(record, index) => ({
            onClick: () => onSelect(record),
            onDoubleClick: () => onDoubleClick(record),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDoubleClick(record);
              } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const delta = e.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = Math.max(0, Math.min(studies.length - 1, (index ?? 0) + delta));
                const nextItem = studies[nextIndex];
                onSelect(nextItem);
                
                // Focus management would go here if needed, but table handles its own focus sometimes
                const rows = document.querySelectorAll('.ant-table-row');
                if (rows[nextIndex]) {
                  (rows[nextIndex] as HTMLElement).focus();
                }
              }
            },
            tabIndex: 0,
            style: { cursor: "pointer" },
          })}
        />
      )}
    </div>
  );
}
