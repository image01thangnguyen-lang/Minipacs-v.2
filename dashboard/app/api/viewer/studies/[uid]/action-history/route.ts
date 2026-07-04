import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const authz = await requireApiPermission('viewer.history');
  if (!authz.ok) return authz.response;

  const studyInstanceUid = params.uid;

  if (!studyInstanceUid) {
    return NextResponse.json({ success: false, error: 'Missing studyInstanceUid' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const actionFilter = searchParams.get('action');
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);
  const skip = Number(searchParams.get('skip')) || 0;

  try {
    const whereClause: any = { studyInstanceUid };
    if (actionFilter) {
      whereClause.action = actionFilter;
    }

    const logs = await prisma.viewerAuditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    });
    
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Failed to fetch action history:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
