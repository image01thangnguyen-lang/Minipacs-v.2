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

    return studiesWithWorkflow;
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
  if (!session?.user) return { role: 'GUEST', permissions: [] };
  return { role: session.user.role, permissions: session.user.permissions };
}
