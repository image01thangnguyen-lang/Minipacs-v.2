'use server';

import { prisma } from '@/app/db';
import { requirePermission } from '@/lib/authz';
import { requireScopedStudyRead, requireScopedStudyMutation } from '@/lib/authz/scope/require-scoped-access';
import { revalidatePath } from 'next/cache';

export async function getSecondReadsForStudyAction(studyInstanceUid: string) {
  try {
    const normalizedStudyInstanceUid =
      typeof studyInstanceUid === 'string' ? studyInstanceUid.trim() : '';
    if (!normalizedStudyInstanceUid) {
      return { success: false, error: 'Thiếu Study Instance UID' };
    }

    const session = await requirePermission('studies.read');
    await requireScopedStudyRead({
      userId: session.id,
      studyInstanceUid: normalizedStudyInstanceUid,
    });

    const secondReads = await prisma.secondRead.findMany({
      where: { studyInstanceUid: normalizedStudyInstanceUid },
      include: {
        requestedByUser: { select: { fullName: true, username: true } },
        assignedToUser: { select: { fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, secondReads };
  } catch (error: any) {
    console.error("getSecondReadsForStudyAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function createSecondReadAction(input: {
  studyInstanceUid: string;
  assignedToUserId?: string;
  reason?: string;
}) {
  try {
    const studyInstanceUid =
      typeof input?.studyInstanceUid === 'string' ? input.studyInstanceUid.trim() : '';
    if (!studyInstanceUid) {
      return { success: false, error: 'Thiếu Study Instance UID' };
    }

    const session = await requirePermission('reports.write');
    const { study } = await requireScopedStudyMutation({
      userId: session.id,
      studyInstanceUid,
      capability: 'ASSIGN_CASE',
    });

    const secondRead = await prisma.secondRead.create({
      data: {
        studyInstanceUid,
        imagingStudyId: study.id,
        requestedByUserId: session.id,
        assignedToUserId: input.assignedToUserId,
        reason: input.reason,
        status: 'REQUESTED',
      },
    });

    revalidatePath(`/report/${studyInstanceUid}`);
    return { success: true, secondRead };
  } catch (error: any) {
    console.error("createSecondReadAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}
