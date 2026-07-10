import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/app/db';
import { hasPermission } from '@/lib/permissions';
import { requireViewerStudyScope } from '@/lib/authz/scope/viewer-scope-helper';
import { formatMeasurementSummary } from '@/lib/viewer-measurement-summary';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Ban chua dang nhap.' }, { status: 401 });
  }

  try {
    await requireViewerStudyScope(params.uid, "READ_STUDY_ONLY");
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 403 });
  }

  const canReadReport = hasPermission(session.user.role, 'reports.read', session.user.permissions);
  const canWriteReport = hasPermission(session.user.role, 'reports.write', session.user.permissions);

  try {
    const studyInstanceUid = params.uid;

    // Fetch report
    const report = await prisma.report.findUnique({
      where: { studyInstanceUid },
      include: { doctor: true }
    });

    // Fetch measurements
    const viewerMeasurements = await prisma.viewerMeasurement.findMany({
      where: { studyInstanceUid, isDeleted: false },
      orderBy: { createdAt: 'asc' }
    });

    // Fetch key images
    const keyImages = await prisma.viewerKeyImage.findMany({
      where: { studyInstanceUid },
      orderBy: { createdAt: 'asc' }
    });

    // Fetch snapshots
    const snapshots = await prisma.viewerSnapshot.findMany({
      where: { studyInstanceUid },
      orderBy: { createdAt: 'asc' }
    });

    const reportStatus = report ? report.status.toLowerCase() : 'none';

    return NextResponse.json({
      studyInstanceUid,
      report: {
        id: report?.id || null,
        status: reportStatus,
        url: `/report/${studyInstanceUid}`,
        canRead: canReadReport,
        canWrite: canWriteReport,
        findingsPreview: canReadReport ? report?.findings : undefined,
        conclusionPreview: canReadReport ? report?.conclusion : undefined,
        updatedAt: report?.updatedAt?.toISOString(),
        doctorName: report?.doctor?.fullName,
      },
      measurements: viewerMeasurements.map(formatMeasurementSummary),
      keyImages: keyImages.map(img => ({
        id: img.id,
        label: img.note || undefined, // note is used as label
        thumbnailUrl: undefined, // no thumbnail field in schema
        seriesInstanceUid: img.seriesInstanceUid || undefined,
        sopInstanceUid: img.sopInstanceUid || undefined,
      })),
      snapshots: snapshots.map(snap => ({
        id: snap.id,
        label: snap.note || undefined,
        imageUrl: snap.imageUrl || undefined,
        createdAt: snap.createdAt.toISOString(),
      }))
    });
  } catch (error) {
    console.error('Failed to load report workspace:', error);
    return NextResponse.json({ success: false, message: 'Loi he thong.' }, { status: 500 });
  }
}
