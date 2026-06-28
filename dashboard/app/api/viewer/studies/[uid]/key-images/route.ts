import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/auth';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  try {
    const keyImages = await prisma.viewerKeyImage.findMany({
      where: { studyInstanceUid: params.uid },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(keyImages);
  } catch (error) {
    console.error('Failed to get key images:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    const data = await request.json();

    const keyImage = await prisma.viewerKeyImage.create({
      data: {
        studyInstanceUid: params.uid,
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
        createdByUserId: userId,
      }
    });

    return NextResponse.json({ success: true, data: keyImage });
  } catch (error) {
    console.error('Failed to create key image:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
