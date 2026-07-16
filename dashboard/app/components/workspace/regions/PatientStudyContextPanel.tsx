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
      <span className="min-w-[90px] text-sm font-bold uppercase tracking-wide text-vin-muted">{label}</span>
      <span className={`truncate text-sm text-vin-text2 ${mono ? "font-mono" : ""}`}>{value || "-"}</span>
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
          <p className="text-sm text-vin-muted">Chọn một ca chụp để xem chi tiết</p>
        </div>
      )}

      {state.kind === "loading" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-vin-muted border-t-vin-accent" />
          <p className="mt-2 text-sm text-vin-muted">Đang tải...</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center" role="alert">
          <p className="text-sm font-semibold text-red-400">
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
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-vin-accent">Bệnh nhân</h3>
            <InfoRow label="Họ tên" value={fmtName(state.data.patientName || undefined)} />
            <InfoRow label="Mã BN" value={state.data.patientId} mono />
            <InfoRow label="Mã LK" value={state.data.hisVisitId} mono />
            <InfoRow label="Giới tính" value={fmtSex(state.data.patientSex || undefined)} />
            <InfoRow label="Ngày sinh" value={state.data.patientBirthDate} />
          </section>

          <hr className="my-3 border-vin-border" />

          {/* Clinical info / Indications */}
          <section aria-label="Clinical information">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-vin-accent">Chỉ định</h3>
            <InfoRow label="Accession" value={state.data.accessionNumber} mono />
            <InfoRow label="Chỉ định" value={state.data.procedureDescription || state.data.studyDescription} />
            <InfoRow label="Bộ phận" value={state.data.bodyPart} />
            <InfoRow label="Khoa CĐ" value={state.data.referringDepartment} />
            <InfoRow label="BS Chỉ định" value={state.data.referringPhysician} />
          </section>

          <hr className="my-3 border-vin-border" />

          {/* Execution metadata */}
          <section aria-label="Execution information">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-vin-accent">Thực hiện</h3>
            <InfoRow label="Ngày chụp" value={fmtDateTime(state.data.studyDate || undefined)} />
            <InfoRow label="Modality" value={state.data.modality} />
            <InfoRow label="Máy chụp" value={state.data.machineName} />
            <InfoRow label="Cơ sở" value={state.data.facilityName} />
            <InfoRow label="KTV" value={state.data.technologistName} />
          </section>

          <hr className="my-3 border-vin-border" />

          {/* Report & Status */}
          <section aria-label="Study status">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-vin-accent">Báo cáo</h3>
            <InfoRow label="BS Đọc" value={state.data.assignedDoctorName} />
            <InfoRow label="BS Duyệt" value={state.data.reviewerName} />
            <div className="flex flex-wrap gap-2 py-1">
              <RisStatusBadge status={state.data.status} />
              {state.data.reportStatus && (
                <span className="rounded-full bg-vin-sidebar px-2 py-0.5 text-sm font-semibold text-vin-text2">
                  Report: {state.data.reportStatus}
                </span>
              )}
            </div>
            {state.data.reportUpdatedAt && (
              <InfoRow label="Cập nhật" value={fmtDateTimeIso(state.data.reportUpdatedAt)} />
            )}

            {/* Conclusion if authorized */}
            {state.data.reportConclusion && (
              <div className="mt-2 text-sm">
                <span className="font-medium text-vin-muted mr-1">Kết luận:</span>
                <span className="text-vin-text2">{state.data.reportConclusion}</span>
              </div>
            )}
          </section>

          <hr className="my-3 border-vin-border" />

          {/* AI Analysis */}
          <section aria-label="AI Analysis">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-vin-accent">Phân tích AI</h3>
            {(!state.data.aiStatus || state.data.aiStatus === "NOT_RUN") ? (
              <div className="text-sm text-vin-muted italic">Chưa chạy AI</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 py-1">
                  {state.data.aiStatus === "RUNNING" && <span className="text-sm text-blue-400">Đang chạy</span>}
                  {state.data.aiStatus === "NORMAL" && <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-sm font-semibold text-emerald-400">Bình thường</span>}
                  {state.data.aiStatus === "ABNORMAL" && <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-sm font-bold text-red-400">Bất thường</span>}
                  {state.data.aiStatus === "FAILED" && <span className="text-sm text-red-500">Lỗi</span>}
                </div>
                {state.data.aiStatus === "ABNORMAL" && state.data.aiFindingCount != null && (
                  <InfoRow label="Số lượng" value={`${state.data.aiFindingCount} điểm`} />
                )}
                {state.data.aiSeverity && (
                  <InfoRow label="Mức độ" value={state.data.aiSeverity} />
                )}
                {(state.data.aiModelName || state.data.aiModelVersion) && (
                  <InfoRow label="Nguồn AI" value={[state.data.aiModelName, state.data.aiModelVersion].filter(Boolean).join(" · ")} />
                )}
                {state.data.aiUpdatedAt && (
                  <InfoRow label="Cập nhật" value={fmtDateTimeIso(state.data.aiUpdatedAt)} />
                )}
                <div className="mt-1 text-sm italic text-vin-muted">Thông tin hỗ trợ, không thay thế kết luận của bác sĩ.</div>
              </>
            )}
          </section>

          <hr className="my-3 border-vin-border" />

          {/* Allowed actions summary (read-only affordance, no mutations) */}
          <section aria-label="Available actions">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-vin-accent">Tác vụ khả dụng</h3>
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
    <span className="rounded bg-vin-accent/10 px-2 py-0.5 text-sm font-medium text-vin-accent">
      {label}
    </span>
  );
}
