'use server';

import { auth } from '@/auth';
import { prisma } from '../../db';
import { syncOrthancStudyToRis, updateStudyStatusForReport } from '@/lib/studyStatus';
import { requirePermission } from '@/lib/authz';
import { resolveScope } from "@/lib/authz/scope/scope-resolver";
import { resolveResourceContext } from "@/lib/authz/scope/resource-context";
import { ScopeRequestContext } from "@/lib/authz/scope/scope-request-context";
import { getScopeDeps } from "@/lib/authz/scope/deps";
import { loadOrganizationTree } from "@/lib/authz/scope/organization-tree-loader";

function cleanText(value?: string | null) {
  return (value || "").trim();
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

async function getStudyOperationalInfo(studyInstanceUid: string) {
  const study = await prisma.imagingStudy.findUnique({
    where: { studyInstanceUid },
    include: {
      order: true,
      reports: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          doctor: {
            select: { id: true, fullName: true, username: true },
          },
        },
      },
    },
  });
  if (!study) return {};

  const report = study.reports?.[0] || null;
  const userIds = [study.assignedDoctorId, study.technologistId, report?.doctorId].filter(Boolean) as string[];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(new Set(userIds)) } },
        select: { id: true, fullName: true, username: true },
      })
    : [];
  const userById = new Map(users.map(user => [user.id, user]));

  const stationAeTitle = cleanText(study.stationAeTitle || study.order?.scheduledStationAeTitle);
  const node = stationAeTitle
    ? await prisma.dicomNode.findFirst({
        where: { aeTitle: stationAeTitle, isActive: true },
        include: {
          facility: true,
          serviceType: true,
          defaultProcedure: { include: { serviceType: true } },
        },
      })
    : null;
  const procedureCode = cleanText(study.procedureCode || study.order?.procedureCode || node?.defaultProcedure?.code);
  const procedure = procedureCode
    ? await prisma.procedureCatalog.findUnique({
        where: { code: procedureCode },
        include: { serviceType: true },
      }).catch(() => null)
    : node?.defaultProcedure || null;
  const assignedDoctor = study.assignedDoctorId ? userById.get(study.assignedDoctorId) : null;
  const technologist = study.technologistId ? userById.get(study.technologistId) : null;

  return {
    AssignedDoctorId: study.assignedDoctorId || null,
    AssignedDoctorName: assignedDoctor?.fullName || assignedDoctor?.username || null,
    ReportDoctorId: report?.doctorId || null,
    ReportDoctorName: report?.doctor?.fullName || report?.doctor?.username || null,
    TechnologistId: study.technologistId || null,
    TechnologistName: technologist?.fullName || technologist?.username || null,
    clinicalInfo: study.clinicalInfo || report?.clinicalInfo || null,
    procedureCode: procedureCode || null,
    procedureName: procedure?.name || null,
    procedureDescription: cleanText(study.procedureDescription || study.order?.procedureDescription || procedure?.description) || null,
    serviceTypeName: procedure?.serviceType?.name || node?.serviceType?.name || null,
    bodyPart: study.bodyPart || procedure?.bodyPart || null,
    stationAeTitle: stationAeTitle || null,
    machineName: node?.name || study.order?.scheduledStationName || null,
    facilityName: node?.facility?.name || study.order?.sourceFacility || null,
    room: node?.room || null,
    priority: study.priority || study.order?.priority || "ROUTINE",
    ReportStatus: report?.cancelledAt ? "CANCELLED" : (report?.status || null),
    finalizedAt: toIso(study.finalizedAt || report?.finalizedAt),
    deliveredAt: toIso(study.deliveredAt),
    hisSyncStatus: study.hisSyncStatus || study.order?.hisSyncStatus || null,
    hisResultStatus: study.hisResultStatus || report?.hisResultStatus || null,
    hisLastError: study.hisLastError || study.order?.hisLastError || report?.hisResultError || null,
    hisLastSyncedAt: toIso(study.hisLastSyncedAt || study.order?.hisLastSyncedAt),
    hisLastResultSentAt: toIso(study.hisLastResultSentAt || report?.hisResultSentAt),
    canSyncHisMatrix: true,
    performingUnitId: study.order?.performingUnitId || null,
  };
}

async function enforceStudyScope(actorId: string, studyInstanceUid: string) {
  const study = await prisma.imagingStudy.findUnique({
    where: { studyInstanceUid },
    include: { order: { select: { performingUnitId: true, scheduledStationAeTitle: true } } }
  });
  if (!study) throw new Error("Không tìm thấy ca chụp.");

  const ctx = ScopeRequestContext.create();
  const decision = await resolveScope(
    actorId,
    "READ_STUDY",
    {
      resourceType: "STUDY",
      performingUnitId: study.order?.performingUnitId || null,
      stationAeTitle: study.stationAeTitle || study.order?.scheduledStationAeTitle || null
    },
    getScopeDeps(),
    ctx
  );
  if (!decision.effectiveAllowed) {
    throw new Error(`Bạn không có quyền truy cập ca chụp này (Mã lỗi: ${decision.reasonCode}).`);
  }
}

