"use server";

import { prisma } from "@/app/db";
import { setStudyStatus, claimStudyLock } from "@/lib/studyStatus";
import { auth } from "@/auth";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { sendReportToHis } from "@/lib/his/hisSyncService";
import { canPerformMachineAction, resolveDicomNodeIdByAETitle, type MachineActionKey } from "@/lib/authz/machine-permissions";
import { requireScopedStudyMutation } from "@/lib/authz/scope/require-scoped-access";

// ─── Types ──────────────────────────────────────────────────────

type WorkflowResult = { success: true; hisResultStatus?: string } | { success: false; error: string };

type SaveDraftInput = {
  findings?: string;
  conclusion?: string;
  recommendation?: string;
  technique?: string;
  clinicalInfo?: string;
  technologistId?: string;
  printTemplateId?: string;
};

type ClinicalInfoInput = {
  clinicalInfo?: string;
  procedureCode?: string;
  procedureDescription?: string;
  technologistId?: string;
  bodyPart?: string;
};

type IndicationInput = {
  procedureCode?: string;
  procedureDescription?: string;
};

// ─── Helpers ────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

async function requirePerm(permission: PermissionKey) {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission, user.permissions)) {
    throw new Error(`Bạn không có quyền: ${permission}`);
  }
  return user;
}

async function requireMachinePerm(permission: PermissionKey, actionKey: MachineActionKey, studyInstanceUid: string) {
  const user = await requirePerm(permission);

  const study = await prisma.imagingStudy.findUnique({
    where: { studyInstanceUid },
    select: { stationAeTitle: true }
  });

  if (study) {
    const dicomNodeId = await resolveDicomNodeIdByAETitle(study.stationAeTitle);
    const allowed = await canPerformMachineAction(user as any, dicomNodeId, actionKey);
    if (!allowed) {
      throw new Error(`Bạn không có quyền thực hiện hành động này trên thiết bị phát sinh ca chụp.`);
    }
  }
  return user;
}

async function createAuditLog(params: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      message: params.message,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

// ─── Study Workflow Actions ─────────────────────────────────────

/**
 * Assign a doctor to a study.
 * Permission: studies.assign
 */
export async function assignStudyDoctor(
  studyInstanceUid: string,
  doctorId: string
): Promise<WorkflowResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "ASSIGN_CASE",
    });

    // Verify doctor exists
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor) return { success: false, error: "Bác sĩ không tồn tại." };
    if (!doctor.isActive) return { success: false, error: "Bác sĩ đã bị vô hiệu hóa." };
    if (doctor.role !== "DOCTOR" && doctor.role !== "ADMIN") {
      return { success: false, error: "Người dùng này không phải là bác sĩ." };
    }

    await prisma.imagingStudy.update({
      where: { id: study.id },
      data: { assignedDoctorId: doctorId },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "STUDY_DOCTOR_ASSIGNED",
      entityType: "ImagingStudy",
      entityId: study.id,
      message: `Assigned doctor ${doctor.fullName} to study ${studyInstanceUid}`,
      metadata: { studyInstanceUid, doctorId, doctorName: doctor.fullName },
    });

    revalidatePath("/");
    revalidatePath("/worklist");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Start reading a study (lock for dictation).
 * Permission: reports.write
 */
export async function startReading(
  studyInstanceUid: string
): Promise<WorkflowResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "DRAFT_REPORT",
    });

    const result = await claimStudyLock(studyInstanceUid, session.user.id);

    if (!result.success) {
      return { success: false, error: result.error || "Không thể nhận đọc." };
    }

    revalidatePath("/");
    revalidatePath("/worklist");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update clinical info on the study.
 * Permission: studies.updateClinical
 */
