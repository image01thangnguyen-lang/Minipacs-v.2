import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';
import { requireViewerStudyScope } from '@/lib/authz/scope/viewer-scope-helper';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const authz = await requireApiPermission('studies.read');
  if (!authz.ok) return authz.response;

  try {
    await requireViewerStudyScope(params.uid, "READ_STUDY_ONLY");
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 });
  }

  try {
    // 1. Find the current study to get patientId
    const currentStudy = await prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: params.uid },
      select: { patientId: true }
    });

    if (!currentStudy || !currentStudy.patientId) {
      return NextResponse.json([]);
    }

    // 2. Find all other studies for the same patient
    const historyStudies = await prisma.imagingStudy.findMany({
      where: {
        patientId: currentStudy.patientId,
        studyInstanceUid: { not: params.uid } // Exclude current
      },
      orderBy: { createdAt: 'desc' },
      select: {
        studyInstanceUid: true,
        modality: true,
        studyDescription: true,
        status: true,
        createdAt: true,
        receivedAt: true,
        scheduledAt: true,
        reports: {
          select: { id: true, status: true },
          take: 1
        }
      }
    });

    // 3. Map to Viewer's history format
    const history = historyStudies.map(study => {
      const dateSource = study.receivedAt || study.scheduledAt || study.createdAt;
      return {
        studyInstanceUid: study.studyInstanceUid,
        studyDate: dateSource.toISOString().split('T')[0],
        modality: study.modality || 'UNKNOWN',
        studyDescription: study.studyDescription || 'No description',
        status: study.reports.length > 0 ? study.reports[0].status : study.status,
        reportUrl: study.reports.length > 0 ? `/report/${study.studyInstanceUid}` : undefined,
      };
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to get study history:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
