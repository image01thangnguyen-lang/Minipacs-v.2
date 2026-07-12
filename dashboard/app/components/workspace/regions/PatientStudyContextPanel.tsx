"use client";

import React, { useEffect, useRef, useState } from "react";
import { getStudyWorkspaceAction } from "../../../actions/study-workspace-actions";
import type { StudyWorkspaceDetail, StudyWorkspaceError } from "../../../../lib/workspace/study-workspace";
import { fmtName, fmtSex, fmtDateTime, fmtDateTimeIso } from "../formatters";
import { RisStatusBadge } from "../badges";
import { ConsultationContext } from "./context/ConsultationContext";
import { SecondReadContext } from "./context/SecondReadContext";
import { ViewerArtifactsContext } from "./context/ViewerArtifactsContext";

interface PatientStudyContextPanelProps {
  studyUid?: string | null;
}

type PanelState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; error: StudyWorkspaceError }
  | { kind: "loaded"; data: StudyWorkspaceDetail };

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="min-w-[90px] text-[10px] font-bold uppercase tracking-wide text-vin-muted">{label}</span>
      <span className={`truncate text-[12px] text-vin-text2 ${mono ? "font-mono" : ""}`}>{value || "-"}</span>
    </div>
  );
}

export function PatientStudyContextPanel({ studyUid }: PatientStudyContextPanelProps) {
  const [state, setState] = useState<PanelState>({ kind: "idle" });
  const raceTokenRef = useRef(0);

  useEffect(() => {
    const token = ++raceTokenRef.current;
    if (!studyUid) {
      setState({ kind: "idle" });
      return;
    }

    setState({ kind: "loading" });

    getStudyWorkspaceAction(studyUid).then((result) => {
      if (raceTokenRef.current !== token) return; // stale response discarded
      if (result.error) {
        setState({ kind: "error", error: result.error });
      } else {
        setState({ kind: "loaded", data: result.data });
      }
    }).catch(() => {
      if (raceTokenRef.current !== token) return;
      setState({ kind: "error", error: "UNAVAILABLE" });
    });
  }, [studyUid]);

  return (
    <div className="flex h-full flex-col bg-vin-panel">
      <div className="flex h-12 flex-none items-center border-b border-vin-border px-4">
        <h2 className="text-sm font-bold text-vin-text2">Thông tin bệnh nhân &amp; ca chụp</h2>
      </div>

      {state.kind === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <p className="text-[12px] text-vin-muted">Chọn một ca chụp để xem chi tiết</p>
        </div>
      )}

      {state.kind === "loading" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-vin-muted border-t-vin-accent" />
          <p className="mt-2 text-[11px] text-vin-muted">Đang tải...</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center" role="alert">
          <p className="text-[12px] font-semibold text-red-400">
            {state.error === "NOT_FOUND" && "Không tìm thấy ca chụp"}
            {state.error === "DENIED" && "Bạn không có quyền xem ca chụp này"}
            {state.error === "UNAUTHORIZED" && "Phiên đăng nhập hết hạn"}
            {state.error === "UNAVAILABLE" && "Hệ thống tạm thời không thể tải dữ liệu"}
          </p>
        </div>
      )}

      {state.kind === "loaded" && (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Patient header */}
          <section aria-label="Patient information">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-vin-accent">Bệnh nhân</h3>
            <InfoRow label="Họ tên" value={fmtName(state.data.patientName || undefined)} />
            <InfoRow label="Mã BN" value={state.data.patientId} mono />
            <InfoRow label="Giới tính" value={fmtSex(state.data.patientSex || undefined)} />
            <InfoRow label="Ngày sinh" value={state.data.patientBirthDate} />
          </section>

          <hr className="my-3 border-vin-border" />

          {/* Study metadata */}
          <section aria-label="Study information">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-vin-accent">Ca chụp</h3>
            <InfoRow label="Ngày chụp" value={fmtDateTime(state.data.studyDate || undefined)} />
            <InfoRow label="Mô tả" value={state.data.studyDescription} />
            <InfoRow label="Modality" value={state.data.modality} />
            <InfoRow label="Accession" value={state.data.accessionNumber} mono />
            <InfoRow label="Cơ sở" value={state.data.facilityName} />
            <InfoRow label="BS đọc" value={state.data.assignedDoctorName} />
          </section>

          <hr className="my-3 border-vin-border" />

          {/* Status badges */}
          <section aria-label="Study status">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-vin-accent">Trạng thái</h3>
            <div className="flex flex-wrap gap-2 py-1">
              <RisStatusBadge status={state.data.status} />
              {state.data.reportStatus && (
                <span className="rounded-full bg-vin-sidebar px-2 py-0.5 text-[10px] font-semibold text-vin-text2">
                  Report: {state.data.reportStatus}
                </span>
              )}
            </div>
            {state.data.reportUpdatedAt && (
              <InfoRow label="Cập nhật" value={fmtDateTimeIso(state.data.reportUpdatedAt)} />
            )}
          </section>

          <hr className="my-3 border-vin-border" />

          {/* Allowed actions summary (read-only affordance, no mutations) */}
          <section aria-label="Available actions">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-vin-accent">Tác vụ khả dụng</h3>
            <div className="flex flex-wrap gap-1.5 py-1">
              {state.data.allowedActions.readReport && <ActionTag label="Đọc báo cáo" />}
              {state.data.allowedActions.draftReport && <ActionTag label="Soạn báo cáo" />}
              {state.data.allowedActions.signReport && <ActionTag label="Ký báo cáo" />}
              {state.data.allowedActions.approveReport && <ActionTag label="Duyệt" />}
              {state.data.allowedActions.editClinical && <ActionTag label="Sửa lâm sàng" />}
              {state.data.allowedActions.assignCase && <ActionTag label="Phân công" />}
              {state.data.allowedActions.share && <ActionTag label="Chia sẻ" />}
              {state.data.allowedActions.export && <ActionTag label="Xuất file" />}
              {state.data.allowedActions.deliverResult && <ActionTag label="Trả kết quả" />}
            </div>
          </section>

          {/* Contextual Workflows (Consultation, Second Read, Viewer Artifacts) */}
          <ConsultationContext 
            studyInstanceUid={state.data.studyUid || studyUid || ""} 
            patientName={state.data.patientName || 'Chưa rõ'}
            canCreate={state.data.allowedActions.createConsultation} 
          />
          
          <SecondReadContext 
            studyInstanceUid={state.data.studyUid || studyUid || ""}
            canRequest={state.data.allowedActions.assignCase} // Proxied to ASSIGN_CASE per earlier logic
          />

          <ViewerArtifactsContext 
            studyInstanceUid={state.data.studyUid || studyUid || ""} 
          />
        </div>
      )}
    </div>
  );
}

function ActionTag({ label }: { label: string }) {
  return (
    <span className="rounded bg-vin-accent/10 px-2 py-0.5 text-[10px] font-medium text-vin-accent">
      {label}
    </span>
  );
}