export async function updateClinicalInfo(
  studyInstanceUid: string,
  input: ClinicalInfoInput
): Promise<WorkflowResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "EDIT_CLINICAL",
    });

    const beforeSummary = {
      clinicalInfo: study.clinicalInfo,
      procedureCode: study.procedureCode,
      procedureDescription: study.procedureDescription,
      technologistId: study.technologistId,
      bodyPart: study.bodyPart,
    };

    await prisma.imagingStudy.update({
      where: { id: study.id },
      data: {
        clinicalInfo: input.clinicalInfo ?? study.clinicalInfo,
        procedureCode: input.procedureCode ?? study.procedureCode,
        procedureDescription: input.procedureDescription ?? study.procedureDescription,
        technologistId: input.technologistId ?? study.technologistId,
        bodyPart: input.bodyPart ?? study.bodyPart,
      },
    });

    if (study.orderId) {
      await prisma.worklistOrder.update({
        where: { id: study.orderId },
        data: {
          procedureCode: input.procedureCode ?? study.procedureCode,
          procedureDescription: input.procedureDescription ?? study.procedureDescription,
          bodyPart: input.bodyPart ?? study.bodyPart,
        },
      });
    }

    await createAuditLog({
      actorUserId: session.user.id,
      action: "STUDY_CLINICAL_UPDATED",
      entityType: "ImagingStudy",
      entityId: study.id,
      message: `Updated clinical info for study ${studyInstanceUid}`,
      metadata: { studyInstanceUid, before: beforeSummary, after: input },
    });

    revalidatePath("/");
    revalidatePath("/worklist");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Add or update indication (procedure) on the study.
 * Permission: studies.updateClinical
 */
export async function addOrUpdateIndication(
  studyInstanceUid: string,
  input: IndicationInput
): Promise<WorkflowResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "EDIT_CLINICAL",
    });

    await prisma.imagingStudy.update({
      where: { id: study.id },
      data: {
        procedureCode: input.procedureCode ?? study.procedureCode,
        procedureDescription: input.procedureDescription ?? study.procedureDescription,
      },
    });

    if (study.orderId) {
      await prisma.worklistOrder.update({
        where: { id: study.orderId },
        data: {
          procedureCode: input.procedureCode ?? study.procedureCode,
          procedureDescription: input.procedureDescription ?? study.procedureDescription,
        },
      });
    }

    await createAuditLog({
      actorUserId: session.user.id,
      action: "STUDY_INDICATION_UPDATED",
      entityType: "ImagingStudy",
      entityId: study.id,
      message: `Updated indication for study ${studyInstanceUid}`,
      metadata: { studyInstanceUid, ...input },
    });

    revalidatePath("/");
    revalidatePath("/worklist");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Report Workflow Actions ────────────────────────────────────

/**
 * Save report as draft.
 * Permission: reports.write
 * Policy: cannot save if report is FINAL (must unfinalize first).
 */
