import { NextResponse } from "next/server";
import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission("nonDicom.read");

    const media = await prisma.nonDicomMedia.findMany({
      where: {
        examId: params.id,
        status: { not: "VOIDED" }
      },
      orderBy: { createdAt: "asc" }
    });

    const serialized = media.map(m => ({
      id: m.id,
      type: m.mediaType,
      status: m.status,
      originalFilename: m.filePath.split(/[\\/]/).pop() || "file",
      mimeType: m.mimeType,
      sizeBytes: m.fileSizeBytes ? Number(m.fileSizeBytes) : 0,
      createdAt: m.createdAt.toISOString()
    }));

    return NextResponse.json({ success: true, media: serialized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
