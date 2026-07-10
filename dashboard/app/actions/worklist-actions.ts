'use server'

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { WorklistQueryRequestSchema } from '@/lib/worklist/contract';
import { queryWorklist } from '@/lib/worklist/query-service';
import { queryWorklistFacets } from '@/lib/worklist/facets';

export async function getScopedWorklistAction(payload: unknown) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  await requirePermission("studies.read");
  
  // Xóa cache để luôn lấy mới nhất
  const request = WorklistQueryRequestSchema.parse(payload);
  
  try {
    const result = await queryWorklist(request, session.user.id);
    return result;
  } catch (error: any) {
    // Do not echo database/auth details or query payloads (which may contain PHI).
    console.error("getScopedWorklistAction failed", { name: error?.name, code: error?.code });
    if (error?.message === "INVALID_CURSOR") throw new Error("Invalid or expired worklist cursor");
    throw new Error("Worklist is temporarily unavailable");
  }
}

export async function getScopedWorklistFacetsAction(payload: unknown) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  await requirePermission("studies.read");
  
  const request = WorklistQueryRequestSchema.parse(payload);
  
  try {
    const result = await queryWorklistFacets(request, session.user.id);
    return result;
  } catch (error: any) {
    console.error("getScopedWorklistFacetsAction failed", { name: error?.name, code: error?.code });
    throw new Error("Worklist facets are temporarily unavailable");
  }
}
