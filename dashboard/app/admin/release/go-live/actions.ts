"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { GO_LIVE_SIGNOFF_ROLES } from "./constants";

const FRESH_CHECK_MS = 24 * 60 * 60 * 1000;
const RELEASE_STATUSES = ["DRAFT", "TESTING", "BLOCKED", "READY_FOR_SIGNOFF", "APPROVED", "RELEASED", "ROLLED_BACK"] as const;
const ENVIRONMENTS = ["LOCAL", "STAGING", "PRODUCTION"] as const;
const DEPLOYMENT_STATUSES = ["UNKNOWN", "PENDING", "APPLIED", "FAILED"] as const;
const ISSUE_RISKS = ["LOW", "MEDIUM", "HIGH"] as const;
const ISSUE_STATUSES = ["OPEN", "ACCEPTED", "RESOLVED"] as const;
const HANDOFF_CHECKS = ["buildPassed", "typecheckPassed", "prismaValidated", "migrationReviewed", "seedVerified", "manualSmokeCompleted", "docsUpdated", "rollbackReviewed", "monitoringReviewed", "noPhiAttested"] as const;

type ReleaseStatus = (typeof RELEASE_STATUSES)[number];
type SignOffStatus = "APPROVED" | "REJECTED";

const ALLOWED_TRANSITIONS: Record<ReleaseStatus, ReleaseStatus[]> = {
  DRAFT: ["TESTING", "BLOCKED"],
  TESTING: ["READY_FOR_SIGNOFF", "BLOCKED"],
  BLOCKED: [],
  READY_FOR_SIGNOFF: ["BLOCKED"],
  APPROVED: ["RELEASED", "BLOCKED"],
  RELEASED: ["ROLLED_BACK"],
  ROLLED_BACK: [],
};

function isOneOf<T extends readonly string[]>(value: string, values: T): value is T[number] {
  return values.includes(value as T[number]);
}

function cleanText(value: unknown, label: string, maxLength: number, required = false) {
  const text = String(value ?? "").trim();
  if (required && !text) throw new Error(`${label} là trường bắt buộc.`);
  if (text.length > maxLength) throw new Error(`${label} vượt quá ${maxLength} ký tự.`);
  return text;
}

function assertSafeOperationalText(value: string) {
  const unsafe = [
    /\b(patient\s*(name|id)|mrn|accession)\b/i,
    /\b(password|secret|token|api[_ -]?key|bearer)\b\s*[:=]\s*\S+/i,
    /\b\d{10,}\b/,
  ].some(pattern => pattern.test(value));
  if (unsafe) throw new Error("Nội dung có dấu hiệu chứa PHI, định danh dài hoặc secret.");
}

function cleanEvidenceUrl(value: unknown) {
  const raw = cleanText(value, "Evidence URL", 500);
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Evidence URL không hợp lệ."); }
  if (url.protocol !== "https:") throw new Error("Evidence bên ngoài phải dùng HTTPS.");
  return url.toString();
}

function isFresh(date?: Date | null) {
  return Boolean(date) && Date.now() - (date as Date).getTime() <= FRESH_CHECK_MS;
}

function latestCheckStatus(run: { status: string; startedAt?: Date | null; finishedAt?: Date | null; createdAt?: Date | null } | null, passingStatuses: string[]) {
  const checkedAt = run?.finishedAt || run?.createdAt || run?.startedAt || null;
  const stale = !isFresh(checkedAt);
  return { status: run?.status || "MISSING", checkedAt, stale, ok: Boolean(run) && !stale && passingStatuses.includes(run!.status) };
}

