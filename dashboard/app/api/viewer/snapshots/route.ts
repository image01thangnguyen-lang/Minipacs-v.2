import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studyUid = searchParams.get('studyInstanceUid');

  if (!studyUid) {
    return NextResponse.json({ success: false, error: 'Missing studyInstanceUid' }, { status: 400 });
  }

  try {
    const snapshots = await prisma.viewerSnapshot.findMany({
      where: { studyInstanceUid: studyUid },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Failed to get snapshots:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    const data = await request.json();
    
    if (!data.studyInstanceUid) {
      return NextResponse.json({ success: false, error: 'Missing studyInstanceUid' }, { status: 400 });
    }

    const snapshot = await prisma.viewerSnapshot.create({
      data: {
        studyInstanceUid: data.studyInstanceUid,
        seriesInstanceUid: data.seriesInstanceUid,
        sopInstanceUid: data.sopInstanceUid,
        frameNumber: data.frameNumber ? parseInt(data.frameNumber) : null,
        imageIndex: data.imageIndex ? parseInt(data.imageIndex) : null,
        imageCount: data.imageCount ? parseInt(data.imageCount) : null,
        modality: data.modality,
        bodyPartExamined: data.bodyPartExamined,
        seriesDescription: data.seriesDescription,
        viewportState: data.viewportState ? JSON.stringify(data.viewportState) : null,
        windowWidth: data.windowWidth ? parseFloat(data.windowWidth) : null,
        windowCenter: data.windowCenter ? parseFloat(data.windowCenter) : null,
        zoom: data.zoom ? parseFloat(data.zoom) : null,
        displaySetInstanceUID: data.displaySetInstanceUID,
        note: data.note,
        imageUrl: data.imageUrl,
        createdByUserId: userId,
      }
    });

    return NextResponse.json({ success: true, data: snapshot });
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
