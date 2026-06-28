import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studyUid = searchParams.get('studyInstanceUid');

  // Mock snapshots
  return NextResponse.json([
    {
      id: 'snap-1',
      studyInstanceUid: studyUid,
      createdAt: new Date().toISOString(),
      seriesDescription: 'Axial C+',
      imageIndex: 12,
    },
    {
      id: 'snap-2',
      studyInstanceUid: studyUid,
      createdAt: new Date().toISOString(),
      seriesDescription: 'Coronal T2',
      imageIndex: 45,
    }
  ]);
}

export async function POST(request: Request) {
  const data = await request.json();
  console.log('[Mock API] Snapshot saved:', data);
  return NextResponse.json({ success: true, message: 'Snapshot saved to mock backend' });
}
