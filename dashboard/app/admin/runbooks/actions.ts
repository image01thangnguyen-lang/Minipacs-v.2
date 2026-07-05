"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const RUNBOOK_CATEGORIES = ["DEPLOYMENT", "MAINTENANCE", "INCIDENT_RESPONSE"] as const;
const FINISH_STATUSES = ["COMPLETED", "FAILED", "ABORTED"] as const;

type FinishStatus = (typeof FINISH_STATUSES)[number];
type StepLogEntry = {
  kind: "STEP_COMPLETED";
  stepId: string;
  stepOrder: number;
  stepTitle: string;
  isRisky: boolean;
  confirmed: boolean;
  completedByUserId: string;
  completedBy: string;
  completedAt: string;
};
type FinishLogEntry = {
  kind: "EXECUTION_FINISHED";
  status: FinishStatus;
  notes: string | null;
  finishedByUserId: string;
  finishedAt: string;
};
type RunbookLogEntry = StepLogEntry | FinishLogEntry;

async function requireRunbookPermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  if (!hasPermission(session.user.role, permission, session.user.permissions)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }
  return session.user;
}

function cleanText(value: unknown, field: string, maxLength: number, required = false) {
  const text = String(value ?? "").trim();
  if (required && !text) throw new Error(`${field} là trường bắt buộc.`);
  if (text.length > maxLength) throw new Error(`${field} vượt quá ${maxLength} ký tự.`);
  return text;
}

function cleanActionUrl(value: unknown) {
  const url = cleanText(value, "Action URL", 300);
  if (!url) return null;
  if (!url.startsWith("/") || url.startsWith("//")) {
    throw new Error("Action URL chỉ được dùng đường dẫn nội bộ bắt đầu bằng '/'.");
  }
  return url;
}

function mayContainSecret(value: string) {
  return /\b(password|secret|token|api[_ -]?key|bearer)\b\s*[:=]\s*\S+/i.test(value);
}

function parseRunbookLog(raw: string | null): RunbookLogEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed.filter((entry): entry is RunbookLogEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Record<string, unknown>;
      return candidate.kind === "STEP_COMPLETED" || candidate.kind === "EXECUTION_FINISHED";
    });
  } catch {
    throw new Error("Execution log bị hỏng; không thể tiếp tục an toàn.");
  }
}

function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createRunbook(formData: FormData) {
  const user = await requireRunbookPermission("runbook.manage");
  const name = cleanText(formData.get("name"), "Tên runbook", 160, true);
  const description = cleanText(formData.get("description"), "Mô tả", 3000);
  const category = cleanText(formData.get("category"), "Danh mục", 30) || "MAINTENANCE";
  const attested = formData.get("dataSafetyAttestation") === "on";
  if (!RUNBOOK_CATEGORIES.includes(category as (typeof RUNBOOK_CATEGORIES)[number])) throw new Error("Danh mục runbook không hợp lệ.");
  if (!attested) throw new Error("Bạn phải xác nhận runbook không chứa PHI hoặc secret.");
  if (mayContainSecret(`${name}\n${description}`)) throw new Error("Không lưu secret trực tiếp trong runbook; chỉ ghi tên biến môi trường.");

  const runbookId = await prisma.$transaction(async (tx) => {
    const runbook = await tx.runbook.create({ data: { name, description: description || null, category }, select: { id: true } });
    await tx.auditLog.create({
      data: { actorUserId: user.id, action: "RUNBOOK_CREATED", entityType: "Runbook", entityId: runbook.id, message: `Runbook created (${category})` },
    });
    return runbook.id;
  });
  revalidatePath("/admin/runbooks");
  return runbookId;
}

