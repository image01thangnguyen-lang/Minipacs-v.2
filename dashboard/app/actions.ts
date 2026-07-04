'use server'

import { prisma } from './db';
import { syncOrthancStudyToRis, updateStudyStatusForReport } from '@/lib/studyStatus';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { hasPermission } from '@/lib/permissions';
import {
  saveReportDraft,
  finalizeReport,
  assignStudyDoctor,
  startReading,
  updateClinicalInfo,
  addOrUpdateIndication,
  cancelReportDraft,
  unfinalizeReport,
  markDelivered,
  approveReport
} from '@/lib/workflowService';

function cleanText(value?: string | null) {
  return (value || "").trim();
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

function minutesSince(value?: Date | null) {
  if (!value) return null;
  const minutes = Math.round((Date.now() - value.getTime()) / 60000);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

function slaThresholdMinutes(priority?: string | null) {
  if (priority === "STAT") return 30;
  if (priority === "URGENT") return 120;
  return 1440;
}

function resolveSlaStatus(waitingMinutes: number | null, priority?: string | null) {
  if (waitingMinutes === null) return "UNKNOWN";
  return waitingMinutes >= slaThresholdMinutes(priority) ? "BREACH" : "OK";
}

/**
 * Server Action: Lấy danh sách bệnh nhân/studies từ Orthanc.
 * BẢO MẬT: Fetch từ backend, không làm lộ mật khẩu Orthanc ra frontend.
 */
export async function getStudies() {
  await requirePermission("studies.read");

  // Lấy cấu hình từ biến môi trường của Docker container
  const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
  const username = process.env.ORTHANC_USERNAME || 'admin';
  const password = process.env.ORTHANC_PASSWORD || 'admin_password';

  try {
    const response = await fetch(`${orthancUrl}/studies?expand`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Accept': 'application/json'
      },
      // Không cache để luôn có ảnh mới nhất
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`Orthanc error: ${response.status} ${response.statusText}`);
      return [];
    }

    const studies = await response.json();

    // Làm giàu dữ liệu (Enrichment): Lấy Modality và đếm số lượng Instances (Lát cắt)
    const enrichedStudies = await Promise.all(studies.map(async (study: any) => {
      let modality = study.MainDicomTags?.Modality || 'UNKNOWN';
      let instancesCount = 0;

      // 1. Phân tích Modality từ Series nếu Study root không có
      if (modality === 'UNKNOWN' && study.Series && study.Series.length > 0) {
        if (typeof study.Series[0] === 'string') {
          try {
             const seriesRes = await fetch(`${orthancUrl}/series/${study.Series[0]}`, {
               headers: {
                 'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
                 'Accept': 'application/json'
               },
               cache: 'no-store'
             });
             if (seriesRes.ok) {
               const seriesData = await seriesRes.json();
               modality = seriesData.MainDicomTags?.Modality || 'UNKNOWN';
             }
           } catch (e) {
             console.error("Failed to fetch series for modality:", e);
           }
        }
      }

      // 2. Đếm tổng số Instances bằng API statistics của Orthanc
      try {
        const statsRes = await fetch(`${orthancUrl}/studies/${study.ID}/statistics`, {
           headers: {
             'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
             'Accept': 'application/json'
           },
           cache: 'no-store'
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          instancesCount = statsData.CountInstances || 0;
        }
      } catch (e) {
        console.error("Failed to fetch study statistics:", e);
      }

      return {
        ...study,
        // Trả các thuộc tính xử lý trước xuống Frontend
        EnrichedModality: modality,
        EnrichedInstancesCount: instancesCount
      };
    }));

    const studiesWithWorkflow = await Promise.all(enrichedStudies.map(async (study: any) => {
      try {
        const workflow = await syncOrthancStudyToRis(study);
        return {
          ...study,
          WorkflowStatus: workflow?.status || 'READY_TO_READ',
          OrderStatus: workflow?.orderStatus || null,
          ReportStatus: workflow?.reportStatus || null,
          clinicalInfo: workflow?.clinicalInfo || null,
          procedureCode: workflow?.procedureCode || null,
          procedureDescription: workflow?.procedureDescription || null,
          technologistId: workflow?.technologistId || null,
          bodyPart: workflow?.bodyPart || null,
          hisSyncStatus: workflow?.hisSyncStatus || null,
          hisResultStatus: workflow?.hisResultStatus || null,
        };
      } catch (error) {
        console.error('Failed to sync study workflow status:', error);
        return {
          ...study,
          WorkflowStatus: 'ERROR',
          OrderStatus: null,
        };
      }
    }));

    const studyUids = uniqueValues(studiesWithWorkflow.map((study: any) => study.MainDicomTags?.StudyInstanceUID).filter(Boolean));
    const dbStudies = await prisma.imagingStudy.findMany({
      where: {
        OR: [
          ...(studyUids.length > 0 ? [{ studyInstanceUid: { in: studyUids } }] : []),
          { isNonDicom: true }
        ]
      },
      include: {
        order: true,
        nonDicomExam: { select: { id: true } },
        reports: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: {
            doctor: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    const nonDicomOnlyStudies = dbStudies.filter(
      (study) => study.isNonDicom && !studyUids.includes(study.studyInstanceUid)
    );

    for (const dbStudy of nonDicomOnlyStudies) {
      const dicomDate = dbStudy.scanStartedAt 
        ? dbStudy.scanStartedAt.toISOString().split('T')[0].replace(/-/g, '') 
        : (dbStudy.createdAt ? dbStudy.createdAt.toISOString().split('T')[0].replace(/-/g, '') : "");
        
      studiesWithWorkflow.push({
        ID: dbStudy.id,
        MainDicomTags: {
          StudyInstanceUID: dbStudy.studyInstanceUid,
          PatientName: dbStudy.patientName || "",
          PatientID: dbStudy.patientId || "",
          StudyDate: dicomDate,
          StudyTime: "",
          AccessionNumber: dbStudy.accessionNumber || "",
          StudyDescription: dbStudy.studyDescription || dbStudy.procedureDescription || "Non-DICOM Exam",
        },
        PatientMainDicomTags: {},
        WorkflowStatus: dbStudy.status,
        isNonDicom: true,
      });
    }

    const dbStudyByUid = new Map(dbStudies.map(study => [study.studyInstanceUid, study]));
    const userIds = uniqueValues(
      dbStudies.flatMap(study => [
        study.assignedDoctorId,
        study.technologistId,
        study.reports?.[0]?.doctorId,
      ])
    );
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, username: true, role: true },
        })
      : [];
    const userById = new Map(users.map(user => [user.id, user]));

    const stationAes = uniqueValues(
      dbStudies.map(study => study.stationAeTitle || study.order?.scheduledStationAeTitle)
    );
    const nodes = stationAes.length
      ? await prisma.dicomNode.findMany({
          where: { aeTitle: { in: stationAes }, isActive: true },
          include: {
            facility: true,
            serviceType: true,
            defaultProcedure: { include: { serviceType: true } },
          },
        })
      : [];
    const nodeByAeTitle = new Map<string, typeof nodes[number]>();
    nodes.forEach(node => {
      if (!nodeByAeTitle.has(node.aeTitle)) nodeByAeTitle.set(node.aeTitle, node);
    });

    const procedureCodes = uniqueValues(
      dbStudies.flatMap(study => [
        study.procedureCode,
        study.order?.procedureCode,
        nodeByAeTitle.get(cleanText(study.stationAeTitle || study.order?.scheduledStationAeTitle))?.defaultProcedure?.code,
      ])
    );
    const procedures = procedureCodes.length
      ? await prisma.procedureCatalog.findMany({
          where: { code: { in: procedureCodes } },
          include: { serviceType: true },
        })
      : [];
    const procedureByCode = new Map(procedures.map(procedure => [procedure.code, procedure]));

    return studiesWithWorkflow.map((study: any) => {
      const uid = study.MainDicomTags?.StudyInstanceUID;
      const dbStudy = uid ? dbStudyByUid.get(uid) : null;
      const report = dbStudy?.reports?.[0] || null;
      const assignedDoctor = dbStudy?.assignedDoctorId ? userById.get(dbStudy.assignedDoctorId) : null;
      const technologist = dbStudy?.technologistId ? userById.get(dbStudy.technologistId) : null;
      const stationAeTitle = cleanText(dbStudy?.stationAeTitle || dbStudy?.order?.scheduledStationAeTitle || study.MainDicomTags?.StationAETitle || study.MainDicomTags?.StationName);
      const node = stationAeTitle ? nodeByAeTitle.get(stationAeTitle) : null;
      const procedureCode = cleanText(dbStudy?.procedureCode || dbStudy?.order?.procedureCode || study.procedureCode || node?.defaultProcedure?.code);
      const procedure = procedureCode ? procedureByCode.get(procedureCode) || node?.defaultProcedure : node?.defaultProcedure;
      const waitingSince =
        dbStudy?.status === "FINALIZED"
          ? dbStudy.finalizedAt || dbStudy.updatedAt || dbStudy.createdAt
          : dbStudy?.receivedAt || dbStudy?.stableAt || dbStudy?.scheduledAt || dbStudy?.createdAt || null;
      const waitingMinutes = minutesSince(waitingSince);
      const priority = dbStudy?.priority || dbStudy?.order?.priority || "ROUTINE";

      return {
        ...study,
        WorkflowStatus: dbStudy?.status || study.WorkflowStatus,
        OrderStatus: dbStudy?.order?.orderStatus || study.OrderStatus || null,
        ReportStatus: report?.cancelledAt ? "CANCELLED" : (report?.status || study.ReportStatus || null),
        AssignedDoctorId: dbStudy?.assignedDoctorId || null,
        AssignedDoctorName: assignedDoctor?.fullName || assignedDoctor?.username || null,
        ReportDoctorId: report?.doctorId || null,
        ReportDoctorName: report?.doctor?.fullName || report?.doctor?.username || null,
        TechnologistId: dbStudy?.technologistId || study.technologistId || null,
        TechnologistName: technologist?.fullName || technologist?.username || null,
        clinicalInfo: dbStudy?.clinicalInfo || study.clinicalInfo || null,
        procedureCode: procedureCode || null,
        procedureName: procedure?.name || null,
        procedureDescription: cleanText(dbStudy?.procedureDescription || dbStudy?.order?.procedureDescription || study.procedureDescription || procedure?.description) || null,
        serviceTypeName: procedure?.serviceType?.name || node?.serviceType?.name || null,
        bodyPart: dbStudy?.bodyPart || study.bodyPart || procedure?.bodyPart || null,
        stationAeTitle: stationAeTitle || null,
        machineName: node?.name || dbStudy?.order?.scheduledStationName || study.MainDicomTags?.StationName || null,
        facilityName: node?.facility?.name || dbStudy?.order?.sourceFacility || null,
        room: node?.room || null,
        priority,
        hisSyncStatus: dbStudy?.hisSyncStatus || dbStudy?.order?.hisSyncStatus || study.hisSyncStatus || null,
        hisResultStatus: dbStudy?.hisResultStatus || report?.hisResultStatus || study.hisResultStatus || null,
        hisLastError: dbStudy?.hisLastError || dbStudy?.order?.hisLastError || report?.hisResultError || null,
        hisLastSyncedAt: toIso(dbStudy?.hisLastSyncedAt || dbStudy?.order?.hisLastSyncedAt),
        hisLastResultSentAt: toIso(dbStudy?.hisLastResultSentAt || report?.hisResultSentAt),
        finalizedAt: toIso(dbStudy?.finalizedAt || report?.finalizedAt),
        deliveredAt: toIso(dbStudy?.deliveredAt),
        waitingSince: toIso(waitingSince),
        waitingMinutes,
        slaStatus: resolveSlaStatus(waitingMinutes, priority),
        isNonDicom: dbStudy?.isNonDicom || (study as any).isNonDicom || false,
        nonDicomExamId: (dbStudy as any)?.nonDicomExam?.id || (study as any).nonDicomExamId || null,
      };
    });
  } catch (error) {
    console.error('Failed to fetch from Orthanc:', error);
    return [];
  }
}

export async function getActiveDoctorsAction() {
  await requirePermission("studies.assign");
  try {
    const doctors = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["DOCTOR", "ADMIN"] },
      },
      select: { id: true, fullName: true, username: true }
    });
    return doctors.map(d => ({
      value: d.id,
      label: `${d.fullName} (${d.username})`
    }));
  } catch (error: any) {
    console.error("Failed to fetch doctors:", error);
    return [];
  }
}

