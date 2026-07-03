'use server';

import { auth } from '@/auth';
import { prisma } from '../../db';
import { syncOrthancStudyToRis, updateStudyStatusForReport } from '@/lib/studyStatus';
import { requirePermission } from '@/lib/authz';
import { hasPermission } from '@/lib/permissions';

export async function getStudyDetails(studyInstanceUID: string) {
  await requirePermission("reports.read");

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
      return {
        ...studies[0],
        WorkflowStatus: workflow?.status || 'READY_TO_READ',
        OrderStatus: workflow?.orderStatus || null,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch study details from Orthanc:', error);
    return null;
  }
}

export async function getReport(studyInstanceUid: string) {
  await requirePermission("reports.read");

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
  await requirePermission("reports.read");
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
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' },
    });
    if (template) return template.htmlContent;

    const anyTemplate = await (prisma as any).printTemplate?.findFirst({
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
      select: { id: true, name: true, isDefault: true, htmlContent: true },
      orderBy: { createdAt: 'desc' }
    });
    return templates;
  } catch (err) {
    console.error('Failed to get print templates:', err);
    return [];
  }
}
