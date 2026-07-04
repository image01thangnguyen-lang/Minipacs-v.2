import { prisma } from "@/app/db";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function getUploadFolderPath(machineId?: string | null): Promise<string> {
  // Find node's default upload folder
  if (machineId) {
    const node = await prisma.dicomNode.findUnique({
      where: { id: machineId },
      include: { defaultUploadFolder: true }
    });
    if (node?.defaultUploadFolder?.path) {
      return node.defaultUploadFolder.path;
    }
  }

  // Fallback to first available upload folder
  const uploadFolder = await prisma.storageFolderConfig.findFirst({
    where: { type: "UPLOAD", isActive: true }
  });

  if (uploadFolder?.path) {
    return uploadFolder.path;
  }

  // Final fallback to local filesystem
  const fallbackPath = path.join(process.cwd(), "data", "nondicom_uploads");
  await fs.mkdir(fallbackPath, { recursive: true });
  return fallbackPath;
}

export async function saveNonDicomMediaFile(
  examId: string,
  buffer: Buffer,
  originalFilename: string,
  machineId?: string | null
): Promise<{ filePath: string; fileSizeBytes: bigint }> {
  const folderPath = await getUploadFolderPath(machineId);
  const examFolder = path.join(folderPath, examId);
  
  await fs.mkdir(examFolder, { recursive: true });

  const ext = path.extname(originalFilename) || ".bin";
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const fileName = `${uniqueId}${ext}`;
  const filePath = path.join(examFolder, fileName);

  await fs.writeFile(filePath, buffer);
  const stats = await fs.stat(filePath);

  return { filePath, fileSizeBytes: BigInt(stats.size) };
}

export async function getMediaFileBuffer(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    return null;
  }
}