export async function saveReportDraft(
  studyInstanceUid: string,
  input: SaveDraftInput
): Promise<WorkflowResult & { reportId?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "DRAFT_REPORT",
    });

    const existing = await prisma.report.findUnique({
      where: { studyInstanceUid },
      select: { id: true, status: true, cancelledAt: true },
    });

    if (existing && existing.status === "FINAL") {
      return { success: false, error: "Báo cáo đã duyệt. Cần hủy duyệt trước khi sửa." };
    }
    if (existing && existing.status === "PENDING_APPROVAL" && !existing.cancelledAt) {
      return { success: false, error: "Báo cáo đang chờ phê duyệt. Không thể sửa." };
    }

    const doctorId = ["DOCTOR", "ADMIN"].includes((session.user as any).baseRole || (session.user as any).role)
      ? session.user.id
      : undefined;

    const report = await prisma.report.upsert({
      where: { studyInstanceUid },
      update: {
        status: "DRAFT",
        findings: input.findings,
        conclusion: input.conclusion,
        recommendation: input.recommendation,
        technique: input.technique,
        clinicalInfo: input.clinicalInfo,
        technologistId: input.technologistId,
        printTemplateId: input.printTemplateId,
        cancelledAt: null,
        cancelReason: null,
        ...(doctorId ? { doctorId } : {}),
      },
      create: {
        studyInstanceUid,
        status: "DRAFT",
        findings: input.findings,
        conclusion: input.conclusion,
        recommendation: input.recommendation,
        technique: input.technique,
        clinicalInfo: input.clinicalInfo,
        technologistId: input.technologistId,
        printTemplateId: input.printTemplateId,
        ...(doctorId ? { doctorId } : {}),
      },
    });

    if (!report.imagingStudyId) {
      await prisma.report.update({
        where: { id: report.id },
        data: { imagingStudyId: study.id },
      });
    }

    if (study.status !== "READING" && study.status !== "REPORTED") {
      await setStudyStatus(studyInstanceUid, "READING", {
        source: "REPORT",
        reason: "Report drafted",
        actorUserId: session.user.id,
        metadata: { reportId: report.id },
      });
    }

    await createAuditLog({
      actorUserId: session.user.id,
      action: "REPORT_DRAFT_SAVED",
      entityType: "Report",
      entityId: report.id,
      message: `Saved draft report for ${studyInstanceUid}`,
      metadata: { studyInstanceUid },
    });

    revalidatePath(`/report/${studyInstanceUid}`);
    return { success: true, reportId: report.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Finalize report.
 * Permission: reports.finalize
 * Policy:
 *   - If DoctorProfile.isSigningDoctor = true → 1-step: DRAFT → FINAL
 *   - If isSigningDoctor = false → 2-step: DRAFT → PENDING_APPROVAL
 */
export async function finalizeReport(
  studyInstanceUid: string
): Promise<WorkflowResult & { reportStatus?: string, workflowStatus?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "SIGN_REPORT",
    });

    const report = await prisma.report.findUnique({
      where: { studyInstanceUid },
      include: { imagingStudy: true },
    });
    if (!report) return { success: false, error: "Báo cáo không tồn tại." };
    if (report.status === "FINAL") return { success: false, error: "Báo cáo đã duyệt rồi." };
    if (report.status !== "DRAFT") return { success: false, error: "Chỉ có thể duyệt báo cáo ở trạng thái nháp." };

    // Check if actor is a signing doctor
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: session.user.id },
    });
    const isSigningDoctor = doctorProfile?.isSigningDoctor ?? false;

    if (isSigningDoctor) {
      // 1-step: DRAFT → FINAL
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: "FINAL",
          finalizedAt: new Date(),
          doctorId: session.user.id,
        },
      });

      // Transition study to FINALIZED
      await setStudyStatus(studyInstanceUid, "FINALIZED", {
        source: "REPORT",
        reason: "Report finalized (1-step)",
        actorUserId: session.user.id,
        metadata: { reportId: report.id },
      });

      await createAuditLog({
        actorUserId: session.user.id,
        action: "REPORT_FINALIZED",
        entityType: "Report",
        entityId: report.id,
        message: `Finalized report for ${studyInstanceUid} (1-step)`,
        metadata: { studyInstanceUid, mode: "1-step" },
      });

      revalidatePath(`/report/${studyInstanceUid}`);
      revalidatePath("/");

      // HIS sync (awaited, errors caught — not fire-and-forget)
      let hisResultStatus = "PENDING";
      try {
        const hisRes = await sendReportToHis(studyInstanceUid, session.user.id);
        hisResultStatus = hisRes.status;
      } catch (hisErr) {
        console.error("HIS send after finalize failed:", hisErr);
        hisResultStatus = "FAILED";
      }

      return { success: true, reportStatus: "FINAL", workflowStatus: "FINALIZED", hisResultStatus };
    } else {
      // 2-step: DRAFT → PENDING_APPROVAL
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: "PENDING_APPROVAL",
          doctorId: session.user.id,
        },
      });

      await createAuditLog({
        actorUserId: session.user.id,
        action: "REPORT_SUBMITTED_FOR_APPROVAL",
        entityType: "Report",
        entityId: report.id,
        message: `Submitted report for approval ${studyInstanceUid} (2-step)`,
        metadata: { studyInstanceUid, mode: "2-step" },
      });
      revalidatePath(`/report/${studyInstanceUid}`);
      revalidatePath("/");
      return { success: true, reportStatus: "PENDING_APPROVAL", workflowStatus: report.imagingStudy?.status || "READING" };
    }

  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Approve a pending report (2-step flow).
 * Permission: reports.finalize + DoctorProfile.isSigningDoctor = true
 */
