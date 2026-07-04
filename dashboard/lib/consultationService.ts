import { prisma } from '@/app/db';

function generateConsultCode() {
  return `CS-${Math.floor(100000 + Math.random() * 900000)}`;
}

export interface CreateConsultationInput {
  title: string;
  reason?: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  sourceType: 'DICOM' | 'NON_DICOM' | 'REPORT' | 'ARCHIVE';
  studyInstanceUid?: string;
  imagingStudyId?: string;
  reportId?: string;
  nonDicomExamId?: string;
  createdByUserId: string;
  hostUserId?: string;
  assignedDoctorId?: string;
  participants?: string[]; // user IDs to invite
}

export async function createConsultation(input: CreateConsultationInput) {
  const code = generateConsultCode();
  
  const consultation = await prisma.consultation.create({
    data: {
      consultCode: code,
      title: input.title,
      reason: input.reason,
      priority: input.priority,
      sourceType: input.sourceType,
      studyInstanceUid: input.studyInstanceUid,
      imagingStudyId: input.imagingStudyId,
      reportId: input.reportId,
      nonDicomExamId: input.nonDicomExamId,
      createdByUserId: input.createdByUserId,
      hostUserId: input.hostUserId,
      assignedDoctorId: input.assignedDoctorId,
    }
  });

  // Add creator as HOST
  await prisma.consultationParticipant.create({
    data: {
      consultationId: consultation.id,
      userId: input.createdByUserId,
      displayName: 'Creator', // This should be looked up from user
      role: 'HOST',
      status: 'JOINED',
      joinedAt: new Date(),
    }
  });

  if (input.participants && input.participants.length > 0) {
    for (const userId of input.participants) {
      if (userId === input.createdByUserId) continue;
      await prisma.consultationParticipant.create({
        data: {
          consultationId: consultation.id,
          userId,
          displayName: 'Participant', // Should be looked up
          role: 'CONSULTANT',
          status: 'INVITED',
          invitedByUserId: input.createdByUserId,
        }
      });
    }
  }

  return consultation;
}

export async function getConsultations(filters?: any) {
  return prisma.consultation.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    include: {
      createdByUser: { select: { fullName: true, username: true } },
      assignedDoctor: { select: { fullName: true, username: true } },
      participants: {
        include: { user: { select: { fullName: true, username: true } } }
      }
    }
  });
}

export async function getConsultationById(id: string) {
  return prisma.consultation.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { fullName: true, username: true, role: true } },
      hostUser: { select: { fullName: true, username: true } },
      participants: {
        include: { user: { select: { fullName: true, username: true } } }
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { senderUser: { select: { fullName: true, username: true } } }
      },
      imagingStudy: true,
      report: true,
      nonDicomExam: true,
    }
  });
}

export async function updateConsultationStatus(id: string, status: string, userId: string, cancelReason?: string) {
  const updateData: any = { status };
  
  if (status === 'ACTIVE' || status === 'STARTED') {
    updateData.startedAt = new Date();
  } else if (status === 'COMPLETED' || status === 'FINISHED') {
    updateData.finishedAt = new Date();
  } else if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
    updateData.cancelReason = cancelReason;
  }

  const result = await prisma.consultation.update({
    where: { id },
    data: updateData
  });

  // Log system message
  await addMessage({
    consultationId: id,
    messageType: 'SYSTEM',
    body: `Consultation status changed to ${status}`,
  });

  return result;
}

export async function addParticipant(consultationId: string, userId: string, role: string, invitedByUserId?: string) {
  // Check if exists
  const existing = await prisma.consultationParticipant.findFirst({
    where: { consultationId, userId }
  });

  if (existing) {
    if (existing.status === 'LEFT' || existing.status === 'REMOVED') {
      return prisma.consultationParticipant.update({
        where: { id: existing.id },
        data: { status: 'INVITED', role, invitedByUserId }
      });
    }
    return existing;
  }

  const result = await prisma.consultationParticipant.create({
    data: {
      consultationId,
      userId,
      displayName: 'Participant', // Should look up
      role,
      status: 'INVITED',
      invitedByUserId,
    }
  });

  await addMessage({
    consultationId,
    messageType: 'SYSTEM',
    body: `Participant added`,
  });

  return result;
}

export async function updateParticipantStatus(consultationId: string, userId: string, status: string) {
  const participant = await prisma.consultationParticipant.findFirst({
    where: { consultationId, userId }
  });

  if (!participant) return null;

  const updateData: any = { status };
  if (status === 'JOINED' && !participant.joinedAt) {
    updateData.joinedAt = new Date();
  } else if (status === 'LEFT') {
    updateData.leftAt = new Date();
  }

  const result = await prisma.consultationParticipant.update({
    where: { id: participant.id },
    data: updateData
  });

  await addMessage({
    consultationId,
    messageType: 'SYSTEM',
    body: `Participant ${status.toLowerCase()}`,
  });

  return result;
}

export async function addMessage(input: {
  consultationId: string;
  senderUserId?: string;
  senderDisplayName?: string;
  messageType: string;
  body: string;
  metadataJson?: string;
}) {
  return prisma.consultationMessage.create({
    data: {
      consultationId: input.consultationId,
      senderUserId: input.senderUserId,
      senderDisplayName: input.senderDisplayName,
      messageType: input.messageType,
      body: input.body,
      metadataJson: input.metadataJson,
    }
  });
}
