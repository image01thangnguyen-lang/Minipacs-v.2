"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { createNonDicomExam } from "@/lib/nonDicomWorkflowService";
import { revalidatePath } from "next/cache";

export async function getNonDicomExams(query?: { status?: string; search?: string }) {
  await requirePermission("nonDicom.read");

  const where: any = {};
  if (query?.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query?.search) {
    where.OR = [
      { patientName: { contains: query.search, mode: "insensitive" } },
      { patientId: { contains: query.search, mode: "insensitive" } },
      { accessionNumber: { contains: query.search, mode: "insensitive" } },
      { caseCode: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const exams = await prisma.nonDicomExam.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { media: true, captureSessions: true } },
    },
    take: 100,
  });

  return exams;
}

export async function createExamAction(data: {
  worklistOrderId?: string;
  patientId?: string;
  patientName?: string;
  patientBirthDate?: Date;
  patientSex?: string;
  accessionNumber?: string;
  facilityId?: string;
  machineId?: string;
  procedureCatalogId?: string;
  clinicalInfo?: string;
}) {
  const session = await requirePermission("nonDicom.create");

  const exam = await createNonDicomExam({
    ...data,
    createdByUserId: session.id,
  });

  revalidatePath("/non-dicom");
  return exam;
}