export async function approveReport(
  studyInstanceUid: string
): Promise<WorkflowResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "APPROVE_REPORT",
    });

    // Must be a signing doctor
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!doctorProfile?.isSigningDoctor) {
      return { success: false, error: "Chỉ bác sĩ có quyền ký mới được phê duyệt." };
    }

    const report = await prisma.report.findUnique({
      where: { studyInstanceUid },
      include: { imagingStudy: true },
    });
    if (!report) return { success: false, error: "Báo cáo không tồn tại." };
    if (report.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Chỉ có thể phê duyệt báo cáo đang chờ duyệt." };
    }

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "FINAL",
        finalizedAt: new Date(),
      },
    });

    await setStudyStatus(studyInstanceUid, "FINALIZED", {
      source: "REPORT",
      reason: "Report approved (2-step)",
      actorUserId: session.user.id,
      metadata: { reportId: report.id, approvedBy: session.user.id },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "REPORT_APPROVED",
      entityType: "Report",
      entityId: report.id,
      message: `Approved report for ${studyInstanceUid}`,
      metadata: { studyInstanceUid, originalDoctorId: report.doctorId },
    });

    revalidatePath(`/report/${studyInstanceUid}`);
    revalidatePath("/");

    // HIS sync (awaited, errors caught — not fire-and-forget)
    let hisResultStatus = "PENDING";
    try {
      const hisRes = await sendReportToHis(studyInstanceUid, session.user.id);
      hisResultStatus = hisRes.status;
    } catch (hisErr) {
      console.error("HIS send after approve failed:", hisErr);
      hisResultStatus = "FAILED";
    }

    return { success: true, hisResultStatus };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Cancel a draft or pending approval report.
 * Permission: reports.cancelDraft
 * Policy: requires reason
 */
export async function cancelReportDraft(
  studyInstanceUid: string,
  reason: string
): Promise<WorkflowResult> {
  try {
    if (!reason?.trim()) {
      return { success: false, error: "Cần nhập lý do hủy phiếu." };
    }

    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "CANCEL_DRAFT",
    });

    const report = await prisma.report.findUnique({
      where: { studyInstanceUid },
    });
    if (!report) return { success: false, error: "Báo cáo không tồn tại." };
    if (report.status === "FINAL") {
      return { success: false, error: "Không thể hủy phiếu đã duyệt. Sử dụng hủy duyệt." };
    }
    if (report.status !== "DRAFT" && report.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Chỉ có thể hủy phiếu ở trạng thái nháp hoặc chờ duyệt." };
    }

    await prisma.report.update({
      where: { id: report.id },
      data: {
        cancelledAt: new Date(),
        cancelReason: reason.trim(),
      },
    });

    // Transition study back to READY_TO_READ
    await setStudyStatus(studyInstanceUid, "READY_TO_READ", {
      source: "REPORT",
      reason: `Report draft cancelled: ${reason.trim()}`,
      actorUserId: session.user.id,
      metadata: { reportId: report.id },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "REPORT_DRAFT_CANCELLED",
      entityType: "Report",
      entityId: report.id,
      message: `Cancelled draft report for ${studyInstanceUid}`,
      metadata: { studyInstanceUid, reason: reason.trim() },
    });

    revalidatePath(`/report/${studyInstanceUid}`);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Unfinalize a final report (cancel approval).
 * Permission: reports.unfinalize
 * Policy: requires reason, creates ReportAddendum with old content
 */
