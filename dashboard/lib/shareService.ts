import { prisma } from '@/app/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface CreateShareLinkInput {
  scope: 'STUDY' | 'REPORT' | 'NON_DICOM_EXAM' | 'MEDIA_SET' | 'VIEWER_ARTIFACTS';
  studyInstanceUid?: string;
  imagingStudyId?: string;
  reportId?: string;
  nonDicomExamId?: string;
  createdByUserId: string;
  expiresInDays: number;
  password?: string;
  hidePatientInfo: boolean;
  allowDownload: boolean;
  allowImages: boolean;
  allowReport: boolean;
  allowMeasurements: boolean;
  maxAccessCount?: number;
}

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getShareCookieValue(token: string, type: 'auth' | 'session') {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is missing in production');
    }
    return crypto.createHmac('sha256', 'default-secret').update(`${token}:${type}`).digest('hex');
  }
  return crypto.createHmac('sha256', secret).update(`${token}:${type}`).digest('hex');
}

export function isValidShareCookie(token: string, type: 'auth' | 'session', value: string | undefined) {
  if (!value) return false;
  try {
    const expected = getShareCookieValue(token, type);
    const a = Buffer.from(value);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

export async function createShareLink(input: CreateShareLinkInput) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  
  let passwordHash = null;
  if (input.password) {
    passwordHash = await bcrypt.hash(input.password, 10);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

  const shareLink = await prisma.shareLink.create({
    data: {
      tokenHash,
      scope: input.scope,
      studyInstanceUid: input.studyInstanceUid,
      imagingStudyId: input.imagingStudyId,
      reportId: input.reportId,
      nonDicomExamId: input.nonDicomExamId,
      createdByUserId: input.createdByUserId,
      expiresAt,
      passwordHash,
      passwordRequired: !!input.password,
      hidePatientInfo: input.hidePatientInfo,
      allowDownload: input.allowDownload,
      allowImages: input.allowImages,
      allowReport: input.allowReport,
      allowMeasurements: input.allowMeasurements,
      maxAccessCount: input.maxAccessCount,
    }
  });

  return { shareLink, token };
}

export async function getShareLinksForResource(scope: string, resourceId: string) {
  const whereClause: any = { scope };
  if (scope === 'STUDY') {
    whereClause.studyInstanceUid = resourceId;
  } else if (scope === 'REPORT') {
    whereClause.reportId = resourceId;
  } else if (scope === 'NON_DICOM_EXAM') {
    whereClause.nonDicomExamId = resourceId;
  }

  return prisma.shareLink.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      createdByUser: { select: { fullName: true, username: true } },
      revokedByUser: { select: { fullName: true, username: true } }
    }
  });
}

export async function revokeShareLink(id: string, revokedByUserId: string, reason?: string) {
  return prisma.shareLink.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedByUserId,
      revokeReason: reason
    }
  });
}

export async function logShareAccess(shareLinkId: string, eventType: string, reqDetails?: { ipHash?: string; userAgentHash?: string; viewerSessionId?: string }) {
  try {
    await prisma.shareAccessLog.create({
      data: {
        shareLinkId,
        eventType,
        ...reqDetails
      }
    });
  } catch (e) {
    console.error("Failed to log share access", e);
  }
}

export async function validateToken(token: string, bypassAccessCheck: boolean = false) {
  const tokenHash = hashToken(token);
  const shareLink = await prisma.shareLink.findUnique({
    where: { tokenHash }
  });

  if (!shareLink) {
    return { valid: false, reason: 'NOT_FOUND' };
  }

  if (shareLink.status === 'REVOKED') {
    return { valid: false, reason: 'REVOKED', shareLink };
  }

  if (shareLink.expiresAt < new Date()) {
    if (shareLink.status !== 'EXPIRED') {
      await prisma.shareLink.update({ where: { id: shareLink.id }, data: { status: 'EXPIRED' } });
    }
    return { valid: false, reason: 'EXPIRED', shareLink };
  }

  if (shareLink.status === 'LOCKED') {
    return { valid: false, reason: 'LOCKED', shareLink };
  }

  if (!bypassAccessCheck && shareLink.maxAccessCount !== null && shareLink.accessCount >= shareLink.maxAccessCount) {
    return { valid: false, reason: 'MAX_ACCESS_REACHED', shareLink };
  }

  return { valid: true, shareLink };
}

export async function verifyShareLinkPassword(token: string, passwordAttempt: string) {
  const { valid, reason, shareLink } = await validateToken(token);
  if (!valid || !shareLink) {
    return { success: false, reason };
  }

  if (!shareLink.passwordRequired || !shareLink.passwordHash) {
    return { success: true, shareLink };
  }

  const isMatch = await bcrypt.compare(passwordAttempt, shareLink.passwordHash);
  if (!isMatch) {
    const failedAttempts = shareLink.failedPasswordAttempts + 1;
    const isLocked = failedAttempts >= 5;
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { 
        failedPasswordAttempts: failedAttempts,
        status: isLocked ? 'LOCKED' : shareLink.status,
        lockedAt: isLocked ? new Date() : shareLink.lockedAt
      }
    });
    
    await logShareAccess(shareLink.id, 'PASSWORD_FAILED');
    return { success: false, reason: isLocked ? 'LOCKED' : 'INVALID_PASSWORD', remainingAttempts: 5 - failedAttempts };
  }

  // Reset failed attempts on success
  if (shareLink.failedPasswordAttempts > 0) {
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { failedPasswordAttempts: 0 }
    });
  }

  await logShareAccess(shareLink.id, 'PASSWORD_PASSED');
  return { success: true, shareLink };
}
