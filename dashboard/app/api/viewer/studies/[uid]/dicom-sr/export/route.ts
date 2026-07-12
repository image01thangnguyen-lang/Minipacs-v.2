import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/app/db';
import { requireViewerStudyScope } from '@/lib/authz/scope/viewer-scope-helper';

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Ban chua dang nhap.' }, { status: 401 });
  }

  try {
    await requireViewerStudyScope(params.uid, "DRAFT_REPORT");
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 403 });
  }

  try {
    const studyInstanceUid = params.uid;

    const measurements = await prisma.viewerMeasurement.findMany({
      where: { studyInstanceUid, isDeleted: false }
    });

    const eligibleMeasurements = measurements.filter(m => m.sopInstanceUid);
    const ineligibleMeasurements = measurements.filter(m => !m.sopInstanceUid);

    // According to Phase 14 plan: return deferred status if not fully supported/mapped.
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'dicom_sr_export_deferred',
        entityType: 'Study',
        entityId: studyInstanceUid,
        metadataJson: JSON.stringify({
          eligibleCount: eligibleMeasurements.length,
          ineligibleCount: ineligibleMeasurements.length
        }),
      }
    });

    return NextResponse.json({
      success: false,
      status: 'deferred',
      message: 'DICOM SR export requires complete SOP/frame mapping. This feature is deferred.',
      eligibleMeasurementCount: eligibleMeasurements.length,
      ineligibleMeasurementCount: ineligibleMeasurements.length
    }, { status: 400 });
  } catch (error) {
    console.error('Failed to export DICOM SR:', error);
    return NextResponse.json({ success: false, message: 'Loi he thong.' }, { status: 500 });
  }
}
