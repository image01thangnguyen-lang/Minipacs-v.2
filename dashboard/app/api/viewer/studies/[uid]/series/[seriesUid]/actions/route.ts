import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

export async function POST(request: Request, { params }: { params: { uid: string, seriesUid: string } }) {
  let authz = await requireApiPermission('viewer.deleteSeries');
  if (!authz.ok) {
     authz = await requireApiPermission('pacs.manage');
     if (!authz.ok) return authz.response;
  }
  const userId = authz.user.id;

  const data = await request.json();
  const actionType = data.actionType;

  if (actionType === 'DELETE_REQUEST') {
    if (!data.reason || data.reason.trim() === '') {
      return NextResponse.json({ success: false, error: 'Reason is required' }, { status: 400 });
    }

    try {
      const actionRequest = await prisma.viewerSeriesActionRequest.create({
        data: {
          studyInstanceUid: params.uid,
          seriesInstanceUid: params.seriesUid,
          actionType: 'DELETE',
          status: 'PENDING',
          reason: data.reason,
          requestedByUserId: userId,
        }
      });
      
      await prisma.viewerAuditLog.create({
        data: {
          studyInstanceUid: params.uid,
          action: 'SERIES_DELETE_REQUESTED',
          actorUserId: userId,
          metadataJson: JSON.stringify({ seriesUid: params.seriesUid, reason: data.reason }),
        }
      });

      return NextResponse.json({ success: true, data: actionRequest });
    } catch (error) {
      console.error('Failed to request series delete:', error);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
  }

  // Other actions like convert to key images
  return NextResponse.json({ success: false, error: 'Unsupported actionType' }, { status: 400 });
}
