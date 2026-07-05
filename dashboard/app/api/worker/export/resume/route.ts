import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { processExportJob } from '@/lib/export-worker';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const workerSecret = process.env.WORKER_SECRET || process.env.AUTH_SECRET;
    if (!workerSecret) {
      return NextResponse.json({ error: 'Worker secret is not configured' }, { status: 503 });
    }

    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${workerSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Find jobs that are PENDING or have been RUNNING for more than 1 hour (likely stuck)
    const stuckTime = new Date();
    stuckTime.setHours(stuckTime.getHours() - 1);

    const pendingJobs = await prisma.exportJob.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'RUNNING', updatedAt: { lt: stuckTime } }
        ]
      },
      take: 5 // Process 5 at a time
    });

    if (pendingJobs.length === 0) {
      return NextResponse.json({ message: 'No pending jobs found' });
    }

    // Trigger processing asynchronously
    for (const job of pendingJobs) {
      processExportJob(job.id, { allowStaleRunning: true }).catch(console.error);
    }

    return NextResponse.json({ message: `Triggered resume for ${pendingJobs.length} jobs` });
  } catch (error: any) {
    console.error('Failed to resume export jobs:', error);
    return NextResponse.json({ error: 'Failed to resume export jobs' }, { status: 500 });
  }
}
