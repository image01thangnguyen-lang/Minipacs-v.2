"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const editableRoles = new Set(["ADMIN", "DOCTOR"]);
const allowedScopes = new Set(["GLOBAL", "PRIVATE"]);

type TemplateFilters = {
  modality?: string | null;
  bodyPart?: string | null;
  includeInactive?: boolean;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function normalizeCode(value: string, fallback = "ALL") {
  const normalized = value.trim().toUpperCase();
  return normalized || fallback;
}

function normalizeShortcut(value: string) {
  const shortcut = value.trim().toLowerCase();
  if (!shortcut) return null;
  return shortcut.startsWith("/") ? shortcut : `/${shortcut}`;
}

async function requireTemplateAccess() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!editableRoles.has(session.user.role)) redirect("/");
  return session.user;
}

async function requireSignedInUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

function buildReadableTemplateWhere(user: { id: string; role: string }, filters: TemplateFilters = {}) {
  const where: any = {};

  if (!filters.includeInactive) {
    where.isActive = true;
  }

  const modality = normalizeCode(filters.modality || "", "");
  if (modality) {
    where.modality = { in: ["ALL", modality] };
  }

  const andFilters: any[] = [];
  if (user.role !== "ADMIN") {
    andFilters.push({
      OR: [
        { scope: "GLOBAL" },
        { ownerUserId: user.id },
      ],
    });
  }

  const bodyPart = normalizeCode(filters.bodyPart || "", "");
  if (bodyPart) {
    andFilters.push({
      OR: [{ bodyPart: null }, { bodyPart: "" }, { bodyPart }],
    });
  }

  if (andFilters.length) {
    where.AND = andFilters;
  }

  return where;
}

function validateTemplateForm(formData: FormData, actor: { id: string; role: string }) {
  const name = readText(formData, "name");
  const modality = normalizeCode(readText(formData, "modality"));
  const bodyPart = normalizeCode(readText(formData, "bodyPart"), "");
  const shortcut = normalizeShortcut(readText(formData, "shortcut"));
  const findings = readText(formData, "findings");
  const conclusion = readText(formData, "conclusion");
  const recommendation = readText(formData, "recommendation");
  const requestedScope = readText(formData, "scope").toUpperCase();
  const scope = actor.role === "ADMIN" && allowedScopes.has(requestedScope) ? requestedScope : "PRIVATE";

  if (!name || !modality || !findings || !conclusion) {
    throw new Error("Vui long nhap ten mau, modality, mo ta va ket luan.");
  }

  return {
    name,
    modality,
    bodyPart: bodyPart || null,
    shortcut,
    findings,
    conclusion,
    recommendation: recommendation || null,
    isNormal: formData.get("isNormal") === "on",
    isActive: formData.get("isActive") === "on",
    scope,
    ownerUserId: scope === "PRIVATE" ? actor.id : null,
  };
}

export async function getReportTemplateTexts(filters: TemplateFilters = {}) {
  const actor = await requireTemplateAccess();

  return prisma.reportTemplateText.findMany({
    where: buildReadableTemplateWhere(actor, filters),
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
    },
    orderBy: [
      { isActive: "desc" },
      { isNormal: "desc" },
      { modality: "asc" },
      { bodyPart: "asc" },
      { name: "asc" },
    ],
  });
}

export async function getReportTemplateSuggestions(filters: TemplateFilters = {}) {
  const actor = await requireSignedInUser();

  return prisma.reportTemplateText.findMany({
    where: buildReadableTemplateWhere(actor, filters),
    select: {
      id: true,
      name: true,
      modality: true,
      bodyPart: true,
      shortcut: true,
      findings: true,
      conclusion: true,
      recommendation: true,
      isNormal: true,
      scope: true,
    },
    orderBy: [
      { isNormal: "desc" },
      { modality: "asc" },
      { bodyPart: "asc" },
      { name: "asc" },
    ],
    take: 80,
  });
}

export async function createReportTemplateTextAction(formData: FormData) {
  const actor = await requireTemplateAccess();
  const data = validateTemplateForm(formData, actor);

  const template = await prisma.reportTemplateText.create({
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "REPORT_TEMPLATE_TEXT_CREATED",
      entityType: "ReportTemplateText",
      entityId: template.id,
      message: `Created report text template ${template.name}`,
      metadataJson: JSON.stringify({
        modality: template.modality,
        bodyPart: template.bodyPart,
        scope: template.scope,
      }),
    },
  });

  revalidatePath("/settings/report-templates");
  return template;
}

export async function updateReportTemplateTextAction(formData: FormData) {
  const actor = await requireTemplateAccess();
  const templateId = readText(formData, "templateId");
  if (!templateId) throw new Error("Thieu ma mau bao cao.");

  const existing = await prisma.reportTemplateText.findUnique({
    where: { id: templateId },
  });

  if (!existing) throw new Error("Mau bao cao khong ton tai.");
  if (actor.role !== "ADMIN" && existing.ownerUserId !== actor.id) {
    throw new Error("Ban khong co quyen sua mau bao cao nay.");
  }

  const data = validateTemplateForm(formData, actor);
  const template = await prisma.reportTemplateText.update({
    where: { id: templateId },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "REPORT_TEMPLATE_TEXT_UPDATED",
      entityType: "ReportTemplateText",
      entityId: template.id,
      message: `Updated report text template ${template.name}`,
      metadataJson: JSON.stringify({
        modality: template.modality,
        bodyPart: template.bodyPart,
        scope: template.scope,
        isActive: template.isActive,
      }),
    },
  });

  revalidatePath("/settings/report-templates");
  return template;
}

export async function deleteReportTemplateTextAction(templateId: string) {
  const actor = await requireTemplateAccess();
  if (!templateId) throw new Error("Thieu ma mau bao cao.");

  const existing = await prisma.reportTemplateText.findUnique({
    where: { id: templateId },
  });

  if (!existing) return { success: true };
  if (actor.role !== "ADMIN" && existing.ownerUserId !== actor.id) {
    throw new Error("Ban khong co quyen xoa mau bao cao nay.");
  }

  await prisma.reportTemplateText.delete({
    where: { id: templateId },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "REPORT_TEMPLATE_TEXT_DELETED",
      entityType: "ReportTemplateText",
      entityId: templateId,
      message: `Deleted report text template ${existing.name}`,
      metadataJson: JSON.stringify({
        modality: existing.modality,
        bodyPart: existing.bodyPart,
        scope: existing.scope,
      }),
    },
  });

  revalidatePath("/settings/report-templates");
  return { success: true };
}
