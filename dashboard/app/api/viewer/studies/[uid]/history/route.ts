import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  // Return empty array to avoid fake data
  return NextResponse.json([]);
}
