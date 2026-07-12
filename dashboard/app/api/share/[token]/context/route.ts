import { NextRequest, NextResponse } from 'next/server';
import { validateToken, verifyShareLinkPassword, getShareCookieValue, isValidShareCookie } from '@/lib/shareService';
import { prisma } from '@/app/db';
import { cookies } from 'next/headers';
import { getClinicProfile } from '@/app/settings/clinic-profile/actions';

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params;

  const sessionCookie = cookies().get(`share_session_${token}`);
  const hasSession = isValidShareCookie(token, 'session', sessionCookie?.value);
  const { valid, reason, shareLink } = await validateToken(token, hasSession);

  if (!valid || !shareLink) {
    return NextResponse.json({ error: reason || 'Invalid link' }, { status: 403 });
  }

  const pwdHeader = request.headers.get('x-share-password');

  if (shareLink.passwordRequired) {
    if (!pwdHeader) {
      return NextResponse.json({ error: "Password required" }, { status: 401 });
    }
    const { success } = await verifyShareLinkPassword(token, pwdHeader);
    if (!success) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  }

  // Set a cookie so orthanc proxy knows it's authorized (valid for session)
  cookies().set(`share_auth_${token}`, getShareCookieValue(token, 'auth'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  // Track unique session access to prevent exhaustion by reload
  if (!hasSession) {
    if (shareLink.maxAccessCount !== null) {
      const updateResult = await prisma.shareLink.updateMany({
        where: {
          id: shareLink.id,
          accessCount: { lt: shareLink.maxAccessCount }
        },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date()
        }
      });
      if (updateResult.count === 0) {
        return NextResponse.json({ error: "Access limit reached" }, { status: 403 });
      }
    } else {
      await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date()
        }
      });
    }

    cookies().set(`share_session_${token}`, getShareCookieValue(token, 'session'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }

  return getContextData(shareLink);
}

async function getContextData(shareLink: any) {
  let studyData = null;
  let reportData = null;

  if (shareLink.reportId) {
    reportData = await prisma.report.findUnique({
      where: { id: shareLink.reportId },
      select: { id: true, findings: true, conclusion: true, recommendation: true, status: true, studyInstanceUid: true }
    });
    if (reportData?.status !== 'FINAL') {
      reportData = null;
    }
    if (reportData && reportData.studyInstanceUid) {
      studyData = await prisma.imagingStudy.findUnique({
        where: { studyInstanceUid: reportData.studyInstanceUid }
      });
      // Ensure payload has studyInstanceUid for viewer
      shareLink.studyInstanceUid = shareLink.studyInstanceUid || reportData.studyInstanceUid;
    }
  } else if (shareLink.studyInstanceUid) {
    studyData = await prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: shareLink.studyInstanceUid }
    });

    if (shareLink.allowReport) {
      reportData = await prisma.report.findFirst({
        where: { studyInstanceUid: shareLink.studyInstanceUid, status: "FINAL" },
        select: { id: true, findings: true, conclusion: true, recommendation: true, status: true, studyInstanceUid: true }
      });
    }
  }

  const resData: any = {
    success: true,
    shareScope: shareLink.scope,
    allowImages: shareLink.allowImages,
    allowReport: shareLink.allowReport,
    patientName: studyData?.patientName,
    patientId: studyData?.patientId,
    studyDate: studyData?.studyDate,
    accessionNumber: studyData?.accessionNumber,
    studyInstanceUid: shareLink.studyInstanceUid,
    reportData,
  };

  // Mask patient info if required
  if (shareLink.hidePatientInfo && resData.patientName) {
    resData.patientName = '*** ***';
    resData.patientId = '***';
  }

  return NextResponse.json(resData);
}
