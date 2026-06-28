import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studyUid = searchParams.get('studyInstanceUid');

  // Return empty array instead of fake mock data
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const data = await request.json();
  console.log('[Mock API] Snapshot saved:', data);
  return NextResponse.json({ success: true, message: 'Snapshot saved to mock backend' });
}
