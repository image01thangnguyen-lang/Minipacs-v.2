"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const SEVERITIES = new Set(["SEV1", "SEV2", "SEV3", "SEV4"]);
const STATUSES = new Set(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]);
const MODULES = new Set([
  "GENERAL",
  "VIEWER",
  "HIS_GATEWAY",
  "REPORTING",
  "STORAGE",
  "WORKLIST",
  "NON_DICOM",
  "SHARING",
  "OPS",
]);
const CONTEXT_TYPES = new Set(["", "STUDY", "REPORT", "ORDER", "DICOM_NODE", "EXPORT_JOB", "HIS_LOG", "URL"]);

function cleanText(value: FormDataEntryValue | string | null, maxLength = 4000) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanInternalPath(value: FormDataEntryValue | string | null) {
  const path = cleanText(value, 1000);
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Context URL must be an internal application path");
  }
  return path;
}

async function requireAnyPermission(permissions: PermissionKey[]) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !permissions.some(permission => hasPermission(user.role, permission, user.permissions))) {
    throw new Error("Unauthorized");
  }

  return user;
}

function looksLikePhi(value: string) {
  const patterns = [
    /\bMRN\s*[:#-]?\s*\w+/i,
    /\bAccession\s*[:#-]?\s*\w+/i,
    /\bPatient\s*(Name|ID)\s*[:#-]?\s*[\w\s-]+/i,
    /\b\d{8,}\b/,
  ];
  return patterns.some(pattern => pattern.test(value));
}

export async function createIncidentTicket(formData: FormData) {
  const user = await requireAnyPermission(["incident.report", "incident.manage"]);

  const shortDesc = cleanText(formData.get("shortDesc"));
  const severity = cleanText(formData.get("severity")) || "SEV4";
  const module = cleanText(formData.get("module")) || "GENERAL";
  const contextType = cleanText(formData.get("contextType")).toUpperCase();
  const contextId = cleanText(formData.get("contextId"), 500);
  const contextUrl = cleanInternalPath(formData.get("contextUrl"));
  const containsPhiRisk = formData.get("containsPhiRisk") === "on";

  if (!shortDesc) throw new Error("Description is required");
  if (!SEVERITIES.has(severity)) throw new Error("Invalid incident severity");
  if (!MODULES.has(module)) throw new Error("Invalid incident module");
  if (!CONTEXT_TYPES.has(contextType)) throw new Error("Invalid context type");
  if (containsPhiRisk) throw new Error("Incidents containing PHI cannot be saved. Please scrub the data first.");
  if (looksLikePhi(`${shortDesc} ${contextId}`)) {
    throw new Error("Potential PHI detected. Please scrub patient names, MRN, accession, and identifiers before saving.");
  }

  const ticket = await prisma.incidentTicket.create({
    data: {
      shortDesc,
      severity: severity || "SEV4",
      status: "OPEN",
      module: module || "GENERAL",
      contextType: contextType || null,
      contextId: contextId || null,
      contextUrl,
      reportedByUserId: user.id
    }
  });

  revalidatePath("/support/incidents");
  return ticket.id;
}

export async function updateIncidentStatus(ticketId: string, status: string) {
  await requireAnyPermission(["incident.manage"]);

  const nextStatus = cleanText(status);
  if (!STATUSES.has(nextStatus)) {
    throw new Error("Invalid incident status");
  }

  await prisma.incidentTicket.update({
    where: { id: ticketId },
    data: {
      status: nextStatus,
      resolvedAt: nextStatus === "RESOLVED" || nextStatus === "CLOSED" ? new Date() : null,
    }
  });

  revalidatePath("/support/incidents");
  revalidatePath(`/support/incidents/${ticketId}`);
}

export async function assignIncident(ticketId: string, assigneeUserId: string | null) {
  await requireAnyPermission(["incident.manage"]);

  const normalizedAssigneeId = cleanText(assigneeUserId, 100) || null;
  if (normalizedAssigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { id: normalizedAssigneeId, isActive: true },
      select: { id: true },
    });
    if (!assignee) throw new Error("Assignee is not an active user");
  }

  await prisma.incidentTicket.update({
    where: { id: ticketId },
    data: { assigneeUserId: normalizedAssigneeId },
  });

  revalidatePath("/support/incidents");
  revalidatePath(`/support/incidents/${ticketId}`);
}

export async function addIncidentComment(ticketId: string, content: string, isScrubbed: boolean) {
  const user = await requireAnyPermission(["incident.report", "incident.manage"]);

  const body = cleanText(content);
  if (!body) throw new Error("Comment is required");
  if (!isScrubbed) throw new Error("Comments containing PHI cannot be saved. Please scrub the data first.");
  if (looksLikePhi(body)) {
    throw new Error("Potential PHI detected. Please scrub patient names, MRN, accession, and identifiers before saving.");
  }

  const ticket = await prisma.incidentTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, reportedByUserId: true, assigneeUserId: true },
  });
  if (!ticket) throw new Error("Incident not found");

  const canManage = hasPermission(user.role, "incident.manage", user.permissions);
  if (!canManage && ticket.reportedByUserId !== user.id && ticket.assigneeUserId !== user.id) {
    throw new Error("Cannot comment on another user's incident");
  }

  await prisma.incidentComment.create({
    data: {
      ticketId,
      content: body,
      wasRedacted: false,
      createdByUserId: user.id
    }
  });

  revalidatePath(`/support/incidents/${ticketId}`);
}