export async function addRunbookStep(runbookId: string, titleInput: string, descriptionInput: string, isRisky: boolean, actionUrlInput: string, dataSafetyAttested: boolean) {
  const user = await requireRunbookPermission("runbook.manage");
  const title = cleanText(titleInput, "Tiêu đề step", 160, true);
  const description = cleanText(descriptionInput, "Hướng dẫn", 5000, true);
  const actionUrl = cleanActionUrl(actionUrlInput);
  if (!dataSafetyAttested) throw new Error("Bạn phải xác nhận step không chứa PHI hoặc secret.");
  if (mayContainSecret(`${title}\n${description}`)) throw new Error("Không lưu secret trực tiếp trong step; chỉ ghi tên biến môi trường.");

  try {
    await prisma.$transaction(async (tx) => {
      const runbook = await tx.runbook.findUnique({
        where: { id: runbookId },
        include: {
          steps: { orderBy: { order: "desc" }, take: 1, select: { order: true } },
          executions: { where: { status: "IN_PROGRESS" }, take: 1, select: { id: true } },
        },
      });
      if (!runbook || !runbook.isActive) throw new Error("Runbook không tồn tại hoặc đã ngừng hoạt động.");
      if (runbook.executions.length) throw new Error("Không thể sửa step khi runbook đang được thực thi.");
      const order = (runbook.steps[0]?.order ?? 0) + 1;
      const step = await tx.runbookStep.create({ data: { runbookId, order, title, description, isRisky, actionUrl }, select: { id: true } });
      await tx.auditLog.create({
        data: { actorUserId: user.id, action: "RUNBOOK_STEP_ADDED", entityType: "RunbookStep", entityId: step.id, message: `Step ${order} added to runbook`, metadataJson: JSON.stringify({ runbookId, order, isRisky }) },
      });
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) throw new Error("Có người vừa thêm step cùng lúc. Hãy tải lại và thử lại.");
    throw error;
  }
  revalidatePath(`/admin/runbooks/${runbookId}`);
}

export async function removeRunbookStep(runbookId: string, stepId: string) {
  const user = await requireRunbookPermission("runbook.manage");
  await prisma.$transaction(async (tx) => {
    const runbook = await tx.runbook.findUnique({ where: { id: runbookId }, include: { executions: { take: 1, select: { id: true } } } });
    if (!runbook) throw new Error("Không tìm thấy runbook.");
    if (runbook.executions.length) throw new Error("Không thể xóa step sau khi runbook đã có lịch sử thực thi.");
    const deleted = await tx.runbookStep.deleteMany({ where: { id: stepId, runbookId } });
    if (!deleted.count) throw new Error("Không tìm thấy step.");
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RUNBOOK_STEP_REMOVED", entityType: "RunbookStep", entityId: stepId, message: "Runbook step removed", metadataJson: JSON.stringify({ runbookId }) } });
  });
  revalidatePath(`/admin/runbooks/${runbookId}`);
}

export async function setRunbookActive(runbookId: string, isActive: boolean) {
  const user = await requireRunbookPermission("runbook.manage");
  await prisma.$transaction(async (tx) => {
    const activeExecution = await tx.runbookExecution.findFirst({ where: { runbookId, status: "IN_PROGRESS" }, select: { id: true } });
    if (!isActive && activeExecution) throw new Error("Không thể ngừng runbook đang được thực thi.");
    const updated = await tx.runbook.updateMany({ where: { id: runbookId }, data: { isActive } });
    if (!updated.count) throw new Error("Không tìm thấy runbook.");
    await tx.auditLog.create({ data: { actorUserId: user.id, action: isActive ? "RUNBOOK_ACTIVATED" : "RUNBOOK_DEACTIVATED", entityType: "Runbook", entityId: runbookId, message: isActive ? "Runbook activated" : "Runbook deactivated" } });
  });
  revalidatePath("/admin/runbooks");
  revalidatePath(`/admin/runbooks/${runbookId}`);
}

export async function startExecution(runbookId: string) {
  const user = await requireRunbookPermission("runbook.execute");
  const runbook = await prisma.runbook.findUnique({ where: { id: runbookId }, select: { isActive: true, _count: { select: { steps: true } } } });
  if (!runbook || !runbook.isActive) throw new Error("Runbook không tồn tại hoặc đã ngừng hoạt động.");
  if (!runbook._count.steps) throw new Error("Runbook chưa có step để thực thi.");

  try {
    const executionId = await prisma.$transaction(async (tx) => {
      const execution = await tx.runbookExecution.create({
        data: { runbookId, activeKey: runbookId, status: "IN_PROGRESS", executedByUserId: user.id, logJson: "[]" },
        select: { id: true },
      });
      await tx.auditLog.create({ data: { actorUserId: user.id, action: "RUNBOOK_EXECUTION_STARTED", entityType: "RunbookExecution", entityId: execution.id, message: "Runbook execution started", metadataJson: JSON.stringify({ runbookId }) } });
      return execution.id;
    });
    revalidatePath(`/admin/runbooks/${runbookId}`);
    return executionId;
  } catch (error) {
    if (isPrismaUniqueError(error)) throw new Error("Runbook này đã có một execution đang chạy.");
    throw error;
  }
}

export async function completeStep(executionId: string, stepId: string, confirmed: boolean) {
  const user = await requireRunbookPermission("runbook.execute");
  await prisma.$transaction(async (tx) => {
    const execution = await tx.runbookExecution.findUnique({
      where: { id: executionId },
      include: { runbook: { include: { steps: { orderBy: { order: "asc" } } } } },
    });
    if (!execution || execution.status !== "IN_PROGRESS") throw new Error("Execution không còn ở trạng thái đang chạy.");
    if (execution.executedByUserId !== user.id) throw new Error("Chỉ người khởi chạy mới được hoàn thành step.");

    const log = parseRunbookLog(execution.logJson);
    const completedIds = new Set(log.filter((entry): entry is StepLogEntry => entry.kind === "STEP_COMPLETED").map((entry) => entry.stepId));
    const nextStep = execution.runbook.steps.find((step) => !completedIds.has(step.id));
    if (!nextStep) throw new Error("Tất cả step đã hoàn thành.");
    if (nextStep.id !== stepId) throw new Error("Step phải được hoàn thành đúng thứ tự.");
    if (nextStep.isRisky && confirmed !== true) throw new Error("Step nguy hiểm yêu cầu xác nhận rõ ràng.");

    const nextLog: RunbookLogEntry[] = [...log, {
      kind: "STEP_COMPLETED",
      stepId: nextStep.id,
      stepOrder: nextStep.order,
      stepTitle: nextStep.title,
      isRisky: nextStep.isRisky,
      confirmed: nextStep.isRisky ? confirmed : false,
      completedByUserId: user.id,
      completedBy: user.name || "User",
      completedAt: new Date().toISOString(),
    }];
    const updated = await tx.runbookExecution.updateMany({ where: { id: executionId, status: "IN_PROGRESS", logJson: execution.logJson }, data: { logJson: JSON.stringify(nextLog) } });
    if (!updated.count) throw new Error("Execution vừa được cập nhật ở nơi khác. Hãy tải lại trang.");
    await tx.auditLog.create({
      data: { actorUserId: user.id, action: "RUNBOOK_STEP_COMPLETED", entityType: "RunbookExecution", entityId: executionId, message: `Runbook step ${nextStep.order} completed`, metadataJson: JSON.stringify({ runbookId: execution.runbookId, stepId: nextStep.id, stepOrder: nextStep.order, isRisky: nextStep.isRisky, confirmed: nextStep.isRisky ? confirmed : false }) },
    });
  });
}

export async function finishExecution(executionId: string, statusInput: FinishStatus, notesInput: string) {
  const user = await requireRunbookPermission("runbook.execute");
  if (!FINISH_STATUSES.includes(statusInput)) throw new Error("Trạng thái kết thúc không hợp lệ.");
  const notes = cleanText(notesInput, "Ghi chú kết thúc", 2000);
  if (statusInput !== "COMPLETED" && notes.length < 5) throw new Error("FAILED/ABORTED phải có lý do rõ ràng.");
  if (mayContainSecret(notes)) throw new Error("Ghi chú không được chứa secret.");

  const runbookId = await prisma.$transaction(async (tx) => {
    const execution = await tx.runbookExecution.findUnique({
      where: { id: executionId },
      include: { runbook: { include: { steps: { select: { id: true } } } } },
    });
    if (!execution || execution.status !== "IN_PROGRESS") throw new Error("Execution không còn ở trạng thái đang chạy.");
    if (execution.executedByUserId !== user.id) throw new Error("Chỉ người khởi chạy mới được kết thúc execution.");
    const log = parseRunbookLog(execution.logJson);
    const completedIds = new Set(log.filter((entry): entry is StepLogEntry => entry.kind === "STEP_COMPLETED").map((entry) => entry.stepId));
    if (statusInput === "COMPLETED" && execution.runbook.steps.some((step) => !completedIds.has(step.id))) {
      throw new Error("Không thể hoàn tất khi vẫn còn step chưa thực hiện.");
    }

    const finishedAt = new Date();
    const nextLog: RunbookLogEntry[] = [...log, { kind: "EXECUTION_FINISHED", status: statusInput, notes: notes || null, finishedByUserId: user.id, finishedAt: finishedAt.toISOString() }];
    const updated = await tx.runbookExecution.updateMany({
      where: { id: executionId, status: "IN_PROGRESS", activeKey: execution.runbookId, logJson: execution.logJson },
      data: { status: statusInput, activeKey: null, completedAt: finishedAt, logJson: JSON.stringify(nextLog) },
    });
    if (!updated.count) throw new Error("Execution vừa được kết thúc ở nơi khác.");
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RUNBOOK_EXECUTION_FINISHED", entityType: "RunbookExecution", entityId: executionId, message: `Runbook execution finished: ${statusInput}`, metadataJson: JSON.stringify({ runbookId: execution.runbookId, status: statusInput }) } });
    return execution.runbookId;
  });

  revalidatePath(`/admin/runbooks/${runbookId}`);
}
