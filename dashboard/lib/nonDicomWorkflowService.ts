import { prisma } from "@/app/db";
import { StudyStatus, NonDicomExam, ImagingStudy } from "@prisma/client";

export async function createNonDicomExam(data: {
  worklistOrderId?: string;
  patientId?: string;
  patientName?: string;
  patientBirthDate?: Date;
  patientSex?: string;
  accessionNumber?: string;
  facilityId?: string;
  machineId?: string;
  procedureCatalogId?: string;
  serviceTypeId?: string;
  assignedDoctorId?: string;
  technologistId?: string;
  clinicalInfo?: string;
  indication?: string;
  createdByUserId: string;
}): Promise<NonDicomExam> {
  const caseCode = `ND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const exam = await prisma.nonDicomExam.create({
    data: {
      ...data,
      caseCode,
      status: "REQUESTED",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "non_dicom_exam_created",
      entityType: "NonDicomExam",
      entityId: exam.id,
      actorUserId: data.createdByUserId,
      metadataJson: JSON.stringify({ caseCode: exam.caseCode }),
    },
  });

  return exam;
}

export async function updateExamStatus(examId: string, status: string, actorUserId: string) {
  const exam = await prisma.nonDicomExam.update({
    where: { id: examId },
    data: { status, updatedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      action: "non_dicom_exam_status_updated",
      entityType: "NonDicomExam",
      entityId: exam.id,
      actorUserId,
      metadataJson: JSON.stringify({ status }),
    },
  });

  return exam;
}

export async function syncExamToImagingStudy(examId: string, actorUserId: string): Promise<ImagingStudy> {
  const exam = await prisma.nonDicomExam.findUnique({ where: { id: examId } });
  if (!exam) throw new Error("Exam not found");

  if (exam.imagingStudyId) {
    return prisma.imagingStudy.findUnique({ where: { id: exam.imagingStudyId } }) as unknown as ImagingStudy;
  }

  // Create ImagingStudy
  const studyInstanceUid = `2.25.${Date.now()}.${Math.floor(Math.random() * 100000)}`;
  
  const study = await prisma.imagingStudy.create({
    data: {
      studyInstanceUid,
      accessionNumber: exam.accessionNumber,
      patientId: exam.patientId,
      patientName: exam.patientName,
      sourceType: "NON_DICOM",
      isNonDicom: true,
      nonDicomExam: { connect: { id: exam.id } },
      status: StudyStatus.IN_PROGRESS,
      clinicalInfo: exam.clinicalInfo,
      technologistId: exam.technologistId,
      assignedDoctorId: exam.assignedDoctorId,
    }
  });

  await prisma.nonDicomExam.update({
    where: { id: exam.id },
    data: { imagingStudyId: study.id, studyInstanceUid }
  });

  await prisma.auditLog.create({
    data: {
      action: "non_dicom_exam_synced_to_study",
      entityType: "ImagingStudy",
      entityId: study.id,
      actorUserId,
      metadataJson: JSON.stringify({ nonDicomExamId: exam.id }),
    },
  });

  return study;
}

export async function completeNonDicomExam(examId: string, actorUserId: string) {
  const study = await syncExamToImagingStudy(examId, actorUserId);
  
  await prisma.nonDicomExam.update({
    where: { id: examId },
    data: { status: "COMPLETED", updatedAt: new Date() }
  });

  const updatedStudy = await prisma.imagingStudy.update({
    where: { id: study.id },
    data: { status: StudyStatus.READY_TO_READ, receivedAt: new Date(), stableAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      action: "non_dicom_exam_completed",
      entityType: "NonDicomExam",
      entityId: examId,
      actorUserId,
    },
  });

  return updatedStudy;
}

