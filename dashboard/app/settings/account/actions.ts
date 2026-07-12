'use server'

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { prisma } from '@/app/db';
import * as bcrypt from 'bcryptjs';

const rateLimits = new Map<string, { attempts: number, lockUntil: number }>();

export async function changeMyPasswordAction(currentPassword: string, newPassword: string) {
  await requirePermission('account.selfManage');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const userId = session.user.id;

  // Rate Limiting Check
  const limit = rateLimits.get(userId);
  if (limit && limit.lockUntil > Date.now()) {
    throw new Error('Too many failed attempts. Try again later.');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    // Record failed attempt
    const attempts = (limit?.attempts || 0) + 1;
    if (attempts >= 5) {
      rateLimits.set(userId, { attempts, lockUntil: Date.now() + 15 * 60 * 1000 }); // 15m lockout
    } else {
      rateLimits.set(userId, { attempts, lockUntil: 0 });
    }

    // Log audit for failed password attempt (no plaintext)
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'PASSWORD_CHANGE_FAILED',
        entityType: 'User',
        entityId: userId,
        metadataJson: JSON.stringify({ reason: 'Invalid current password' })
      }
    });

    throw new Error('Invalid current password');
  }

  // Clear rate limit on success
  rateLimits.delete(userId);

  // Validate strength (at least 8 chars)
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      metadataJson: JSON.stringify({ success: true })
    }
  });

  return { success: true };
}

