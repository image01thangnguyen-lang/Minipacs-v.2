import { NextResponse } from "next/server";
import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { saveNonDicomMediaFile } from "@/lib/nonDicomStorageService";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("nonDicom.capture");
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_SIZE * 1.1) { // 10% overhead buffer
      return NextResponse.json({ error: "Dung lượng tải lên vượt quá giới hạn hệ thống." }, { status: 413 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Không có tệp nào được tải lên." }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json({ error: "Chỉ được tải lên tối đa 20 tệp cùng lúc." }, { status: 400 });
    }

    const exam = await prisma.nonDicomExam.findUnique({
      where: { id: params.id },
    });

    if (!exam) return NextResponse.json({ error: "Không tìm thấy ca chụp." }, { status: 404 });
    if (exam.status === "COMPLETED") return NextResponse.json({ error: "Ca chụp đã hoàn thành, không thể tải thêm." }, { status: 400 });

    const results = [];
    const allowedMimeTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/webm", "video/quicktime",
      "application/pdf"
    ];

    for (const file of files) {
      // Xác định mime type
      const mimeType = file.type || "application/octet-stream";
      
      if (!allowedMimeTypes.includes(mimeType)) {
        return NextResponse.json({ error: `Tệp ${file.name} có định dạng không được hỗ trợ.` }, { status: 400 });
      }
      
      let mediaType = "DOCUMENT";
      if (mimeType.startsWith("image/")) mediaType = "IMAGE";
      else if (mimeType.startsWith("video/")) mediaType = "VIDEO";
      else if (mimeType === "application/pdf") mediaType = "PDF";

      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `Tệp ${file.name} vượt quá dung lượng cho phép (500MB).` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const sizeBytes = BigInt(buffer.length);

      // Lưu file qua service
      const { filePath: storagePath } = await saveNonDicomMediaFile(
        params.id,
        buffer,
        file.name
      );

      // Tạo record database
      const media = await prisma.nonDicomMedia.create({
        data: {
          examId: params.id,
          mediaType,
          source: "UPLOAD",
          status: "ACTIVE",
          mimeType,
          fileSizeBytes: sizeBytes,
          filePath: storagePath,
        },
      });
      
      results.push(media);
    }

    // Nếu ca chụp mới tạo, chuyển sang IN_PROGRESS
    if (exam.status === "REQUESTED") {
      await prisma.nonDicomExam.update({
        where: { id: params.id },
        data: { status: "CAPTURING" }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: (session as any).id || (session as any).user?.id,
        action: "NON_DICOM_MEDIA_UPLOADED",
        entityType: "NonDicomExam",
        entityId: params.id,
        message: `Đã tải lên ${results.length} tệp cho ca chụp Non-DICOM.`,
      }
    });

    return NextResponse.json({ success: true, count: results.length });
  } catch (err: any) {
    console.error("Lỗi tải lên Non-DICOM:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
