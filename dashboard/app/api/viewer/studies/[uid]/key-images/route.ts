import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const data = await request.json();
  console.log('[Mock API] Key image saved for study', params.uid, data);
  return NextResponse.json({ success: true, message: 'Key image saved to mock backend' });
}
