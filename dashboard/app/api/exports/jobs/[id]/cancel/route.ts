import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = params;

    const job = await prisma.exportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (job.requestedByUserId !== session.user.id) {
      if (!hasPermission(session.user.role, 'export.manage', session.user.permissions)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (job.status === 'SUCCESS' || job.status === 'FAILED' || job.status === 'CANCELLED' || job.status === 'EXPIRED') {
      return NextResponse.json({ error: 'Cannot cancel a finished job' }, { status: 400 });
    }

    const updated = await prisma.exportJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', completedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'EXPORT_JOB_CANCELLED',
        entityType: 'ExportJob',
        entityId: job.id
      }
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('POST /api/exports/jobs/[id]/cancel error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
