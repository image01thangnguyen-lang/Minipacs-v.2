export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await prisma.exportJob.findMany({
      where: {
        requestedByUserId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const serializedJobs = jobs.map(job => ({
      ...job,
      fileSizeBytes: job.fileSizeBytes ? job.fileSizeBytes.toString() : null
    }));

    return NextResponse.json(serializedJobs);
  } catch (err: any) {
    console.error('GET /api/exports/jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
