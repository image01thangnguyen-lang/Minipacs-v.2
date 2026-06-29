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

export async function GET(request: Request) {
  const authz = await requireApiPermission('studies.read');
  if (!authz.ok) return authz.response;

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
  const authz = await requireApiPermission('studies.read');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;

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
