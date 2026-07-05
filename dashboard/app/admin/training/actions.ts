"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

const ROLE_TARGETS = new Set(["ADMIN", "DOCTOR", "TECHNICIAN", "RECEPTION", "ALL"]);

function normalizeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeUrl(value: string) {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Training material URL is invalid");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Training material URL must use http or https");
  }

  return url.toString();
}

export async function createMaterial(formData: FormData) {
  await requirePermission("training.manage");

  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const url = normalizeUrl(normalizeText(formData.get("url")));
  const roleTarget = normalizeText(formData.get("roleTarget")) || "ALL";
  const isRequired = formData.get("isRequired") === "on";

  if (!title) throw new Error("Title is required");
  if (!ROLE_TARGETS.has(roleTarget)) throw new Error("Invalid target role");

  await prisma.trainingMaterial.create({
    data: {
      title,
      description: description || null,
      url,
      roleTarget: roleTarget === "ALL" ? null : roleTarget,
      isRequired
    }
  });

  revalidatePath("/admin/training");
}

export async function assignMaterial(materialId: string) {
  await requirePermission("training.manage");

  const material = await prisma.trainingMaterial.findUnique({ where: { id: materialId } });
  if (!material) throw new Error("Not found");

  // Find all users that match the roleTarget
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(material.roleTarget ? { role: material.roleTarget as Role } : {}),
    },
    select: { id: true },
  });

  let assignedCount = 0;
  await prisma.$transaction(async tx => {
    for (const u of users) {
      const existing = await tx.trainingAssignment.findUnique({
        where: { materialId_userId: { materialId, userId: u.id } }
      });
      if (existing) continue;

      await tx.trainingAssignment.create({
        data: {
          materialId,
          userId: u.id,
          status: "PENDING"
        }
      });
      assignedCount++;
    }
  });

  revalidatePath("/admin/training");
  return assignedCount;
}

export async function attestTraining(assignmentId: string, auditReason?: string) {
  const user = await requirePermission("training.attest");

  const assignment = await prisma.trainingAssignment.findUnique({
    where: { id: assignmentId }
  });

  if (!assignment) throw new Error("Not found");

  const isSelfAttestation = assignment.userId === user.id;
  const canManage = hasPermission(user.role, "training.manage", user.permissions);
  if (!isSelfAttestation && !canManage) {
    throw new Error("Cannot attest someone else's training");
  }
  if (!isSelfAttestation && !auditReason?.trim()) {
    throw new Error("Audit reason is required when attesting on behalf of another user");
  }

  await prisma.trainingAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "COMPLETED",
      attestedAt: new Date(),
      attestedByUserId: user.id,
      auditReason: isSelfAttestation ? null : auditReason!.trim(),
    }
  });

  revalidatePath("/admin/training");
}
