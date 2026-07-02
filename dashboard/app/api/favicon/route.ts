import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const profile = await prisma.clinicProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (profile?.logoPath) {
      return NextResponse.redirect(new URL(profile.logoPath, request.url));
    }
  } catch (e) {
    console.error("Error fetching favicon:", e);
  }

  // Fallback to default OHIF 4-square logo
  return NextResponse.redirect(new URL("/default-favicon.png", request.url));
}