export async function getReleaseReadiness(releaseId?: string) {
  const release = releaseId
    ? await prisma.releaseCandidate.findUnique({ where: { id: releaseId }, select: { uatSuiteId: true } })
    : null;
  const [latestHealth, latestSecurity, latestPerformance, latestDicom, latestUat, incidentBlockers, securityBlockers, highIssueBlockers, handoff] = await Promise.all([
    prisma.systemHealthCheckRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.securityAuditRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.performanceTestRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.dicomConformanceRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.uatRun.findFirst({ where: release?.uatSuiteId ? { suiteId: release.uatSuiteId } : releaseId ? { id: "__missing__" } : undefined, orderBy: { startedAt: "desc" }, include: { results: { select: { status: true } }, suite: { select: { name: true } } } }),
    prisma.incidentTicket.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] }, severity: { in: ["SEV1", "SEV2"] } } }),
    prisma.securityAuditFinding.count({ where: { severity: { in: ["P0", "P1"] }, status: { in: ["OPEN", "ACKNOWLEDGED"] } } }),
    releaseId ? prisma.releaseKnownIssue.count({ where: { releaseId, riskLevel: "HIGH", status: "OPEN" } }) : 0,
    releaseId ? prisma.releaseHandoffRecord.findUnique({ where: { releaseId }, select: { status: true } }) : null,
  ]);

  const uatFailureCount = latestUat?.results.filter(result => result.status === "FAIL" || result.status === "BLOCKED").length || 0;
  const uatPendingCount = latestUat?.results.filter(result => result.status === "PENDING").length || 0;
  const checks = {
    health: latestCheckStatus(latestHealth, ["OK"]),
    security: latestCheckStatus(latestSecurity, ["OK"]),
    performance: latestCheckStatus(latestPerformance, ["SUCCESS", "SKIPPED"]),
    dicom: latestCheckStatus(latestDicom, ["SUCCESS", "SKIPPED"]),
  };
  const blockers = {
    incidents: incidentBlockers,
    securityFindings: securityBlockers,
    uatFailures: uatFailureCount,
    uatPending: uatPendingCount,
    uatMissing: latestUat?.status === "COMPLETED" ? 0 : 1,
    staleChecks: Object.values(checks).filter(check => !check.ok).length,
    highKnownIssues: highIssueBlockers,
    handoffIncomplete: releaseId && handoff?.status !== "READY" && handoff?.status !== "ACCEPTED" ? 1 : 0,
  };
  return { checks, latestUat, blockers, ready: Object.values(blockers).every(count => count === 0) };
}

