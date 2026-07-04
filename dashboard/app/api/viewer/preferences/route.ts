import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

export async function GET(request: Request) {
  const authz = await requireApiPermission('viewer.configure');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;

  try {
    const prefs = await prisma.viewerUserPreference.findUnique({
      where: { userId }
    });
    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Failed to fetch preferences', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authz = await requireApiPermission('viewer.configure');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;

  try {
    const data = await request.json();
    const prefs = await prisma.viewerUserPreference.upsert({
      where: { userId },
      update: {
        toolbarPosition: data.toolbarPosition,
        theme: data.theme,
        hotkeysJson: data.hotkeysJson,
        windowLevelPresetsJson: data.windowLevelPresetsJson,
        layoutDefaultsJson: data.layoutDefaultsJson,
        toolVisibilityJson: data.toolVisibilityJson,
        overlayFieldsJson: data.overlayFieldsJson,
        seriesRailJson: data.seriesRailJson,
        anonymizeDefault: data.anonymizeDefault,
      },
      create: {
        userId,
        toolbarPosition: data.toolbarPosition,
        theme: data.theme,
        hotkeysJson: data.hotkeysJson,
        windowLevelPresetsJson: data.windowLevelPresetsJson,
        layoutDefaultsJson: data.layoutDefaultsJson,
        toolVisibilityJson: data.toolVisibilityJson,
        overlayFieldsJson: data.overlayFieldsJson,
        seriesRailJson: data.seriesRailJson,
        anonymizeDefault: data.anonymizeDefault || false,
      }
    });

    return NextResponse.json({ success: true, data: prefs });
  } catch(error) {
    console.error('Failed to update preferences', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
