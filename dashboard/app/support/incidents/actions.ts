"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { cleanIncidentText, looksLikePhi, parseCreateIncidentInput, parseIncidentStatus } from "./incident-validation";

async function requireAnyPermission(permissions: PermissionKey[]) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !permissions.some(permission => hasPermission(user.role, permission, user.permissions))) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function createIncidentTicket(formData: FormData) {
  const user = await requireAnyPermission(["incident.report", "incident.manage"]);
  const input = parseCreateIncidentInput(formData);

  const ticket = await prisma.incidentTicket.create({
    data: {
      shortDesc: input.shortDesc,
      severity: input.severity,
      status: "OPEN",
      module: input.module,
      contextType: input.contextType,
      contextId: input.contextId,
      contextUrl: input.contextUrl,
      reportedByUserId: user.id
    }
  });

  revalidatePath("/support/incidents");
  return ticket.id;
}

export async function updateIncidentStatus(ticketId: string, status: string) {
  await requireAnyPermission(["incident.manage"]);

  const nextStatus = parseIncidentStatus(status);

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

  const normalizedAssigneeId = cleanIncidentText(assigneeUserId, 100) || null;
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

  const body = cleanIncidentText(content);
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
