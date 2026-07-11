import React, { KeyboardEvent, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { DataGridRoot, DataGridHeader, DataGridBody, DataGridRow, DataGridCell } from "../ui/data-grid/DataGrid";
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
  const isCompact = preferences?.density === "compact";
  const isVis = (colId: typeof WorkspaceColumnIdSchema._type) =>
    !preferences || preferences.columns.visible.includes(colId);

  const gridRef = useRef<HTMLDivElement>(null);

  const shouldFocusSelectedRow = useRef(false);

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, index: number) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(studies.length - 1, index + delta));
      shouldFocusSelectedRow.current = true;
      onSelect(studies[nextIndex]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onDoubleClick(studies[index]);
    }
  };

  // Scroll active row into view
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (activeRowRef.current && gridRef.current) {
      const container = gridRef.current;
      const row = activeRowRef.current;
      const containerRect = container.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();

      // Check if row is fully visible vertically
      if (rowRect.top < containerRect.top + 40 /* header offset */) {
        container.scrollTop += rowRect.top - containerRect.top - 40;
      } else if (rowRect.bottom > containerRect.bottom) {
        container.scrollTop += rowRect.bottom - containerRect.bottom;
      }

      if (shouldFocusSelectedRow.current) {
        activeRowRef.current.focus({ preventScroll: true });
        shouldFocusSelectedRow.current = false;
      }
    }
  }, [selectedUid]);

  return (
    <DataGridRoot ref={gridRef} aria-label="Danh sách ca chụp" aria-busy={isLoading}>
      <DataGridHeader>
        <tr>
          <DataGridCell isHeader pinned="left" className="w-9 min-w-9 text-center" compact={isCompact}>
            TT
          </DataGridCell>
          {isVis("patient") && (
            <DataGridCell isHeader pinned="left" pinnedOffset={36} shadow className="min-w-[200px]" compact={isCompact}>
              Bệnh nhân
            </DataGridCell>
          )}
          {isVis("description") && <DataGridCell isHeader compact={isCompact}>Mô tả</DataGridCell>}
          {isVis("modality") && <DataGridCell isHeader className="text-center" compact={isCompact}>Mod</DataGridCell>}
          {isVis("status") && <DataGridCell isHeader className="text-center" compact={isCompact}>Trạng thái</DataGridCell>}
          {isVis("assigned") && <DataGridCell isHeader compact={isCompact}>Phụ trách</DataGridCell>}
          {isVis("date") && <DataGridCell isHeader compact={isCompact}>Ngày chụp</DataGridCell>}
          {isVis("images") && <DataGridCell isHeader className="text-center" compact={isCompact}>Ảnh</DataGridCell>}
          <DataGridCell isHeader pinned="right" shadow className="w-10 text-center" compact={isCompact}>
            Thao tác
          </DataGridCell>
        </tr>
      </DataGridHeader>

      <DataGridBody>
        {isLoading ? (
          <tr>
            <td colSpan={9} className="py-12 text-center text-vin-muted">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
              Đang tải danh sách ca chụp...
            </td>
          </tr>
        ) : errorMessage ? (
          <tr>
            <td colSpan={9} role="alert" className="py-12 text-center text-red-300">
              {errorMessage}
            </td>
          </tr>
        ) : studies.length === 0 ? (
          <tr>
            <td colSpan={9} className="py-12 text-center text-vin-muted">
              Không có ca chụp nào.
            </td>
          </tr>
        ) : (
          studies.map((study, index) => {
            const uid = study.MainDicomTags?.StudyInstanceUID;
            const isSelected = uid === selectedUid;
            const patient = study.PatientMainDicomTags || {};
            const main = study.MainDicomTags || {};

            return (
              <DataGridRow
                key={study.ID || uid}
                isSelected={isSelected}
                aria-selected={isSelected}
                tabIndex={isSelected || (!selectedUid && index === 0) ? 0 : -1}
                onClick={(event) => {
                  onSelect(study);
                  event.currentTarget.focus();
                }}
                onKeyDown={(event) => handleRowKeyDown(event, index)}
                onDoubleClick={() => onDoubleClick(study)}
                ref={isSelected ? activeRowRef : null}
                title="Click: chọn · Enter/Space: mở OHIF"
              >
                <DataGridCell pinned="left" className="w-9 min-w-9 text-center font-mono text-vin-text" compact={isCompact}>
                  {startIndex + index + 1}
                </DataGridCell>
                {isVis("patient") && (
                  <DataGridCell pinned="left" pinnedOffset={36} shadow className="min-w-[200px]" compact={isCompact}>
                    <div className="max-w-[210px] truncate font-semibold uppercase tracking-[0.01em] text-white">
                      {fmtName(patient.PatientName)}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
                      {fmtText(patient.PatientID)} &bull; {fmtSex(patient.PatientSex)} &bull; {fmtAge(patient.PatientAge)}T
                    </div>
                  </DataGridCell>
                )}
                {isVis("description") && (
                  <DataGridCell compact={isCompact}>
                    <div className="max-w-[260px] truncate font-medium text-vin-text2" title={study.procedureDescription || main.StudyDescription || ""}>
                      {fmtText(study.procedureName || study.procedureDescription || main.StudyDescription)}
                    </div>
                    <div className="mt-0.5 max-w-[260px] truncate font-mono text-[10px] text-vin-muted">
                      {fmtText(study.procedureCode || main.AccessionNumber)}{study.serviceTypeName ? ` · ${study.serviceTypeName}` : ""}
                    </div>
                  </DataGridCell>
                )}
                {isVis("modality") && (
                  <DataGridCell className="text-center" compact={isCompact}>
                    <ModBadge value={study.EnrichedModality || main.Modality} isNonDicom={study.isNonDicom} />
                  </DataGridCell>
                )}
                {isVis("status") && (
                  <DataGridCell className="text-center" compact={isCompact}>
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
                  </DataGridCell>
                )}
                {isVis("assigned") && (
                  <DataGridCell compact={isCompact}>
                    <div className={`max-w-[150px] truncate font-semibold ${study.AssignedDoctorName ? "text-vin-text2" : "text-amber-200"}`}>
                      {study.AssignedDoctorName || "Chua gan bac si"}
                    </div>
                    <div className="mt-0.5 max-w-[150px] truncate text-[10px] text-vin-muted">
                      {study.ReportDoctorName ? `Report: ${study.ReportDoctorName}` : `SLA: ${fmtDuration(study.waitingMinutes)}`}
                    </div>
                  </DataGridCell>
                )}
                {isVis("date") && (
                  <DataGridCell className="whitespace-nowrap font-mono text-vin-text2" compact={isCompact}>
                    {fmtDateTime(main.StudyDate, main.StudyTime)}
                    <div className="mt-0.5 max-w-[140px] truncate font-sans text-[10px] text-vin-muted">
                      {study.machineName || study.stationAeTitle || "-"}{study.facilityName ? ` · ${study.facilityName}` : ""}
                    </div>
                  </DataGridCell>
                )}
                {isVis("images") && (
                  <DataGridCell className="text-center font-mono text-vin-muted" compact={isCompact}>
                    {study.EnrichedInstancesCount ?? study.Instances?.length ?? "-"}
                  </DataGridCell>
                )}
                <DataGridCell pinned="right" shadow className="text-center" onClick={(e) => e.stopPropagation()} compact={isCompact}>
                  {renderActions(study)}
                </DataGridCell>
              </DataGridRow>
            );
          })
        )}
      </DataGridBody>
    </DataGridRoot>
  );
}
