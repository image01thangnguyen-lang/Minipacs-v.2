import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

export async function GET(request: Request) {
  const authz = await requireApiPermission('viewer.export');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;

  try {
    const jobs = await prisma.viewerDownloadJob.findMany({
      where: { requestedByUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const serializedJobs = jobs.map(job => ({
      ...job,
      fileSizeBytes: job.fileSizeBytes ? job.fileSizeBytes.toString() : null
    }));

    return NextResponse.json({ success: true, data: serializedJobs });
  } catch (error) {
    console.error('Failed to list download jobs:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authz = await requireApiPermission('viewer.export');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;

  try {
    const data = await request.json();

    if (!data.studyInstanceUid || !data.jobType) {
      return NextResponse.json({ success: false, error: 'Missing studyInstanceUid or jobType' }, { status: 400 });
    }

    if (data.anonymize) {
      const anonAuthz = await requireApiPermission('viewer.anonymize');
      if (!anonAuthz.ok) return anonAuthz.response;
    }

    const job = await prisma.viewerDownloadJob.create({
      data: {
        jobType: data.jobType,
        status: 'PENDING',
        studyInstanceUid: data.studyInstanceUid,
        seriesInstanceUid: data.seriesInstanceUid,
        requestedByUserId: userId,
        anonymize: data.anonymize || false,
        includePatientInfo: data.includePatientInfo ?? true,
      }
    });

    // Mock background processor for MVP
    setTimeout(async () => {
      try {
        const updatedRunning = await prisma.viewerDownloadJob.updateMany({
          where: { id: job.id, status: 'PENDING' },
          data: { status: 'RUNNING', progress: 50 }
        });
        if (updatedRunning.count === 0) return;

        await new Promise(r => setTimeout(r, 2000));

        await prisma.viewerDownloadJob.updateMany({
          where: { id: job.id, status: 'RUNNING' },
          data: {
            status: 'SUCCESS',
            progress: 100,
            fileName: `export_${data.studyInstanceUid.substring(0, 8)}_${job.id.substring(0, 8)}.zip`,
            filePath: `/api/viewer/mock-downloads/export_${data.studyInstanceUid.substring(0, 8)}_${job.id.substring(0, 8)}.zip`,
            fileSizeBytes: 10485760,
            completedAt: new Date()
          }
        });
      } catch (e) {
        console.error('Mock processor failed', e);
      }
    }, 1000);

    // Log action
    await prisma.viewerAuditLog.create({
      data: {
        studyInstanceUid: data.studyInstanceUid,
        action: 'DOWNLOAD_REQUESTED',
        actorUserId: userId,
        metadataJson: JSON.stringify({ jobId: job.id, jobType: job.jobType }),
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        fileSizeBytes: job.fileSizeBytes ? job.fileSizeBytes.toString() : null
      }
    });
  } catch (error) {
    console.error('Failed to create download job:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
