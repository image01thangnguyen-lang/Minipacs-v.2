"use server";

import { prisma } from "@/app/db";
import { auth } from "@/auth";
import { requireScopedStudyMutation } from "@/lib/authz/scope/require-scoped-access";

export type AutosaveInput = {
  findings?: string;
  conclusion?: string;
  recommendation?: string;
};

export type AutosaveResult = 
  | { success: true; newRevision: number; reportId: string }
  | { success: false; error: string; code: string };

export async function autosaveReportAction(
  studyInstanceUid: string,
  baseRevision: number,
  input: AutosaveInput
): Promise<AutosaveResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

    const { study } = await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "DRAFT_REPORT",
    });

    const existing = await prisma.report.findUnique({
      where: { studyInstanceUid },
      select: { id: true, status: true, cancelledAt: true, revision: true },
    });

    // Status Validations
    if (existing && existing.status === "FINAL") {
      return { success: false, error: "Báo cáo đã duyệt.", code: "FINALIZED" };
    }
    if (existing && existing.status === "PENDING_APPROVAL" && !existing.cancelledAt) {
      return { success: false, error: "Báo cáo đang chờ phê duyệt.", code: "PENDING_APPROVAL" };
    }

    const doctorId = ["DOCTOR", "ADMIN"].includes((session.user as any).baseRole || (session.user as any).role)
      ? session.user.id
      : undefined;

    if (existing) {
      // Optimistic Concurrency Control Update
      // We use updateMany to safely enforce the `revision` match.
      const { count } = await prisma.report.updateMany({
        where: { id: existing.id, revision: baseRevision },
        data: {
          findings: input.findings,
          conclusion: input.conclusion,
          recommendation: input.recommendation,
          revision: { increment: 1 },
          ...(doctorId ? { doctorId } : {}),
        },
      });

      if (count === 0) {
        // Did not match the revision (STALE).
        return { success: false, error: "Phiên bản báo cáo đã cũ do có cập nhật từ nơi khác. Vui lòng tải lại.", code: "STALE_REVISION" };
      }

      // Important: We DO NOT create an AuditLog here to prevent spamming the audit table during rapid typing.
      
      return { success: true, newRevision: baseRevision + 1, reportId: existing.id };
    } else {
      // Revision 0 is the token for "no report existed when loaded". A
      // non-zero token means another request removed/replaced the row.
      if (baseRevision !== 0) {
        return { success: false, error: "Phiên bản báo cáo đã thay đổi.", code: "STALE_REVISION" };
      }
      try {
        const report = await prisma.report.create({
          data: {
            studyInstanceUid,
            status: "DRAFT",
            findings: input.findings,
            conclusion: input.conclusion,
            recommendation: input.recommendation,
            revision: 1,
            imagingStudyId: study.id,
            ...(doctorId ? { doctorId } : {}),
          },
        });
        return { success: true, newRevision: 1, reportId: report.id };
      } catch (error: any) {
        // A concurrent first autosave created the unique study report.
        if (error?.code === "P2002") {
          return { success: false, error: "Báo cáo vừa được tạo ở phiên khác.", code: "STALE_REVISION" };
        }
        throw error;
      }
    }
  } catch (err: any) {
    console.error("Autosave error:", err);
    return { success: false, error: "Internal server error", code: "SERVER_ERROR" };
  }
}
