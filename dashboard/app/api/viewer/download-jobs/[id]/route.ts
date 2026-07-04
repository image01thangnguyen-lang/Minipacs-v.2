import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authz = await requireApiPermission('viewer.export');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;
  const jobId = params.id;

  try {
    const job = await prisma.viewerDownloadJob.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (job.requestedByUserId !== userId) {
      // In production, might allow ADMIN to see all jobs, but limit to owner for MVP
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const serializedJob = {
      ...job,
      fileSizeBytes: job.fileSizeBytes ? job.fileSizeBytes.toString() : null
    };

    return NextResponse.json({ success: true, data: serializedJob });
  } catch (error) {
    console.error('Failed to fetch download job:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // This could be for /cancel or other actions if routed here
  // But Next.js App Router usually uses separate folder for /cancel. Let's handle it via query string ?action=cancel if needed, or assume it's just cancel
  
  const authz = await requireApiPermission('viewer.export');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;
  const jobId = params.id;

  try {
    const data = await request.json();
    const action = data.action;

    if (action === 'CANCEL') {
      const job = await prisma.viewerDownloadJob.findUnique({ where: { id: jobId } });
      if (!job) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      if (job.requestedByUserId !== userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      
      if (job.status === 'PENDING' || job.status === 'RUNNING') {
        const updated = await prisma.viewerDownloadJob.update({
          where: { id: jobId },
          data: { status: 'CANCELLED' }
        });
        const serializedUpdated = {
          ...updated,
          fileSizeBytes: updated.fileSizeBytes ? updated.fileSizeBytes.toString() : null
        };
        return NextResponse.json({ success: true, data: serializedUpdated });
      }
      return NextResponse.json({ success: false, error: 'Cannot cancel job in current state' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to act on download job:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
