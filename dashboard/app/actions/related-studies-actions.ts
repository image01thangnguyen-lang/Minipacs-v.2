"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/authz";
import { queryRelatedStudies } from "@/lib/workspace/related-studies";

export const RelatedStudiesRequestSchema = z.object({
  anchorStudyUid: z.string().trim().min(1).max(128).regex(/^\d+(?:\.\d+)+$/),
  limit: z.number().int().min(1).max(100).default(50),
  range: z.enum(["ENCOUNTER", "30D", "1Y", "ALL"]).default("ALL"),
}).strict();

export async function getRelatedStudiesAction(payload: unknown) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  await requirePermission("studies.read");

  const parsed = RelatedStudiesRequestSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Yêu cầu lịch sử ca chụp không hợp lệ.");
  }
  const request = parsed.data;

  try {
    const result = await queryRelatedStudies(request.anchorStudyUid, session.user.id, request.limit, request.range);
    return result;
  } catch (error: any) {
    console.error("getRelatedStudiesAction failed", { name: error?.name, code: error?.code });
    if (error?.message === "UNAUTHORIZED_OR_NOT_FOUND") {
      throw new Error("Không tìm thấy ca chụp tham chiếu hoặc bạn không có quyền truy cập.");
    }
    throw new Error("Hệ thống tạm thời không thể tải lịch sử bệnh nhân.");
  }
}
