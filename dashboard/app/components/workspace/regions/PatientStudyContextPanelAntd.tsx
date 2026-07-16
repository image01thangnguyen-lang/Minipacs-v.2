"use client";

import React, { useEffect, useRef, useState } from "react";
import { Spin, Typography, Divider, Tag, Alert } from "antd";
import { getStudyWorkspaceAction } from "../../../actions/study-workspace-actions";
import type { StudyWorkspaceDetail, StudyWorkspaceError } from "../../../../lib/workspace/study-workspace";
import { fmtName, fmtSex, fmtDateTime, fmtDateTimeIso } from "../formatters";
import { RisStatusBadge } from "../badges";
import { ConsultationContextAntd } from "./context/ConsultationContextAntd";
import { SecondReadContextAntd } from "./context/SecondReadContextAntd";
import { ViewerArtifactsContextAntd } from "./context/ViewerArtifactsContextAntd";

const { Text } = Typography;

interface PatientStudyContextPanelAntdProps {
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
      <Text type="secondary" className="min-w-[90px] text-sm font-bold uppercase tracking-wide">{label}</Text>
      <span className={`truncate text-sm text-gray-300 ${mono ? "font-mono" : ""}`}>{value || "-"}</span>
    </div>
  );
}

export function PatientStudyContextPanelAntd({ studyUid }: PatientStudyContextPanelAntdProps) {
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
    <div className="flex h-full flex-col bg-[#141414]">
      <div className="flex h-12 flex-none items-center border-b border-[#303030] px-4">
        <h2 className="text-sm font-bold text-gray-300">Thông tin bệnh nhân &amp; ca chụp</h2>
      </div>

      {state.kind === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <Text type="secondary" className="text-sm">Chọn một ca chụp để xem chi tiết</Text>
        </div>
      )}

      {state.kind === "loading" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <Spin />
          <Text type="secondary" className="mt-2 text-sm">Đang tải...</Text>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <Alert
            type="error"
            message={
              state.error === "NOT_FOUND" ? "Không tìm thấy ca chụp" :
              state.error === "DENIED" ? "Bạn không có quyền xem ca chụp này" :
              state.error === "UNAUTHORIZED" ? "Phiên đăng nhập hết hạn" :
              "Hệ thống tạm thời không thể tải dữ liệu"
            }
            showIcon
          />
        </div>
      )}

      {state.kind === "loaded" && (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <section aria-label="Patient information">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#13C2C2]">Bệnh nhân</h3>
            <InfoRow label="Họ tên" value={fmtName(state.data.patientName || undefined)} />
            <InfoRow label="Mã BN" value={state.data.patientId} mono />
            <InfoRow label="Giới tính" value={fmtSex(state.data.patientSex || undefined)} />
            <InfoRow label="Ngày sinh" value={state.data.patientBirthDate} />
          </section>

          <Divider className="my-3 border-[#303030]" />

          <section aria-label="Study information">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#13C2C2]">Ca chụp</h3>
            <InfoRow label="Ngày chụp" value={fmtDateTime(state.data.studyDate || undefined)} />
            <InfoRow label="Mô tả" value={state.data.studyDescription} />
            <InfoRow label="Modality" value={state.data.modality} />
            <InfoRow label="Accession" value={state.data.accessionNumber} mono />
            <InfoRow label="Cơ sở" value={state.data.facilityName} />
            <InfoRow label="BS đọc" value={state.data.assignedDoctorName} />
          </section>

          <Divider className="my-3 border-[#303030]" />

          <section aria-label="Study status">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#13C2C2]">Trạng thái</h3>
            <div className="flex flex-wrap gap-2 py-1">
              <RisStatusBadge status={state.data.status} />
              {state.data.reportStatus && (
                <Tag className="rounded-full px-2 py-0.5 text-sm font-semibold bg-[#1F1F1F] border-[#303030] text-gray-300">
                  Report: {state.data.reportStatus}
                </Tag>
              )}
            </div>
            {state.data.reportUpdatedAt && (
              <InfoRow label="Cập nhật" value={fmtDateTimeIso(state.data.reportUpdatedAt)} />
            )}
          </section>

          <Divider className="my-3 border-[#303030]" />

          <section aria-label="Available actions">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#13C2C2]">Tác vụ khả dụng</h3>
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

          <ConsultationContextAntd
            studyInstanceUid={state.data.studyUid || studyUid || ""}
            patientName={state.data.patientName || 'Chưa rõ'}
            canCreate={state.data.allowedActions.createConsultation}
          />

          <SecondReadContextAntd
            studyInstanceUid={state.data.studyUid || studyUid || ""}
            canRequest={state.data.allowedActions.assignCase}
          />

          <ViewerArtifactsContextAntd
            studyInstanceUid={state.data.studyUid || studyUid || ""}
          />
        </div>
      )}
    </div>
  );
}

function ActionTag({ label }: { label: string }) {
  return (
    <Tag color="cyan" className="rounded px-2 py-0.5 text-sm font-medium border-0 bg-[#13C2C2]/10 text-[#13C2C2]">
      {label}
    </Tag>
  );
}