export async function createReleaseCandidate(formData: FormData) {
  const user = await requirePermission("release.manage");
  const version = cleanText(formData.get("version"), "Version", 80, true);
  const title = cleanText(formData.get("title"), "Tiêu đề", 160, true);
  const notes = cleanText(formData.get("notes"), "Phạm vi", 5000, true);
  const targetEnvironment = cleanText(formData.get("targetEnvironment"), "Môi trường", 20) || "STAGING";
  const uatSuiteId = cleanText(formData.get("uatSuiteId"), "UAT suite", 64) || null;
  if (!isOneOf(targetEnvironment, ENVIRONMENTS)) throw new Error("Môi trường không hợp lệ.");
  assertSafeOperationalText(`${title}\n${notes}`);
  if (uatSuiteId) {
    const suite = await prisma.uatSuite.findFirst({ where: { id: uatSuiteId, isActive: true }, select: { id: true } });
    if (!suite) throw new Error("UAT suite không tồn tại hoặc đã ngừng hoạt động.");
  }
  const releaseId = await prisma.$transaction(async tx => {
    const release = await tx.releaseCandidate.create({ data: { version, title, notes, targetEnvironment, uatSuiteId, status: "DRAFT", createdByUserId: user.id }, select: { id: true } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_CANDIDATE_CREATED", entityType: "ReleaseCandidate", entityId: release.id, message: `Release ${version} created`, metadataJson: JSON.stringify({ targetEnvironment, uatSuiteId }) } });
    return release.id;
  });
  revalidatePath("/admin/release"); revalidatePath("/admin/release/go-live");
  return releaseId;
}

export async function updateReleaseMetadata(releaseId: string, formData: FormData) {
  const user = await requirePermission("release.manage");
  const release = await prisma.releaseCandidate.findUnique({ where: { id: releaseId }, select: { lockedAt: true, status: true } });
  if (!release) throw new Error("Không tìm thấy release.");
  if (release.lockedAt || !["DRAFT", "TESTING", "BLOCKED"].includes(release.status)) throw new Error("Release đã khóa; cần reopen trước khi chỉnh sửa.");

  const title = cleanText(formData.get("title"), "Tiêu đề", 160, true);
  const notes = cleanText(formData.get("notes"), "Phạm vi", 5000, true);
  const releaseNotes = cleanText(formData.get("releaseNotes"), "Release notes", 10000, true);
  const rollbackPlan = cleanText(formData.get("rollbackPlan"), "Rollback plan", 5000, true);
  const gitCommit = cleanText(formData.get("gitCommit"), "Git commit", 80, true);
  const imageTag = cleanText(formData.get("imageTag"), "Image tag", 160, true);
  const buildChecksum = cleanText(formData.get("buildChecksum"), "Build checksum", 160, true);
  const targetEnvironment = cleanText(formData.get("targetEnvironment"), "Môi trường", 20, true);
  const migrationStatus = cleanText(formData.get("migrationStatus"), "Migration status", 20, true);
  const seedStatus = cleanText(formData.get("seedStatus"), "Seed status", 20, true);
  const uatSuiteId = cleanText(formData.get("uatSuiteId"), "UAT suite", 64, true);
  if (!isOneOf(targetEnvironment, ENVIRONMENTS) || !isOneOf(migrationStatus, DEPLOYMENT_STATUSES) || !isOneOf(seedStatus, DEPLOYMENT_STATUSES)) throw new Error("Metadata release không hợp lệ.");
  assertSafeOperationalText([title, notes, releaseNotes, rollbackPlan].join("\n"));
  const suite = await prisma.uatSuite.findFirst({ where: { id: uatSuiteId, isActive: true }, select: { id: true } });
  if (!suite) throw new Error("UAT suite không hợp lệ.");

  await prisma.$transaction(async tx => {
    await tx.releaseCandidate.update({ where: { id: releaseId }, data: { title, notes, releaseNotes, rollbackPlan, gitCommit, imageTag, buildChecksum, targetEnvironment, migrationStatus, seedStatus, uatSuiteId } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_METADATA_UPDATED", entityType: "ReleaseCandidate", entityId: releaseId, message: "Release metadata updated", metadataJson: JSON.stringify({ gitCommit, imageTag, targetEnvironment, migrationStatus, seedStatus, uatSuiteId }) } });
  });
  revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function addKnownIssue(releaseId: string, formData: FormData) {
  const user = await requirePermission("release.manage");
  const release = await prisma.releaseCandidate.findUnique({ where: { id: releaseId }, select: { lockedAt: true } });
  if (!release || release.lockedAt) throw new Error("Release không tồn tại hoặc đã khóa.");
  const description = cleanText(formData.get("description"), "Mô tả issue", 3000, true);
  const workaround = cleanText(formData.get("workaround"), "Workaround", 3000);
  const ticketId = cleanText(formData.get("ticketId"), "Ticket", 64) || null;
  const riskLevel = cleanText(formData.get("riskLevel"), "Mức rủi ro", 10) || "MEDIUM";
  if (!isOneOf(riskLevel, ISSUE_RISKS)) throw new Error("Mức rủi ro không hợp lệ.");
  assertSafeOperationalText(`${description}\n${workaround}`);
  await prisma.$transaction(async tx => {
    const issue = await tx.releaseKnownIssue.create({ data: { releaseId, description, workaround: workaround || null, ticketId, riskLevel, status: "OPEN" }, select: { id: true } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_KNOWN_ISSUE_ADDED", entityType: "ReleaseKnownIssue", entityId: issue.id, message: `Known issue added (${riskLevel})`, metadataJson: JSON.stringify({ releaseId, riskLevel, ticketId }) } });
  });
  revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function updateKnownIssueStatus(issueId: string, statusInput: string, notesInput: string) {
  const user = await requirePermission("release.manage");
  if (!isOneOf(statusInput, ISSUE_STATUSES)) throw new Error("Trạng thái known issue không hợp lệ.");
  const notes = cleanText(notesInput, "Ghi chú chấp nhận", 3000, statusInput === "ACCEPTED");
  assertSafeOperationalText(notes);
  const issue = await prisma.releaseKnownIssue.findUnique({ where: { id: issueId }, select: { releaseId: true, riskLevel: true, release: { select: { status: true } } } });
  if (!issue) throw new Error("Không tìm thấy known issue.");
  if (["RELEASED", "ROLLED_BACK"].includes(issue.release.status)) throw new Error("Không thể sửa known issue sau khi release đã đóng.");
  await prisma.$transaction(async tx => {
    await tx.releaseKnownIssue.update({ where: { id: issueId }, data: { status: statusInput, acceptanceNotes: notes || null, acceptedByUserId: statusInput === "ACCEPTED" ? user.id : null, acceptedAt: statusInput === "ACCEPTED" ? new Date() : null } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_KNOWN_ISSUE_UPDATED", entityType: "ReleaseKnownIssue", entityId: issueId, message: `Known issue status: ${statusInput}`, metadataJson: JSON.stringify({ releaseId: issue.releaseId, status: statusInput, riskLevel: issue.riskLevel }) } });
  });
  revalidatePath(`/admin/release/go-live/${issue.releaseId}`);
}

export async function signOffRelease(releaseId: string, role: string, status: SignOffStatus, notesInput: string, evidenceInput: string, attested: boolean) {
  const user = await requirePermission("release.signoff");
  if (!GO_LIVE_SIGNOFF_ROLES.includes(role as (typeof GO_LIVE_SIGNOFF_ROLES)[number])) throw new Error("Vai trò sign-off không hợp lệ.");
  const notes = cleanText(notesInput, "Ghi chú sign-off", 3000, true);
  const evidenceUrl = cleanEvidenceUrl(evidenceInput);
  if (!attested) throw new Error("Bạn phải xác nhận đã kiểm tra evidence và hiểu trách nhiệm sign-off.");
  assertSafeOperationalText(notes);
  const release = await prisma.releaseCandidate.findUnique({ where: { id: releaseId }, include: { signOffs: { select: { role: true, signedByUserId: true } } } });
  if (!release || release.status !== "READY_FOR_SIGNOFF") throw new Error("Release chưa ở trạng thái READY_FOR_SIGNOFF.");
  const otherRole = release.signOffs.find(signoff => signoff.signedByUserId === user.id && signoff.role !== role);
  if (otherRole) throw new Error(`Một người không được ký nhiều vai trò; bạn đã ký vai trò ${otherRole.role}.`);
  const readiness = await getReleaseReadiness(releaseId);
  if (status === "APPROVED" && !readiness.ready) throw new Error("Không thể sign-off khi vẫn còn readiness blocker.");

  await prisma.$transaction(async tx => {
    await tx.releaseSignOff.upsert({
      where: { releaseId_role: { releaseId, role } },
      update: { status, notes, evidenceUrl, readinessJson: JSON.stringify(readiness), attested: true, signedByUserId: user.id, signedAt: new Date() },
      create: { releaseId, role, status, notes, evidenceUrl, readinessJson: JSON.stringify(readiness), attested: true, signedByUserId: user.id, signedAt: new Date() },
    });
    const signoffs = await tx.releaseSignOff.findMany({ where: { releaseId }, select: { role: true, status: true } });
    const allApproved = GO_LIVE_SIGNOFF_ROLES.every(requiredRole => signoffs.some(signoff => signoff.role === requiredRole && signoff.status === "APPROVED"));
    await tx.releaseCandidate.update({ where: { id: releaseId }, data: { lockedAt: release.lockedAt || new Date(), lockedByUserId: release.lockedByUserId || user.id, status: status === "REJECTED" ? "BLOCKED" : allApproved ? "APPROVED" : "READY_FOR_SIGNOFF" } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_SIGNOFF_SUBMITTED", entityType: "ReleaseCandidate", entityId: releaseId, message: `${role} sign-off: ${status}`, metadataJson: JSON.stringify({ role, status, evidenceUrl, readiness: readiness.blockers }) } });
  });
  revalidatePath("/admin/release"); revalidatePath("/admin/release/go-live"); revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function transitionRelease(releaseId: string, nextStatusInput: string, reasonInput = "", confirmationInput = "") {
  const user = await requirePermission("release.manage");
  if (!isOneOf(nextStatusInput, RELEASE_STATUSES)) throw new Error("Trạng thái release không hợp lệ.");
  const release = await prisma.releaseCandidate.findUnique({ where: { id: releaseId }, include: { signOffs: true, knownIssues: true, handoff: true } });
  if (!release || !isOneOf(release.status, RELEASE_STATUSES)) throw new Error("Không tìm thấy release hoặc trạng thái hiện tại không hợp lệ.");
  const nextStatus: ReleaseStatus = nextStatusInput;
  if (!ALLOWED_TRANSITIONS[release.status].includes(nextStatus)) throw new Error(`Không thể chuyển từ ${release.status} sang ${nextStatus}.`);
  const reason = cleanText(reasonInput, "Lý do", 3000, nextStatus === "BLOCKED" || nextStatus === "ROLLED_BACK");
  assertSafeOperationalText(reason);

  if (nextStatus === "READY_FOR_SIGNOFF") {
    const missingMetadata = !release.title || !release.releaseNotes || !release.rollbackPlan || !release.gitCommit || !release.imageTag || !release.buildChecksum || !release.uatSuiteId || release.migrationStatus !== "APPLIED" || release.seedStatus !== "APPLIED";
    if (missingMetadata) throw new Error("Cần hoàn thiện build metadata, release notes, rollback, UAT, migration và seed trước khi sign-off.");
  }
  if (nextStatus === "RELEASED") {
    if (confirmationInput !== `RELEASE ${release.version}`) throw new Error(`Nhập chính xác: RELEASE ${release.version}`);
    const allApproved = GO_LIVE_SIGNOFF_ROLES.every(role => release.signOffs.some(signoff => signoff.role === role && signoff.status === "APPROVED" && signoff.attested));
    if (!allApproved) throw new Error("Chưa đủ sign-off hợp lệ.");
    const readiness = await getReleaseReadiness(releaseId);
    if (!readiness.ready) throw new Error("Release vẫn còn readiness blocker.");
    if (release.handoff?.status !== "READY") throw new Error("Hồ sơ QA/Handoff chưa ở trạng thái READY.");
  }
  if (nextStatus === "ROLLED_BACK" && confirmationInput !== `ROLLBACK ${release.version}`) throw new Error(`Nhập chính xác: ROLLBACK ${release.version}`);

  const now = new Date();
  await prisma.$transaction(async tx => {
    await tx.releaseCandidate.update({ where: { id: releaseId }, data: { status: nextStatus, releasedAt: nextStatus === "RELEASED" ? now : release.releasedAt, lockedAt: ["READY_FOR_SIGNOFF", "RELEASED", "ROLLED_BACK"].includes(nextStatus) ? release.lockedAt || now : release.lockedAt, lockedByUserId: ["READY_FOR_SIGNOFF", "RELEASED", "ROLLED_BACK"].includes(nextStatus) ? release.lockedByUserId || user.id : release.lockedByUserId } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_STATUS_UPDATED", entityType: "ReleaseCandidate", entityId: releaseId, message: `Release status: ${release.status} -> ${nextStatus}`, metadataJson: JSON.stringify({ previousStatus: release.status, nextStatus, reason: reason || undefined }) } });
  });
  revalidatePath("/admin/release"); revalidatePath("/admin/release/go-live"); revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function reopenRelease(releaseId: string, reasonInput: string) {
  const user = await requirePermission("release.manage");
  const reason = cleanText(reasonInput, "Lý do reopen", 3000, true);
  assertSafeOperationalText(reason);
  const release = await prisma.releaseCandidate.findUnique({ where: { id: releaseId }, select: { status: true } });
  if (!release || !["BLOCKED", "READY_FOR_SIGNOFF", "APPROVED"].includes(release.status)) throw new Error("Release không thể reopen ở trạng thái hiện tại.");
  await prisma.$transaction(async tx => {
    await tx.releaseSignOff.deleteMany({ where: { releaseId } });
    await tx.releaseHandoffRecord.updateMany({ where: { releaseId }, data: { status: "DRAFT", acceptedAt: null, acceptedByUserId: null } });
    await tx.releaseCandidate.update({ where: { id: releaseId }, data: { status: "TESTING", lockedAt: null, lockedByUserId: null } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_REOPENED", entityType: "ReleaseCandidate", entityId: releaseId, message: "Release reopened for changes", metadataJson: JSON.stringify({ previousStatus: release.status, reason }) } });
  });
  revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function saveHandoffRecord(releaseId: string, formData: FormData) {
  const user = await requirePermission("release.manage");
  const release = await prisma.releaseCandidate.findUnique({ where: { id: releaseId }, select: { status: true } });
  if (!release || ["RELEASED", "ROLLED_BACK"].includes(release.status)) throw new Error("Không thể sửa handoff sau khi release đã đóng.");
  const values = Object.fromEntries(HANDOFF_CHECKS.map(key => [key, formData.get(key) === "on"])) as Record<(typeof HANDOFF_CHECKS)[number], boolean>;
  const qaSummary = cleanText(formData.get("qaSummary"), "QA summary", 5000, true);
  const handoffSummary = cleanText(formData.get("handoffSummary"), "Handoff summary", 5000, true);
  const operationsOwner = cleanText(formData.get("operationsOwner"), "Operations owner", 160, true);
  const supportContact = cleanText(formData.get("supportContact"), "Support contact", 200, true);
  const rollbackOwner = cleanText(formData.get("rollbackOwner"), "Rollback owner", 160, true);
  assertSafeOperationalText(`${qaSummary}\n${handoffSummary}`);
  await prisma.$transaction(async tx => {
    await tx.releaseHandoffRecord.upsert({
      where: { releaseId },
      update: { ...values, qaSummary, handoffSummary, operationsOwner, supportContact, rollbackOwner, status: "DRAFT", preparedByUserId: user.id, preparedAt: new Date(), acceptedByUserId: null, acceptedAt: null },
      create: { releaseId, ...values, qaSummary, handoffSummary, operationsOwner, supportContact, rollbackOwner, status: "DRAFT", preparedByUserId: user.id, preparedAt: new Date() },
    });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_HANDOFF_SAVED", entityType: "ReleaseCandidate", entityId: releaseId, message: "QA and handoff record saved" } });
  });
  revalidatePath(`/admin/release/go-live/${releaseId}/handoff`); revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function markHandoffReady(releaseId: string) {
  const user = await requirePermission("release.manage");
  const handoff = await prisma.releaseHandoffRecord.findUnique({ where: { releaseId } });
  if (!handoff) throw new Error("Chưa có hồ sơ handoff.");
  if (!HANDOFF_CHECKS.every(key => handoff[key])) throw new Error("Cần hoàn tất toàn bộ checklist QA/Handoff.");
  if (!handoff.qaSummary || !handoff.handoffSummary || !handoff.operationsOwner || !handoff.supportContact || !handoff.rollbackOwner) throw new Error("Hồ sơ handoff chưa đầy đủ.");
  await prisma.$transaction(async tx => {
    await tx.releaseHandoffRecord.update({ where: { releaseId }, data: { status: "READY", preparedByUserId: user.id, preparedAt: new Date() } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_HANDOFF_READY", entityType: "ReleaseCandidate", entityId: releaseId, message: "QA and handoff record marked ready" } });
  });
  revalidatePath(`/admin/release/go-live/${releaseId}/handoff`); revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function acceptHandoff(releaseId: string) {
  const user = await requirePermission("release.signoff");
  const record = await prisma.releaseHandoffRecord.findUnique({ where: { releaseId }, include: { release: { select: { status: true } } } });
  if (!record || record.status !== "READY" || record.release.status !== "RELEASED") throw new Error("Handoff chỉ được chấp nhận sau khi release đã RELEASED và hồ sơ ở trạng thái READY.");
  if (record.preparedByUserId === user.id) throw new Error("Người chuẩn bị handoff không được tự chấp nhận hồ sơ của mình.");
  await prisma.$transaction(async tx => {
    await tx.releaseHandoffRecord.update({ where: { releaseId }, data: { status: "ACCEPTED", acceptedByUserId: user.id, acceptedAt: new Date() } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "RELEASE_HANDOFF_ACCEPTED", entityType: "ReleaseCandidate", entityId: releaseId, message: "Operations handoff accepted" } });
  });
  revalidatePath(`/admin/release/go-live/${releaseId}/handoff`); revalidatePath(`/admin/release/go-live/${releaseId}`);
}
