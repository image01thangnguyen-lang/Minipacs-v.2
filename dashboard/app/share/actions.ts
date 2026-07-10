'use server';

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { createShareLink, getShareLinksForResource, revokeShareLink, CreateShareLinkInput } from '@/lib/shareService';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/db';
import { requireScopedStudyRead } from '@/lib/authz/scope/require-scoped-access';

export async function createShareLinkAction(input: Omit<CreateShareLinkInput, 'createdByUserId'>) {
  const session = await requirePermission('share.create');
  
  try {
    if ((input.scope as string) === 'NON_DICOM_EXAM') {
      throw new Error("Chức năng chia sẻ ca ngoài DICOM (Non-DICOM) đang được hoàn thiện. Vui lòng quay lại sau.");
    }

    if (input.scope === 'STUDY' && !input.studyInstanceUid) throw new Error("Cần chỉ định ca chụp");
    if (input.scope === 'REPORT' && !input.reportId) throw new Error("Cần chỉ định báo cáo");
    if ((input.scope as string) === 'NON_DICOM_EXAM' && !input.nonDicomExamId) throw new Error("Cần chỉ định ca ngoài DICOM");

    // Validate resource
    if (input.studyInstanceUid) {
      await requireScopedStudyRead({
        userId: session.id,
        studyInstanceUid: input.studyInstanceUid,
      });
    }
    
    if (input.reportId) {
      const report = await prisma.report.findUnique({ where: { id: input.reportId }});
      if (!report) throw new Error("Báo cáo không tồn tại");
      if (report.status !== 'FINAL') throw new Error("Chỉ được phép chia sẻ Báo cáo đã hoàn tất (FINAL)");
      await requireScopedStudyRead({
        userId: session.id,
        studyInstanceUid: report.studyInstanceUid,
      });
      await requirePermission('reports.read');
    }

    if (input.nonDicomExamId) {
      const exam = await prisma.nonDicomExam.findUnique({ where: { id: input.nonDicomExamId }});
      if (!exam) throw new Error("Ca chụp ngoài DICOM không tồn tại");
      await requirePermission('nonDicom.read');
    }

    const result = await createShareLink({
      ...input,
      createdByUserId: session.id,
      studyInstanceUid: input.scope === 'STUDY' ? input.studyInstanceUid : undefined,
      reportId: input.scope === 'REPORT' ? input.reportId : undefined,
      nonDicomExamId: (input.scope as string) === 'NON_DICOM_EXAM' ? input.nonDicomExamId : undefined,
    });
    
    // In a real app we might return the token, but we should be careful with what we return
    // Wait, the client needs the token to construct the URL and show it to the user ONCE.
    return { success: true, shareLink: result.shareLink, token: result.token };
  } catch (error: any) {
    console.error("createShareLinkAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function getShareLinksAction(scope: string, resourceId: string) {
  const session = await requirePermission('share.read');
  
  try {
    if (scope === 'STUDY') {
      await requireScopedStudyRead({ userId: session.id, studyInstanceUid: resourceId });
    } else if (scope === 'REPORT') {
      const report = await prisma.report.findUnique({ where: { id: resourceId } });
      if (!report) throw new Error("Báo cáo không tồn tại");
      await requireScopedStudyRead({ userId: session.id, studyInstanceUid: report.studyInstanceUid });
    }

    const links = await getShareLinksForResource(scope, resourceId);
    return { success: true, links };
  } catch (error: any) {
    console.error("getShareLinksAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function revokeShareLinkAction(id: string, reason?: string) {
  const session = await requirePermission('share.revoke');
  
  try {
    const link = await prisma.shareLink.findUnique({ where: { id } });
    if (!link) throw new Error("Không tìm thấy liên kết");
    
    if (link.scope === 'STUDY' && link.studyInstanceUid) {
      await requireScopedStudyRead({ userId: session.id, studyInstanceUid: link.studyInstanceUid });
    } else if (link.scope === 'REPORT' && link.reportId) {
      const report = await prisma.report.findUnique({ where: { id: link.reportId } });
      if (report) {
        await requireScopedStudyRead({ userId: session.id, studyInstanceUid: report.studyInstanceUid });
      }
    }

    // Only owner can revoke, unless they have share.manage
    if (link.createdByUserId !== session.id) {
      await requirePermission('share.manage');
    }

    await revokeShareLink(id, session.id, reason);
    revalidatePath('/'); 
    return { success: true };
  } catch (error: any) {
    console.error("revokeShareLinkAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}
