'use server'

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { saveNativeConfig, generateNativeSignature } from '@/lib/services/nativeConnectorService';
import { revalidatePath } from 'next/cache';

export async function saveNativeConfigAction(isEnabled: boolean, baseUrl: string) {
  await requirePermission('native.manage');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await saveNativeConfig(session.user.id, isEnabled, baseUrl);
  revalidatePath('/admin/native');
  return result;
}


export async function generateNativeSignatureAction(method: string, path: string) {
  await requirePermission('native.manage');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  return await generateNativeSignature(method, path);
}
