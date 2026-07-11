'use server';

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus,
  addParticipant,
  updateParticipantStatus,
  addMessage,
  CreateConsultationInput
} from '@/lib/consultationService';
import { revalidatePath } from 'next/cache';
import { requireScopedStudyMutation, requireScopedStudyRead } from '@/lib/authz/scope/require-scoped-access';

export async function createConsultationAction(input: Omit<CreateConsultationInput, 'createdByUserId'>) {
  const session = await requirePermission('consult.create');

  try {
    if (input.studyInstanceUid) {
      await requireScopedStudyMutation({
        userId: session.id,
        studyInstanceUid: input.studyInstanceUid,
        capability: 'CREATE_CONSULT',
      });
    }

    const consultation = await createConsultation({
      ...input,
      createdByUserId: session.id,
      hostUserId: session.id, // implicitly set creator as host
    });
    return { success: true, consultation };
  } catch (error: any) {
    console.error("createConsultationAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function getConsultationsAction(filters?: any) {
  const session = await requirePermission('consult.read');

  try {
    const scopedFilters = {
      ...filters,
      OR: [
        { createdByUserId: session.id },
        { participants: { some: { userId: session.id } } }
      ]
    };
    const consultations = await getConsultations(scopedFilters);
    return { success: true, consultations };
  } catch (error: any) {
    console.error("getConsultationsAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function getStudyConsultationsAction(studyInstanceUid: string) {
  const session = await requirePermission('consult.read');

  try {
    await requireScopedStudyRead({
      userId: session.id,
      studyInstanceUid,
    });

    const consultations = await getConsultations({ studyInstanceUid });
    return { success: true, consultations };
  } catch (error: any) {
    console.error("getStudyConsultationsAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function getConsultationByIdAction(id: string) {
  const session = await requirePermission('consult.read');

  try {
    const consultation = await getConsultationById(id);
    if (!consultation) return { success: false, error: 'Không tìm thấy hội chẩn' };

    // Check scope if bound to a study
    if (consultation.imagingStudy?.studyInstanceUid) {
      try {
        await requireScopedStudyRead({
          userId: session.id,
          studyInstanceUid: consultation.imagingStudy.studyInstanceUid,
        });
      } catch (err: any) {
        return { success: false, error: 'Bạn không có quyền truy cập ca chụp của hội chẩn này' };
      }
    }

    const isOwner = consultation.createdByUserId === session.id;
    const isParticipant = consultation.participants.some(p => p.userId === session.id);

    if (!isOwner && !isParticipant) {
      return { success: false, error: 'Bạn không có quyền truy cập hội chẩn này' };
    }

    return { success: true, consultation };
  } catch (error: any) {
    console.error("getConsultationByIdAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function updateConsultationStatusAction(id: string, status: string, cancelReason?: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Chưa đăng nhập' };
  const user = session.user as any;

  try {
    const consultation = await getConsultationById(id);
    if (!consultation) throw new Error('Không tìm thấy');

    // Check scope if bound to a study
    if (consultation.imagingStudy?.studyInstanceUid) {
      await requireScopedStudyRead({
        userId: user.id,
        studyInstanceUid: consultation.imagingStudy.studyInstanceUid,
      });
    }

    // Check if the user is owner or has admin rights
    if (consultation.createdByUserId !== user.id && consultation.hostUserId !== user.id) {
      await requirePermission('consult.manage'); // throws if not admin
    }

    const result = await updateConsultationStatus(id, status, user.id, cancelReason);
    revalidatePath(`/consultations/${id}`);
    return { success: true, result };
  } catch (error: any) {
    console.error("updateConsultationStatusAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function inviteParticipantAction(consultationId: string, userId: string, role: string) {
  const session = await requirePermission('consult.invite');

  try {
    const consultation = await getConsultationById(consultationId);
    if (!consultation) throw new Error('Không tìm thấy hội chẩn');

    // Check scope if bound to a study
    if (consultation.imagingStudy?.studyInstanceUid) {
      await requireScopedStudyRead({
        userId: session.id,
        studyInstanceUid: consultation.imagingStudy.studyInstanceUid,
      });
    }

    const isOwner = consultation.createdByUserId === session.id || consultation.hostUserId === session.id;
    if (!isOwner) {
       await requirePermission('consult.admin'); // throw if not admin and not owner
    }

    const participant = await addParticipant(consultationId, userId, role, session.id);
    revalidatePath(`/consultations/${consultationId}`);
    return { success: true, participant };
  } catch (error: any) {
    console.error("inviteParticipantAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function updateParticipantStatusAction(consultationId: string, userId: string, status: string) {
  const session = await requirePermission('consult.read');

  try {
    const consultation = await getConsultationById(consultationId);
    if (!consultation) throw new Error('Không tìm thấy hội chẩn');

    if (consultation.imagingStudy?.studyInstanceUid) {
      await requireScopedStudyRead({
        userId: session.id,
        studyInstanceUid: consultation.imagingStudy.studyInstanceUid,
      });
    }

    // Force usage of session.id to prevent updating others
    const participant = await updateParticipantStatus(consultationId, session.id, status);
    revalidatePath(`/consultations/${consultationId}`);
    return { success: true, participant };
  } catch (error: any) {
    console.error("updateParticipantStatusAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}

export async function sendConsultationMessageAction(consultationId: string, body: string) {
  const session = await requirePermission('consult.message');

  try {
    const consultation = await getConsultationById(consultationId);
    if (!consultation) throw new Error('Không tìm thấy hội chẩn');

    // Check scope if bound to a study
    if (consultation.imagingStudy?.studyInstanceUid) {
      await requireScopedStudyRead({
        userId: session.id,
        studyInstanceUid: consultation.imagingStudy.studyInstanceUid,
      });
    }

    const isParticipantOrOwner = consultation.createdByUserId === session.id || consultation.participants.some(p => p.userId === session.id);
    if (!isParticipantOrOwner) throw new Error('Không có quyền nhắn tin');

    const message = await addMessage({
      consultationId,
      senderUserId: session.id,
      senderDisplayName: (session as any).fullName || session.username,
      messageType: 'TEXT',
      body,
    });
    revalidatePath(`/consultations/${consultationId}`);
    return { success: true, message };
  } catch (error: any) {
    console.error("sendConsultationMessageAction error:", error);
    return { success: false, error: error.message || 'Lỗi hệ thống' };
  }
}
