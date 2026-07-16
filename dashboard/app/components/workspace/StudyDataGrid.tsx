import React, { useMemo } from "react";
import { SharedDataGrid } from "../ui/data-grid/DataGrid";
import { ColumnDef } from "../ui/shared-contracts";
import { fmtName, fmtText, fmtSex, fmtAge, fmtDateTime, fmtDateTimeIso, fmtDuration } from "./formatters";
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
  const visibleColumns = preferences?.columns.visible;

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const isVis = (colId: typeof WorkspaceColumnIdSchema._type) =>
      !visibleColumns || visibleColumns.includes(colId);

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
          const patientName = study.patientName || study.PatientMainDicomTags?.PatientName;
          const patientId = study.patientId || study.PatientMainDicomTags?.PatientID;
          const sex = study.patientSex || study.PatientMainDicomTags?.PatientSex;
          const age = study.ageAtStudy ?? study.PatientMainDicomTags?.PatientAge;

          return (
            <>
              <div className="max-w-[210px] truncate font-semibold uppercase tracking-[0.01em] text-white">
                {fmtName(patientName)}
              </div>
              <div className="mt-0.5 truncate font-mono text-sm text-vin-muted">
                {fmtText(patientId)} &bull; {fmtSex(sex)} &bull; {age != null ? `${fmtAge(age)}T` : "-"}
              </div>
            </>
          );
        }
      });
    }

    if (isVis("patientBirthDate")) {
      cols.push({
        id: "patientBirthDate",
        header: "Ngày sinh",
        cell: (study) => {
          return <div className="font-mono text-vin-text2">{study.patientBirthDate ? fmtDateTimeIso(study.patientBirthDate).split(" ")[0] : "-"}</div>;
        }
      });
    }

    if (isVis("hisVisitId")) {
      cols.push({
        id: "hisVisitId",
        header: "Mã LK",
        cell: (study) => <div className="font-mono text-vin-text2">{fmtText(study.hisVisitId)}</div>
      });
    }

    if (isVis("patientSex")) {
      cols.push({
        id: "patientSex",
        header: "Giới tính",
        cell: (study) => <div className="text-vin-text2">{fmtSex(study.patientSex || study.PatientMainDicomTags?.PatientSex)}</div>
      });
    }

    if (isVis("ageAtStudy")) {
      cols.push({
        id: "ageAtStudy",
        header: "Tuổi",
        cell: (study) => {
          const age = study.ageAtStudy ?? study.PatientMainDicomTags?.PatientAge;
          return <div className="text-vin-text2">{age != null ? `${fmtAge(age)}` : "-"}</div>;
        }
      });
    }

    if (isVis("description")) {
      cols.push({
        id: "description",
        header: "Mô tả",
        cell: (study) => {
          const main = study.MainDicomTags || {};
          const procDesc = study.procedureDescription || main.StudyDescription;
          const accNumber = study.accessionNumber || main.AccessionNumber;
          return (
            <>
              <div className="max-w-[260px] truncate font-medium text-vin-text2" title={procDesc || ""}>
                {fmtText(study.procedureName || procDesc)}
              </div>
              <div className="mt-0.5 max-w-[260px] truncate font-mono text-sm text-vin-muted">
                {fmtText(study.procedureCode || accNumber)}{study.serviceTypeName ? ` · ${study.serviceTypeName}` : ""}
              </div>
            </>
          );
        }
      });
    }

    if (isVis("procedureDescription")) {
      cols.push({
        id: "procedureDescription",
        header: "Chỉ định",
        cell: (study) => <div className="max-w-[200px] truncate">{fmtText(study.procedureDescription)}</div>
      });
    }

    if (isVis("bodyPart")) {
      cols.push({
        id: "bodyPart",
        header: "Bộ phận",
        cell: (study) => <div className="text-vin-text2">{fmtText(study.bodyPart)}</div>
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
              <RisStatusBadge status={study.status || study.WorkflowStatus} />
              {(study.hisSyncStatus || study.hisResultStatus) && (
                <div className="mt-1 flex flex-col gap-0.5 text-sm font-semibold">
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
          const assignedName = study.assignedDoctorName || study.AssignedDoctorName;
          return (
            <>
              <div className={`max-w-[150px] truncate font-semibold ${assignedName ? "text-vin-text2" : "text-amber-200"}`}>
                {assignedName || "Chưa gán bác sĩ"}
              </div>
              <div className="mt-0.5 flex max-w-[150px] items-center gap-1 truncate text-sm text-vin-muted">
                <span>{study.ReportDoctorName ? `Report: ${study.ReportDoctorName}` : `SLA: ${fmtDuration(study.waitingMinutes) || "-"}`}</span>
                {study.slaStatus && <SlaStatusBadge status={study.slaStatus} />}
              </div>
            </>
          );
        }
      });
    }

    if (isVis("reviewerName")) {
      cols.push({
        id: "reviewerName",
        header: "BS Duyệt",
        cell: (study) => <div className="max-w-[150px] truncate text-vin-text2">{fmtText(study.reviewerName)}</div>
      });
    }

    if (isVis("reportConclusion")) {
      cols.push({
        id: "reportConclusion",
        header: "Kết luận",
        cell: (study) => (
          <div className="max-w-[250px] truncate text-sm text-vin-text2" title={study.reportConclusion || ""}>
            {fmtText(study.reportConclusion)}
          </div>
        )
      });
    }

    if (isVis("aiStatus")) {
      cols.push({
        id: "aiStatus",
        header: "AI",
        align: "center",
        cell: (study) => {
          if (!study.aiStatus || study.aiStatus === "NOT_RUN") {
            return <span className="text-sm text-vin-muted">-</span>;
          }
          if (study.aiStatus === "RUNNING") {
            return <span className="text-sm text-blue-400">Đang chạy</span>;
          }
          if (study.aiStatus === "NORMAL") {
            return <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-sm font-semibold text-emerald-400">Bình thường</span>;
          }
          if (study.aiStatus === "ABNORMAL") {
            return <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-sm font-bold text-red-400" title={`Số lượng bất thường: ${study.aiFindingCount || 0}`}>Bất thường</span>;
          }
          if (study.aiStatus === "FAILED") {
            return <span className="text-sm text-red-500">Lỗi</span>;
          }
          return <span className="text-sm text-vin-muted">{study.aiStatus}</span>;
        }
      });
    }

    if (isVis("referringDepartment")) {
      cols.push({
        id: "referringDepartment",
        header: "Khoa CĐ",
        cell: (study) => <div className="text-vin-text2">{fmtText(study.referringDepartment)}</div>
      });
    }

    if (isVis("referringPhysician")) {
      cols.push({
        id: "referringPhysician",
        header: "BS CĐ",
        cell: (study) => <div className="text-vin-text2">{fmtText(study.referringPhysician)}</div>
      });
    }

    if (isVis("technologist")) {
      cols.push({
        id: "technologist",
        header: "KTV",
        cell: (study) => <div className="text-vin-text2">{fmtText(study.technologistName)}</div>
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
              {study.studyDate ? fmtDateTimeIso(study.studyDate) : fmtDateTime(main.StudyDate, main.StudyTime)}
              <div className="mt-0.5 max-w-[140px] truncate font-sans text-sm text-vin-muted">
                {study.machineName || study.stationAeTitle || "-"}{study.facilityName ? ` · ${study.facilityName}` : ""}
              </div>
            </div>
          );
        }
      });
    }

    if (isVis("machine")) {
      cols.push({
        id: "machine",
        header: "Máy",
        cell: (study) => <div className="font-mono text-vin-text2">{study.machineName || study.stationAeTitle || "-"}</div>
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
  }, [visibleColumns, startIndex, renderActions]);

  const selectedIds = selectedUid ? [selectedUid] : [];

  return (
    <SharedDataGrid
      aria-label="Danh sách ca chụp"
      data={studies}
      columns={columns}
      getRowId={(study) => study.ID || study.id || study.MainDicomTags?.StudyInstanceUID}
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

function SlaStatusBadge({ status }: { status: string }) {
  const classes = status === "VIOLATED"
    ? "bg-red-900/40 text-red-300"
    : status === "WARNING"
      ? "bg-amber-900/40 text-amber-300"
      : status === "NORMAL"
        ? "bg-emerald-900/40 text-emerald-300"
        : "bg-vin-sidebar text-vin-muted";
  const label = status === "VIOLATED" ? "Quá hạn" : status === "WARNING" ? "Sắp hạn" : status === "NORMAL" ? "Đúng hạn" : status;
  return <span className={`rounded px-1 py-0.5 font-semibold ${classes}`}>{label}</span>;
}
