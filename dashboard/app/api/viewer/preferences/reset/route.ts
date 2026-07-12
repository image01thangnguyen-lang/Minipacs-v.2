import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

export async function POST(request: Request) {
  const authz = await requireApiPermission('viewer.configure');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;

  try {
    await prisma.viewerUserPreference.deleteMany({
      where: { userId }
    });

    return NextResponse.json({ success: true, message: 'Preferences reset to default' });
  } catch (error) {
    console.error('Failed to reset preferences', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
