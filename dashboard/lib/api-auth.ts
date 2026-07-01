import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission, type PermissionKey } from '@/lib/permissions';

export async function requireApiPermission(permission: PermissionKey) {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Ban chua dang nhap.' },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(session.user.role, permission, session.user.permissions)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Ban khong co quyen thuc hien thao tac nay.' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, user: session.user };
}
