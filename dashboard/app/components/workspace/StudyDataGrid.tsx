import React, { useMemo } from "react";
import { SharedDataGrid } from "../ui/data-grid/DataGrid";
import { ColumnDef } from "../ui/shared-contracts";
import { fmtName, fmtText, fmtSex, fmtAge, fmtDateTime, fmtDuration } from "./formatters";
import { ModBadge, RisStatusBadge } from "./badges";
import { WorkspaceColumnIdSchema, WorkspacePreferences } from "../../../lib/preferences/workspace-preferences";

interface StudyDataGridProps {
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

export function StudyDataGrid({
  studies,
  isLoading,
  errorMessage,
  selectedUid,
  startIndex,
  onSelect,
  onDoubleClick,
  renderActions,
  preferences,
}: StudyDataGridProps) {
  const isVis = (colId: typeof WorkspaceColumnIdSchema._type) =>
    !preferences || preferences.columns.visible.includes(colId);

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        id: "index",
        header: "TT",
        pinned: "left",
        width: 36,
        align: "center",
        cell: (_, index) => <span className="font-mono text-vin-text">{startIndex + index + 1}</span>,
      }
    ];

    if (isVis("patient")) {
      cols.push({
        id: "patient",
        header: "Bệnh nhân",
        pinned: "left",
        pinnedOffset: 36,
        minWidth: 200,
        cell: (study) => {
          const patient = study.PatientMainDicomTags || {};
          return (
            <>
              <div className="max-w-[210px] truncate font-semibold uppercase tracking-[0.01em] text-white">
                {fmtName(patient.PatientName)}
              </div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
                {fmtText(patient.PatientID)} &bull; {fmtSex(patient.PatientSex)} &bull; {fmtAge(patient.PatientAge)}T
              </div>
            </>
          );
        }
      });
    }

    if (isVis("description")) {
      cols.push({
        id: "description",
        header: "Mô tả",
        cell: (study) => {
          const main = study.MainDicomTags || {};
          return (
            <>
              <div className="max-w-[260px] truncate font-medium text-vin-text2" title={study.procedureDescription || main.StudyDescription || ""}>
                {fmtText(study.procedureName || study.procedureDescription || main.StudyDescription)}
              </div>
              <div className="mt-0.5 max-w-[260px] truncate font-mono text-[10px] text-vin-muted">
                {fmtText(study.procedureCode || main.AccessionNumber)}{study.serviceTypeName ? ` · ${study.serviceTypeName}` : ""}
              </div>
            </>
          );
        }
      });
    }

    if (isVis("modality")) {
      cols.push({
        id: "modality",
        header: "Mod",
        align: "center",
        cell: (study) => {
          const main = study.MainDicomTags || {};
          return <ModBadge value={study.EnrichedModality || main.Modality} isNonDicom={study.isNonDicom} />;
        }
      });
    }

    if (isVis("status")) {
      cols.push({
        id: "status",
        header: "Trạng thái",
        align: "center",
        cell: (study) => {
          return (
            <>
              <RisStatusBadge status={study.WorkflowStatus} />
              {(study.hisSyncStatus || study.hisResultStatus) && (
                <div className="mt-1 flex flex-col gap-0.5 text-[9px] font-semibold">
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
            </>
          );
        }
      });
    }

    if (isVis("assigned")) {
      cols.push({
        id: "assigned",
        header: "Phụ trách",
        cell: (study) => {
          return (
            <>
              <div className={`max-w-[150px] truncate font-semibold ${study.AssignedDoctorName ? "text-vin-text2" : "text-amber-200"}`}>
                {study.AssignedDoctorName || "Chua gan bac si"}
              </div>
              <div className="mt-0.5 max-w-[150px] truncate text-[10px] text-vin-muted">
                {study.ReportDoctorName ? `Report: ${study.ReportDoctorName}` : `SLA: ${fmtDuration(study.waitingMinutes)}`}
              </div>
            </>
          );
        }
      });
    }

    if (isVis("date")) {
      cols.push({
        id: "date",
        header: "Ngày chụp",
        cell: (study) => {
          const main = study.MainDicomTags || {};
          return (
            <div className="whitespace-nowrap font-mono text-vin-text2">
              {fmtDateTime(main.StudyDate, main.StudyTime)}
              <div className="mt-0.5 max-w-[140px] truncate font-sans text-[10px] text-vin-muted">
                {study.machineName || study.stationAeTitle || "-"}{study.facilityName ? ` · ${study.facilityName}` : ""}
              </div>
            </div>
          );
        }
      });
    }

    if (isVis("images")) {
      cols.push({
        id: "images",
        header: "Ảnh",
        align: "center",
        cell: (study) => <span className="font-mono text-vin-muted">{study.EnrichedInstancesCount ?? study.Instances?.length ?? "-"}</span>,
      });
    }

    cols.push({
      id: "actions",
      header: "Thao tác",
      pinned: "right",
      width: 40,
      align: "center",
      cell: (study) => (
        <div onClick={(e) => e.stopPropagation()}>
          {renderActions(study)}
        </div>
      ),
    });

    return cols;
  }, [preferences?.columns.visible, startIndex, renderActions, isVis]);

  const selectedIds = selectedUid ? [selectedUid] : [];

  return (
    <SharedDataGrid
      aria-label="Danh sách ca chụp"
      data={studies}
      columns={columns}
      getRowId={(study) => study.ID || study.MainDicomTags?.StudyInstanceUID}
      isLoading={isLoading}
      emptyState={errorMessage ? <span className="text-red-300">{errorMessage}</span> : undefined}
      onRowClick={onSelect}
      onRowDoubleClick={onDoubleClick}
      selectedIds={selectedIds}
      density={preferences?.density}
      virtualizationThreshold={150}
    />
  );
}
