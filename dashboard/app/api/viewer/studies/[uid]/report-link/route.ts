import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/app/db';
import { requireViewerStudyScope } from '@/lib/authz/scope/viewer-scope-helper';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập vào Dashboard để xem báo cáo.' }, { status: 401 });
  }

  try {
    await requireViewerStudyScope(params.uid, "READ_STUDY_ONLY");
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 403 });
  }

  try {
    const report = await prisma.report.findUnique({
      where: { studyInstanceUid: params.uid },
      select: { status: true }
    });

    return NextResponse.json({
      url: `/report/${params.uid}`,
      status: report ? report.status.toLowerCase() : 'none'
    });
  } catch (error) {
    console.error('Failed to get report link:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
