'use server';

import { prisma } from '../../db';
import { syncOrthancStudyToRis, updateStudyStatusForReport } from '@/lib/studyStatus';
import { auth } from '@/auth';

export async function getStudyDetails(studyInstanceUID: string) {
  const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
  const username = process.env.ORTHANC_USERNAME || 'admin';
  const password = process.env.ORTHANC_PASSWORD || 'admin_password';

  try {
    // We need to query Orthanc for the specific study by StudyInstanceUID
    // Orthanc's /tools/find is great for this
    const response = await fetch(`${orthancUrl}/tools/find`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Level: "Study",
        Query: {
          StudyInstanceUID: studyInstanceUID
        },
        Expand: true
      }),
      cache: 'no-store'
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
  try {
    const report = await prisma.report.findUnique({
      where: { studyInstanceUid },
      include: {
        imagingStudy: true,
        doctor: {
          include: { doctorProfile: true }
        }
      }
    });
    return report;
  } catch (err) {
    console.error("Failed to get report DB:", err);
    return null;
  }
}

export async function upsertReport(studyInstanceUid: string, data: {
  status: 'UNREAD' | 'DRAFTING' | 'COMPLETED',
  findings?: string,
  conclusion?: string,
  recommendation?: string
}) {
  try {
    const session = await auth();
    const doctorId = session?.user?.id && ["DOCTOR", "ADMIN"].includes(session.user.role)
      ? session.user.id
      : undefined;

    const report = await prisma.report.upsert({
      where: { studyInstanceUid },
      update: {
        status: data.status,
        findings: data.findings,
        conclusion: data.conclusion,
        recommendation: data.recommendation,
        ...(doctorId ? { doctorId } : {})
      },
      create: {
        studyInstanceUid,
        status: data.status,
        findings: data.findings,
        conclusion: data.conclusion,
        recommendation: data.recommendation,
        ...(doctorId ? { doctorId } : {})
      },
      include: {
        doctor: {
          include: { doctorProfile: true }
        }
      }
    });
    await updateStudyStatusForReport(studyInstanceUid, data.status);
    return { success: true, report };
  } catch (error) {
    console.error("Failed to upsert report:", error);
    return { success: false, error: 'Database error' };
  }
}

export async function getDefaultTemplate() {
  try {
    // Attempt to find the default template or the first one available
    // Need to use any to bypass type issues if DB isn't updated yet in this sandbox
    const template = await (prisma as any).printTemplate?.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    });
    if (template) return template.htmlContent;

    const anyTemplate = await (prisma as any).printTemplate?.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    if (anyTemplate) return anyTemplate.htmlContent;
    
    // Fallback HTML if nothing in DB
    return `
      <div style="text-align: center;">
        <h1>PHÒNG KHÁM AI DEFAULT</h1>
        <hr />
      </div>
      <h2>KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH</h2>
      <p><strong>Bệnh nhân:</strong> {{PATIENT_NAME}} - {{PATIENT_ID}}</p>
      <hr />
      <h3>MÔ TẢ (FINDINGS)</h3>
      <p>{{REPORT_CONTENT}}</p>
      <br />
      <h3>KẾT LUẬN (CONCLUSION)</h3>
      <p>{{CONCLUSION}}</p>
    `;
  } catch (err) {
    console.error("Failed to fetch template:", err);
    return null;
  }
}
