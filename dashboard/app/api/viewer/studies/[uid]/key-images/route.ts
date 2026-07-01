import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function trimOptionalString(value: unknown, maxLength = 500) {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const authz = await requireApiPermission('studies.read');
  if (!authz.ok) return authz.response;

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
  const authz = await requireApiPermission('studies.read');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;

  try {
    const data = await request.json();

    const keyImage = await prisma.viewerKeyImage.create({
      data: {
        studyInstanceUid: params.uid,
        seriesInstanceUid: data.seriesInstanceUid,
        sopInstanceUid: data.sopInstanceUid,
        frameNumber: parseOptionalNumber(data.frameNumber),
        imageIndex: parseOptionalNumber(data.imageIndex),
        imageCount: parseOptionalNumber(data.imageCount),
        modality: data.modality,
        bodyPartExamined: data.bodyPartExamined,
        seriesDescription: data.seriesDescription,
        viewportState: data.viewportState ? JSON.stringify(data.viewportState) : null,
        windowWidth: parseOptionalNumber(data.windowWidth),
        windowCenter: parseOptionalNumber(data.windowCenter),
        zoom: parseOptionalNumber(data.zoom),
        displaySetInstanceUID: data.displaySetInstanceUID,
        note: trimOptionalString(data.note),
        createdByUserId: userId,
      }
    });

    return NextResponse.json({ success: true, data: keyImage });
  } catch (error) {
    console.error('Failed to create key image:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
