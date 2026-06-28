import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  // Mock report link
  return NextResponse.json({
    url: `/report/${params.uid}`,
    status: 'draft'
  });
}
