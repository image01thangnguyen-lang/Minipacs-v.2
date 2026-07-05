"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const CHANGE_STATUSES = ["REQUESTED", "REVIEWING", "APPROVED", "REJECTED", "IMPLEMENTED", "CANCELLED"] as const;
const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
const CHANGE_MODULES = ["GENERAL", "WORKFLOW", "PERMISSIONS", "REPORTING", "HIS", "VIEWER", "STORAGE", "INTEGRATION", "UI", "SECURITY"] as const;

type ChangeStatus = (typeof CHANGE_STATUSES)[number];
type RiskLevel = (typeof RISK_LEVELS)[number];

const ALLOWED_TRANSITIONS: Record<ChangeStatus, ChangeStatus[]> = {
  REQUESTED: ["REVIEWING", "CANCELLED"],
  REVIEWING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["IMPLEMENTED", "CANCELLED"],
  REJECTED: [],
  IMPLEMENTED: [],
  CANCELLED: [],
};

async function requireAnyPermission(...permissions: PermissionKey[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");

  const allowed = permissions.some((permission) =>
    hasPermission(session.user.role, permission, session.user.permissions),
  );
  if (!allowed) throw new Error("Bạn không có quyền thực hiện thao tác này.");
  return session.user;
}

function readText(formData: FormData, key: string, maxLength: number, required = false) {
  const value = String(formData.get(key) ?? "").trim();
  if (required && !value) throw new Error(`${key} là trường bắt buộc.`);
  if (value.length > maxLength) throw new Error(`${key} vượt quá ${maxLength} ký tự.`);
  return value;
}

function isOneOf<T extends readonly string[]>(value: string, values: T): value is T[number] {
  return values.includes(value as T[number]);
}

function mayContainSensitiveData(value: string) {
  return [
    /\b(patient\s*(name|id)|mrn|accession)\b/i,
    /\b(bearer|api[_ -]?key|password|secret|token)\b\s*[:=]/i,
    /\b\d{10,}\b/,
  ].some((pattern) => pattern.test(value));
}

export async function createChangeRequest(formData: FormData) {
  const user = await requireAnyPermission("change.request", "change.manage");
  const title = readText(formData, "title", 160, true);
  const description = readText(formData, "description", 5000, true);
  const impactSummary = readText(formData, "impactSummary", 3000, true);
  const rollbackPlan = readText(formData, "rollbackPlan", 3000);
  const releaseNotesImpact = readText(formData, "releaseNotesImpact", 2000);
  const riskLevel = readText(formData, "riskLevel", 10) || "MEDIUM";
  const module = readText(formData, "module", 30) || "GENERAL";
  const releaseId = readText(formData, "releaseId", 64) || null;
  const uatSuiteId = readText(formData, "uatSuiteId", 64) || null;
  const incidentId = readText(formData, "incidentId", 64) || null;
  const uatRequired = formData.get("uatRequired") === "on" || riskLevel === "HIGH";
  const attested = formData.get("dataSafetyAttestation") === "on";

  if (!isOneOf(riskLevel, RISK_LEVELS)) throw new Error("Mức rủi ro không hợp lệ.");
  if (!isOneOf(module, CHANGE_MODULES)) throw new Error("Phân hệ thay đổi không hợp lệ.");
  if (!attested) throw new Error("Bạn phải xác nhận nội dung không chứa PHI hoặc secret.");
  if (riskLevel === "HIGH" && (!rollbackPlan || !releaseNotesImpact || !uatSuiteId)) {
    throw new Error("Thay đổi HIGH phải có kế hoạch rollback, ảnh hưởng release note và bộ UAT liên kết.");
  }

  const combinedText = [title, description, impactSummary, rollbackPlan, releaseNotesImpact].join("\n");
  if (mayContainSensitiveData(combinedText)) {
    throw new Error("Nội dung có dấu hiệu chứa PHI, mã định danh dài hoặc secret. Hãy loại bỏ dữ liệu nhạy cảm.");
  }

  const [release, uatSuite, incident] = await Promise.all([
    releaseId
      ? prisma.releaseCandidate.findFirst({ where: { id: releaseId, status: { notIn: ["RELEASED", "ROLLED_BACK"] } }, select: { id: true } })
      : null,
    uatSuiteId
      ? prisma.uatSuite.findFirst({ where: { id: uatSuiteId, isActive: true }, select: { id: true } })
      : null,
    incidentId
      ? prisma.incidentTicket.findUnique({ where: { id: incidentId }, select: { id: true } })
      : null,
  ]);

  if (releaseId && !release) throw new Error("Release liên kết không tồn tại hoặc đã đóng.");
  if (uatSuiteId && !uatSuite) throw new Error("Bộ UAT liên kết không tồn tại hoặc đã ngừng hoạt động.");
  if (incidentId && !incident) throw new Error("Incident liên kết không tồn tại.");

  const changeId = await prisma.$transaction(async (tx) => {
    const change = await tx.changeRequest.create({
      data: {
        title,
        description,
        impactSummary,
        rollbackPlan: rollbackPlan || null,
        releaseNotesImpact: releaseNotesImpact || null,
        module,
        uatRequired,
        riskLevel,
        status: "REQUESTED",
        releaseId,
        uatSuiteId,
        incidentId,
        requestedByUserId: user.id,
      },
      select: { id: true },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "CHANGE_REQUEST_CREATED",
        entityType: "ChangeRequest",
        entityId: change.id,
        message: `Change request created (${riskLevel}/${module})`,
        metadataJson: JSON.stringify({ riskLevel, module, releaseId, uatSuiteId, incidentId, uatRequired }),
      },
    });
    return change.id;
  });

  revalidatePath("/admin/changes");
  return changeId;
}