export async function unfinalizeReport(
  studyInstanceUid: string,
  reason: string
): Promise<WorkflowResult> {
  try {
    if (!reason?.trim()) {
      return { success: false, error: "Cần nhập lý do hủy duyệt." };
    }

    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "UNFINALIZE_REPORT",
    });

    const report = await prisma.report.findUnique({
      where: { studyInstanceUid },
      include: { imagingStudy: true },
    });
    if (!report) return { success: false, error: "Báo cáo không tồn tại." };
    if (report.status !== "FINAL") {
      return { success: false, error: "Chỉ có thể hủy duyệt báo cáo đã final." };
    }

    // Create addendum to preserve old final content
    await prisma.reportAddendum.create({
      data: {
        reportId: report.id,
        imagingStudyId: report.imagingStudyId,
        doctorId: session.user.id,
        reasonCode: "REPORT_UNFINALIZED",
        reason: reason.trim(),
        content: JSON.stringify({
          findings: report.findings || "",
          conclusion: report.conclusion || "",
          recommendation: report.recommendation || "",
          technique: report.technique || "",
          finalizedAt: report.finalizedAt?.toISOString(),
        }),
      },
    });

    // Reopen report
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "DRAFT",
        reopenReason: reason.trim(),
        finalizedAt: null,
        hisResultStatus: null,
        hisResultError: null,
      },
    });

    if (report.imagingStudyId) {
      await prisma.imagingStudy.update({
        where: { id: report.imagingStudyId },
        data: {
          hisResultStatus: null,
          hisLastError: null,
          hisLastResultSentAt: null,
        },
      });
    }

    // Transition study back to READING
    await setStudyStatus(studyInstanceUid, "READING", {
      source: "REPORT",
      reason: `Report unfinalized: ${reason.trim()}`,
      actorUserId: session.user.id,
      metadata: { reportId: report.id },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "REPORT_UNFINALIZED",
      entityType: "Report",
      entityId: report.id,
      message: `Unfinalized report for ${studyInstanceUid}`,
      metadata: { studyInstanceUid, reason: reason.trim() },
    });

    revalidatePath(`/report/${studyInstanceUid}`);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Delivery ───────────────────────────────────────────────────

/**
 * Mark study as delivered.
 * Permission: archive.deliver
 * Policy: study must be FINALIZED or REPORTED
 */
export async function markDelivered(
  studyInstanceUid: string
): Promise<WorkflowResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "DELIVER_RESULT",
    });

    const allowedStatuses = new Set(["FINALIZED", "REPORTED"]);
    if (!allowedStatuses.has(study.status)) {
      return { success: false, error: "Chỉ có thể trả kết quả khi ca đã duyệt/final." };
    }

    await setStudyStatus(studyInstanceUid, "DELIVERED", {
      source: "SYSTEM",
      reason: "Result delivered",
      actorUserId: session.user.id,
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "RESULT_DELIVERED",
      entityType: "ImagingStudy",
      entityId: study.id,
      message: `Delivered result for ${studyInstanceUid}`,
      metadata: { studyInstanceUid },
    });

    revalidatePath("/archive");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Query ──────────────────────────────────────────────────────

/**
 * Get workflow timeline for a study (status history + events).
 */
export async function getWorkflowTimeline(studyInstanceUid: string) {
  const study = await prisma.imagingStudy.findUnique({
    where: { studyInstanceUid },
    select: { id: true },
  });
  if (!study) return [];

  const history = await prisma.studyStatusHistory.findMany({
    where: { imagingStudyId: study.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return history.map((h) => ({
    id: h.id,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    reason: h.reason,
    source: h.source,
    actorUserId: h.actorUserId,
    createdAt: h.createdAt.toISOString(),
  }));
}

/**
 * Get list of doctors available for assignment.
 */
export async function getDoctorsForAssignment() {
  const doctors = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["DOCTOR", "ADMIN"] },
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      doctorProfile: {
        select: {
          specialty: true,
          isSigningDoctor: true,
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return doctors.map((d) => ({
    id: d.id,
    name: d.fullName || d.username,
    specialty: d.doctorProfile?.specialty || "",
    isSigningDoctor: d.doctorProfile?.isSigningDoctor ?? false,
  }));
}

/**
 * Get list of technologists available for selection.
 */
export async function getTechnologists() {
  const techs = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "TECHNICIAN",
    },
    select: {
      id: true,
      fullName: true,
      username: true,
    },
    orderBy: { fullName: "asc" },
  });

  return techs.map((t) => ({
    id: t.id,
    name: t.fullName || t.username,
  }));
}
