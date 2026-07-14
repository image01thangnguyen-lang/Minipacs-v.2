"use client";

import React, { useMemo } from "react";
import { Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { fmtName, fmtText, fmtSex, fmtAge, fmtDateTime, fmtDuration } from "./formatters";
import { ModBadge, RisStatusBadge } from "./badges";
import { WorkspaceColumnIdSchema, WorkspacePreferences } from "../../../lib/preferences/workspace-preferences";

const { Text } = Typography;

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
}: StudyDataGridAntdProps) {
  const isVis = (colId: typeof WorkspaceColumnIdSchema._type) =>
    !preferences || preferences.columns.visible.includes(colId);

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
              <span className="truncate font-semibold uppercase tracking-[0.01em] text-white text-[12px]">
                {fmtName(patient.PatientName)}
              </span>
              <span className="truncate font-mono text-[10px] text-gray-400">
                {fmtText(patient.PatientID)} &bull; {fmtSex(patient.PatientSex)} &bull; {fmtAge(patient.PatientAge)}T
              </span>
            </div>
          );
        }
      });
    }

    if (isVis("description")) {
      cols.push({
        title: "Mô tả",
        key: "description",
        width: 260,
        render: (_: any, study: any) => {
          const main = study.MainDicomTags || {};
          return (
            <div className="flex flex-col">
              <span className="truncate font-medium text-[12px] text-gray-300" title={study.procedureDescription || main.StudyDescription || ""}>
                {fmtText(study.procedureName || study.procedureDescription || main.StudyDescription)}
              </span>
              <span className="truncate font-mono text-[10px] text-gray-500">
                {fmtText(study.procedureCode || main.AccessionNumber)}{study.serviceTypeName ? ` · ${study.serviceTypeName}` : ""}
              </span>
            </div>
          );
        }
      });
    }

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
                <div className="mt-1 flex flex-col items-center gap-0.5 text-[9px] font-semibold">
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
              <span className={`truncate font-semibold text-[11px] ${study.AssignedDoctorName ? "text-gray-300" : "text-amber-200"}`}>
                {study.AssignedDoctorName || "Chưa gán bác sĩ"}
              </span>
              <span className="truncate text-[10px] text-gray-500">
                {study.ReportDoctorName ? `Report: ${study.ReportDoctorName}` : `SLA: ${fmtDuration(study.waitingMinutes)}`}
              </span>
            </div>
          );
        }
      });
    }

    if (isVis("date")) {
      cols.push({
        title: "Ngày chụp",
        key: "date",
        width: 160,
        render: (_: any, study: any) => {
          const main = study.MainDicomTags || {};
          return (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-mono text-[11px] text-gray-300">
                {fmtDateTime(main.StudyDate, main.StudyTime)}
              </span>
              <span className="truncate font-sans text-[10px] text-gray-500">
                {study.machineName || study.stationAeTitle || "-"}{study.facilityName ? ` · ${study.facilityName}` : ""}
              </span>
            </div>
          );
        }
      });
    }

    if (isVis("images")) {
      cols.push({
        title: "Ảnh",
        key: "images",
        align: "center",
        width: 60,
        render: (_: any, study: any) => (
          <span className="font-mono text-[11px] text-gray-500">{study.EnrichedInstancesCount ?? study.Instances?.length ?? "-"}</span>
        ),
      });
    }

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

    return cols;
  }, [preferences?.columns.visible, startIndex, renderActions, isVis]);

  return (
    <div className="flex-1 overflow-hidden">
      {errorMessage ? (
        <div className="p-4 text-center text-red-400">{errorMessage}</div>
      ) : (
        <Table
          size="small"
          className="h-full"
          dataSource={studies}
          columns={columns}
          rowKey={(study) => study.ID || study.MainDicomTags?.StudyInstanceUID}
          loading={isLoading}
          pagination={false}
          scroll={{ x: "max-content", y: "calc(42vh - 80px)" }} // Virtualization height
          virtual // Enable virtualization for performance
          rowClassName={(record) => {
            const uid = record.ID || record.MainDicomTags?.StudyInstanceUID;
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
