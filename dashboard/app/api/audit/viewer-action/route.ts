import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.studyInstanceUid || typeof data.studyInstanceUid !== 'string' || !data.action || typeof data.action !== 'string') {
      return NextResponse.json({ success: false, message: 'Missing or invalid required fields' }, { status: 400 });
    }

    const action = data.action.slice(0, 100);
    const metadataJson = data.metadata ? JSON.stringify(data.metadata).slice(0, 5000) : null;

    // Fire and forget, don't await strictly if we want to return fast
    await prisma.viewerAuditLog.create({
      data: {
        studyInstanceUid: data.studyInstanceUid,
        action: action,
        metadataJson: metadataJson,
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