export async function getStudyDetails(studyInstanceUID: string) {
  const actor = await requirePermission("reports.read");
  await enforceStudyScope(actor.id, studyInstanceUID);

  const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
  const username = process.env.ORTHANC_USERNAME || 'admin';
  const password = process.env.ORTHANC_PASSWORD || 'admin_password';

  try {
    const response = await fetch(`${orthancUrl}/tools/find`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        Level: 'Study',
        Query: {
          StudyInstanceUID: studyInstanceUID,
        },
        Expand: true,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Orthanc error: ${response.status} ${response.statusText}`);
      return null;
    }

    const studies = await response.json();
    if (studies && studies.length > 0) {
      const workflow = await syncOrthancStudyToRis(studies[0]);
      const operationalInfo = await getStudyOperationalInfo(studyInstanceUID);
      return {
        ...studies[0],
        WorkflowStatus: workflow?.status || 'READY_TO_READ',
        OrderStatus: workflow?.orderStatus || null,
        hisSyncStatus: workflow?.hisSyncStatus || null,
        hisResultStatus: workflow?.hisResultStatus || null,
        ...operationalInfo,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch study details from Orthanc:', error);
    return null;
  }
}

export async function getReport(studyInstanceUid: string) {
  const actor = await requirePermission("reports.read");
  await enforceStudyScope(actor.id, studyInstanceUid);

  try {
    return prisma.report.findUnique({
      where: { studyInstanceUid },
      include: {
        imagingStudy: true,
        doctor: {
          include: { doctorProfile: true },
        },
      },
    });
  } catch (err) {
    console.error('Failed to get report DB:', err);
    return null;
  }
}

import {
  saveReportDraft,
  finalizeReport,
  approveReport,
  cancelReportDraft,
  unfinalizeReport,
  getTechnologists as workflowGetTechnologists
} from '@/lib/workflowService';

export {
  saveReportDraft,
  finalizeReport,
  approveReport,
  cancelReportDraft,
  unfinalizeReport
};

export async function getViewerArtifactsForReportAction(studyInstanceUid: string) {
  const actor = await requirePermission("reports.read");
  await enforceStudyScope(actor.id, studyInstanceUid);

  try {
    const [measurements, keyImages] = await Promise.all([
      (prisma as any).viewerMeasurement?.findMany({
        where: { studyInstanceUid },
      }) || [],
      (prisma as any).viewerKeyImage?.findMany({
        where: { studyInstanceUid },
      }) || [],
    ]);
    return { measurements, keyImages };
  } catch (err) {
    console.error('Failed to get viewer artifacts:', err);
    return { measurements: [], keyImages: [] };
  }
}

export async function getDefaultTemplate(printTemplateId?: string) {
  await requirePermission("reports.read");

  try {
    if (printTemplateId) {
      const template = await (prisma as any).printTemplate?.findUnique({
        where: { id: printTemplateId },
      });
      if (template) return template.htmlContent;
    }

    const template = await (prisma as any).printTemplate?.findFirst({
      where: { isDefault: true, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (template) return template.htmlContent;

    const anyTemplate = await (prisma as any).printTemplate?.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (anyTemplate) return anyTemplate.htmlContent;

    return `
      {{CLINIC_HEADER}}
      <h2>KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH</h2>
      <p><strong>Bệnh nhân:</strong> {{PATIENT_NAME}} - {{PATIENT_ID}}</p>
      <p><strong>Ngày chụp:</strong> {{STUDY_DATE}}</p>
      <p><strong>Chỉ định:</strong> {{STUDY_DESC}}</p>
      <hr />
      <h3>MÔ TẢ (FINDINGS)</h3>
      <p>{{REPORT_CONTENT}}</p>
      <br />
      <h3>KẾT LUẬN (CONCLUSION)</h3>
      <p>{{CONCLUSION}}</p>
      <h3>ĐỀ NGHỊ (RECOMMENDATION)</h3>
      <p>{{RECOMMENDATION}}</p>
      {{CLINIC_FOOTER}}
    `;
  } catch (err) {
    console.error('Failed to fetch template:', err);
    return null;
  }
}

export async function getPrintTemplatesAction() {
  await requirePermission("reports.read");
  try {
    const templates = await prisma.printTemplate.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isDefault: true, htmlContent: true },
      orderBy: { createdAt: 'desc' }
    });
    return templates;
  } catch (err) {
    console.error('Failed to get print templates:', err);
    return [];
  }
}
