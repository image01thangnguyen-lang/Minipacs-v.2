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

export async function upsertReport(studyInstanceUid: string, data: {
  status: 'UNREAD' | 'DRAFTING' | 'COMPLETED';
  findings?: string;
  conclusion?: string;
  recommendation?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Bạn cần đăng nhập để lưu báo cáo.' };
    }
    if (!hasPermission(session.user.role, "reports.write")) {
      return { success: false, error: 'Bạn không có quyền lưu hoặc ký báo cáo.' };
    }
    const doctorId = session?.user?.id && ['DOCTOR', 'ADMIN'].includes(session.user.role)
      ? session.user.id
      : undefined;

    const report = await prisma.report.upsert({
      where: { studyInstanceUid },
      update: {
        status: data.status,
        findings: data.findings,
        conclusion: data.conclusion,
        recommendation: data.recommendation,
        ...(doctorId ? { doctorId } : {}),
      },
      create: {
        studyInstanceUid,
        status: data.status,
        findings: data.findings,
        conclusion: data.conclusion,
        recommendation: data.recommendation,
        ...(doctorId ? { doctorId } : {}),
      },
      include: {
        doctor: {
          include: { doctorProfile: true },
        },
      },
    });

    await updateStudyStatusForReport(studyInstanceUid, data.status);
    return { success: true, report };
  } catch (error) {
    console.error('Failed to upsert report:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function getDefaultTemplate() {
  await requirePermission("reports.read");

  try {
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
