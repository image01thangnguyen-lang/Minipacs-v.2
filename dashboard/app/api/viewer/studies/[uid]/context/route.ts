import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const authz = await requireApiPermission('studies.read');
  if (!authz.ok) return authz.response;

  try {
    const study = await prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: params.uid },
      include: {
        order: true,
        reports: {
          select: { status: true },
          take: 1,
        }
      }
    });

    if (!study) {
      return NextResponse.json({ success: false, error: 'Study not found' }, { status: 404 });
    }

    const previousStudyCount = await prisma.imagingStudy.count({
      where: {
        patientId: study.patientId,
        studyInstanceUid: { not: params.uid }
      }
    });

    return NextResponse.json({
      patientName: study.patientName || study.order?.patientName || 'Unknown',
      patientId: study.patientId || study.order?.patientId || 'Unknown',
      accessionNumber: study.accessionNumber || 'Unknown',
      studyStatus: study.status,
      reportStatus: study.reports.length > 0 ? study.reports[0].status : 'UNREAD',
      assignedDoctor: study.assignedDoctorId || 'Unassigned',
      previousStudyCount,
    });
  } catch (error) {
    console.error('Failed to fetch context:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