/**
 * Server Action: Lưu kết quả chẩn đoán (RIS Report) vào Database Postgres thông qua Prisma.
 */
export async function saveReportAction(data: {
  studyInstanceUid: string;
  findings: string;
  conclusion: string;
  recommendation: string;
  status: 'DRAFT' | 'FINAL';
  doctorId?: string;
  printTemplateId?: string;
}) {
  if (!data.studyInstanceUid || typeof data.studyInstanceUid !== 'string' || data.studyInstanceUid.trim() === '') {
    return { success: false, error: 'Mã ca chụp không hợp lệ.' };
  }

  try {
    const draftRes = await saveReportDraft(data.studyInstanceUid, {
      findings: data.findings,
      conclusion: data.conclusion,
      recommendation: data.recommendation,
      printTemplateId: data.printTemplateId,
    });

    if (!draftRes.success) return draftRes;

    if (data.status === 'FINAL') {
      const finalRes = await finalizeReport(data.studyInstanceUid);
      if (!finalRes.success) return finalRes;
    }

    const report = await prisma.report.findUnique({
      where: { studyInstanceUid: data.studyInstanceUid },
      include: {
        doctor: { include: { doctorProfile: true } },
      },
    });

    let message = 'Đã lưu nháp thành công.';
    if (data.status === 'FINAL' && report?.status === 'FINAL') {
      message = 'Duyệt và ký số kết quả thành công!';
    } else if (data.status === 'FINAL' && report?.status === 'PENDING_APPROVAL') {
      message = 'Đã gửi yêu cầu phê duyệt kết quả!';
    }

    return {
      success: true,
      message,
      report,
    };
  } catch (error: any) {
    console.error('Error in saveReportAction:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function assignStudyDoctorAction(studyInstanceUid: string, doctorId: string) {
  return assignStudyDoctor(studyInstanceUid, doctorId);
}

export async function startReadingStudyAction(studyInstanceUid: string) {
  return startReading(studyInstanceUid);
}

export async function updateClinicalInfoAction(studyInstanceUid: string, input: any) {
  return updateClinicalInfo(studyInstanceUid, input);
}

export async function addIndicationAction(studyInstanceUid: string, input: any) {
  return addOrUpdateIndication(studyInstanceUid, input);
}

export async function cancelStudyDraftAction(studyInstanceUid: string, reason: string) {
  return cancelReportDraft(studyInstanceUid, reason);
}

export async function unfinalizeStudyAction(studyInstanceUid: string, reason: string) {
  return unfinalizeReport(studyInstanceUid, reason);
}

export async function markStudyDeliveredAction(studyInstanceUid: string) {
  return markDelivered(studyInstanceUid);
}

export async function approveStudyReportAction(studyInstanceUid: string) {
  return approveReport(studyInstanceUid);
}

export async function getUserPermissionsAction() {
  const session = await auth();
  if (!session?.user) return { role: 'GUEST', permissions: [], userId: '' };
  return { role: session.user.role, permissions: session.user.permissions, userId: session.user.id };
}
