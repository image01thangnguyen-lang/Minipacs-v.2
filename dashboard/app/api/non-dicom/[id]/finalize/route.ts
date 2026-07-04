import { NextResponse } from "next/server";
import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { completeNonDicomExam } from "@/lib/nonDicomWorkflowService";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("nonDicom.capture");
    
    const exam = await prisma.nonDicomExam.findUnique({
      where: { id: params.id },
      include: { media: { where: { status: { not: "VOIDED" } } } }
    });

    if (!exam) return NextResponse.json({ error: "Không tìm thấy ca chụp." }, { status: 404 });
    if (exam.status === "COMPLETED") return NextResponse.json({ error: "Ca chụp đã hoàn thành." }, { status: 400 });

    const hasMedia = exam.media.some(m => m.status !== "VOIDED");
    if (!hasMedia) {
      return NextResponse.json({ error: "Không thể hoàn thành ca chụp vì chưa có ảnh/video nào." }, { status: 400 });
    }

    const updatedExam = await completeNonDicomExam(params.id, (session as any).id || (session as any).user?.id);

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (err: any) {
    console.error("Lỗi hoàn thành Non-DICOM:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
