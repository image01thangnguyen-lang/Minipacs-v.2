import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const data = await request.json();

    if (!data.studyInstanceUid || !data.action) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Fire and forget, don't await strictly if we want to return fast
    await prisma.viewerAuditLog.create({
      data: {
        studyInstanceUid: data.studyInstanceUid,
        action: data.action,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
        actorUserId: userId,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Audit must not crash the viewer
    console.error('Failed to log viewer action:', error);
    // Always return 200 to prevent breaking UI
    return NextResponse.json({ success: true, warning: 'Audit log failed' });
  }
}
