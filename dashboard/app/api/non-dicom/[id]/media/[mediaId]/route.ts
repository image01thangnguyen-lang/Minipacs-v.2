import { NextResponse } from "next/server";
import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

export async function GET(req: Request, { params }: { params: { id: string; mediaId: string } }) {
  try {
    await requirePermission("nonDicom.read");

    const media = await prisma.nonDicomMedia.findUnique({
      where: { id: params.mediaId }
    });

    if (!media || media.examId !== params.id || media.status === "VOIDED") {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileStat = await stat(media.filePath).catch(() => null);
    if (!fileStat) {
      return new NextResponse("File not found on disk", { status: 404 });
    }

    const fileStream = createReadStream(media.filePath) as any;

    return new NextResponse(fileStream, {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent((media as any).originalFilename || (media as any).originalFileName || (media as any).fileName || "file")}"`,
      },
    });
  } catch (err: any) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; mediaId: string } }) {
  try {
    const session = await requirePermission("nonDicom.deleteMedia");

    const exam = await prisma.nonDicomExam.findUnique({
      where: { id: params.id },
      include: { media: { where: { id: params.mediaId } } }
    });

    if (!exam || exam.media.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    }

    if (exam.status === "COMPLETED") {
      return NextResponse.json({ error: "Không thể xóa file của ca chụp đã hoàn thành." }, { status: 400 });
    }

    const media = exam.media[0];

    // Soft delete trong DB
    await prisma.nonDicomMedia.update({
      where: { id: media.id },
      data: { status: "VOIDED" }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: (session as any).id || (session as any).user?.id,
        action: "NON_DICOM_MEDIA_DELETED",
        entityType: "NonDicomMedia",
        entityId: media.id,
        message: `Đã xóa tệp ${media.filePath.split(/[\\/]/).pop()}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
