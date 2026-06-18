'use server';

import { prisma } from '../../db';

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
      return studies[0];
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
      where: { studyInstanceUid }
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
    const report = await prisma.report.upsert({
      where: { studyInstanceUid },
      update: {
        status: data.status,
        findings: data.findings,
        conclusion: data.conclusion,
        recommendation: data.recommendation
      },
      create: {
        studyInstanceUid,
        status: data.status,
        findings: data.findings,
        conclusion: data.conclusion,
        recommendation: data.recommendation
      }
    });
    return { success: true, report };
  } catch (error) {
    console.error("Failed to upsert report:", error);
    return { success: false, error: 'Database error' };
  }
}