export async function updateChangeStatus(changeId: string, nextStatusInput: string) {
  const user = await requireAnyPermission("change.manage");
  if (!isOneOf(nextStatusInput, CHANGE_STATUSES)) throw new Error("Trạng thái không hợp lệ.");
  const nextStatus: ChangeStatus = nextStatusInput;

  await prisma.$transaction(async (tx) => {
    const change = await tx.changeRequest.findUnique({
      where: { id: changeId },
      include: { approvals: { select: { status: true, reviewerUserId: true } } },
    });
    if (!change) throw new Error("Không tìm thấy change request.");
    if (!isOneOf(change.status, CHANGE_STATUSES)) throw new Error("Trạng thái hiện tại không hợp lệ.");
    if (change.status === nextStatus) return;
    if (!ALLOWED_TRANSITIONS[change.status].includes(nextStatus)) {
      throw new Error(`Không thể chuyển từ ${change.status} sang ${nextStatus}.`);
    }

    if (nextStatus === "APPROVED") {
      const independentApprovals = change.approvals.filter(
        (approval) => approval.status === "APPROVED" && approval.reviewerUserId !== change.requestedByUserId,
      );
      const hasRejection = change.approvals.some((approval) => approval.status === "REJECTED");
      if (hasRejection) throw new Error("Không thể duyệt khi vẫn còn ý kiến REJECTED chưa được xử lý.");
      if (independentApprovals.length === 0) {
        throw new Error("Cần ít nhất một reviewer độc lập phê duyệt trước khi chuyển sang APPROVED.");
      }
      if (change.uatRequired && !change.uatSuiteId) {
        throw new Error("Change request yêu cầu UAT nhưng chưa liên kết bộ UAT.");
      }
    }

    if (nextStatus === "IMPLEMENTED" && change.uatRequired) {
      if (!change.uatSuiteId) throw new Error("Không thể triển khai khi chưa liên kết bộ UAT.");
      const latestUatRun = await tx.uatRun.findFirst({
        where: { suiteId: change.uatSuiteId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        include: { results: { select: { status: true } } },
      });
      const hasBlockingResult = latestUatRun?.results.some((result) =>
        ["PENDING", "FAIL", "BLOCKED"].includes(result.status),
      );
      const hasPassedResult = latestUatRun?.results.some((result) => result.status === "PASS");
      if (!latestUatRun || !hasPassedResult || hasBlockingResult) {
        throw new Error("Cần một UAT run hoàn tất, có kết quả PASS và không còn FAIL/BLOCKED trước khi đánh dấu IMPLEMENTED.");
      }
    }

    await tx.changeRequest.update({ where: { id: changeId }, data: { status: nextStatus } });
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "CHANGE_STATUS_UPDATED",
        entityType: "ChangeRequest",
        entityId: changeId,
        message: `Change status updated: ${change.status} -> ${nextStatus}`,
        metadataJson: JSON.stringify({ previousStatus: change.status, nextStatus }),
      },
    });
  });

  revalidatePath("/admin/changes");
  revalidatePath(`/admin/changes/${changeId}`);
}

export async function reviewChange(changeId: string, reviewStatus: "APPROVED" | "REJECTED", notesInput: string) {
  const user = await requireAnyPermission("change.approve");
  const notes = notesInput.trim();
  if (notes.length > 2000) throw new Error("Ghi chú review vượt quá 2000 ký tự.");
  if (reviewStatus === "REJECTED" && notes.length < 5) {
    throw new Error("Khi từ chối, vui lòng nhập lý do rõ ràng.");
  }
  if (mayContainSensitiveData(notes)) throw new Error("Ghi chú review có dấu hiệu chứa dữ liệu nhạy cảm.");

  await prisma.$transaction(async (tx) => {
    const change = await tx.changeRequest.findUnique({ where: { id: changeId }, select: { status: true, requestedByUserId: true } });
    if (!change) throw new Error("Không tìm thấy change request.");
    if (change.requestedByUserId === user.id) throw new Error("Người đề xuất không được tự duyệt thay đổi của mình.");
    if (!(["REQUESTED", "REVIEWING"] as string[]).includes(change.status)) {
      throw new Error("Change request ở trạng thái này không còn nhận review.");
    }

    await tx.changeApproval.upsert({
      where: { changeId_reviewerUserId: { changeId, reviewerUserId: user.id } },
      update: { status: reviewStatus, notes: notes || null, reviewedAt: new Date() },
      create: { changeId, reviewerUserId: user.id, status: reviewStatus, notes: notes || null, reviewedAt: new Date() },
    });
    if (change.status === "REQUESTED") {
      await tx.changeRequest.update({ where: { id: changeId }, data: { status: "REVIEWING" } });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "CHANGE_REVIEW_SUBMITTED",
        entityType: "ChangeRequest",
        entityId: changeId,
        message: `Change review submitted: ${reviewStatus}`,
        metadataJson: JSON.stringify({ reviewStatus }),
      },
    });
  });

  revalidatePath("/admin/changes");
  revalidatePath(`/admin/changes/${changeId}`);
}
