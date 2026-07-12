"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";

export async function getStorageFoldersAction() {
  await requirePermission("admin.storage");
  const folders = await prisma.storageFolderConfig.findMany({
    orderBy: { createdAt: "desc" },
    include: { facility: { select: { id: true, name: true } } }
  });
  const facilities = await prisma.facilityUnit.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
  return { folders, facilities };
}

export async function upsertStorageFolderAction(data: {
  id?: string;
  code: string;
  name: string;
  type: string;
  path: string;
  facilityId?: string;
  isActive: boolean;
}) {
  const actor = await requirePermission("admin.storage");

  if (!data.code || !data.name || !data.path || !data.type) {
    return { success: false, error: "Vui lòng điền đầy đủ các trường bắt buộc" };
  }

  try {
    let folderId = data.id;
    if (data.id) {
      await prisma.storageFolderConfig.update({
        where: { id: data.id },
        data: {
          code: data.code,
          name: data.name,
          type: data.type,
          path: data.path,
          facilityId: data.facilityId || null,
          isActive: data.isActive,
        }
      });
    } else {
      const created = await prisma.storageFolderConfig.create({
        data: {
          code: data.code,
          name: data.name,
          type: data.type,
          path: data.path,
          facilityId: data.facilityId || null,
          isActive: data.isActive,
        }
      });
      folderId = created.id;
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: data.id ? "UPDATE_STORAGE_FOLDER" : "CREATE_STORAGE_FOLDER",
        entityType: "StorageFolderConfig",
        entityId: folderId,
        message: `Đã ${data.id ? 'cập nhật' : 'tạo'} cấu hình lưu trữ: ${data.name} (${data.code})`,
      }
    });

    revalidatePath("/admin/storage");
    return { success: true };
  } catch (err: any) {
    if (err.code === "P2002") return { success: false, error: "Mã Storage Folder đã tồn tại" };
    console.error("upsertStorageFolderAction error:", err);
    return { success: false, error: err.message || "Lỗi lưu cấu hình lưu trữ" };
  }
}

export async function checkStorageFolderAction(id: string) {
  const actor = await requirePermission("admin.storage");
  const folder = await prisma.storageFolderConfig.findUnique({ where: { id } });

  if (!folder) return { success: false, error: "Không tìm thấy cấu hình lưu trữ" };

  let status = "FAILED";
  let message = "";

  try {
    const stat = await fs.stat(folder.path);
    if (stat.isDirectory()) {
      status = "OK";
      message = "Kết nối thành công. Thư mục tồn tại.";
      // Try to write a tiny temp file to check permissions
      try {
        const testFile = `${folder.path}/.test-write-${Date.now()}`;
        await fs.writeFile(testFile, "test");
        await fs.unlink(testFile);
        message = "Kết nối thành công. Có quyền Đọc/Ghi.";
      } catch (writeErr: any) {
        message = "Kết nối thành công. Chỉ có quyền Đọc (Không thể ghi).";
        status = "READ_ONLY";
      }
    } else {
      message = "Đường dẫn không phải là thư mục.";
    }
  } catch (err: any) {
    message = `Lỗi truy cập đường dẫn: ${err.message}`;
  }

  await prisma.storageFolderConfig.update({
    where: { id },
    data: {
      lastCheckStatus: status,
      lastCheckMessage: message,
      lastCheckAt: new Date(),
    }
  });

  revalidatePath("/admin/storage");
  return { success: status !== "FAILED", message, status };
}

export async function deleteStorageFolderAction(id: string) {
  const actor = await requirePermission("admin.storage");
  try {
    const folder = await prisma.storageFolderConfig.findUnique({ where: { id } });
    if (!folder) return { success: false, error: "Không tìm thấy cấu hình" };

    // Soft-delete: set isActive=false instead of hard delete
    // to avoid breaking DicomNode references (defaultFolder, defaultShareFolder, defaultUploadFolder)
    await prisma.storageFolderConfig.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "DEACTIVATE_STORAGE_FOLDER",
        entityType: "StorageFolderConfig",
        entityId: id,
        message: `Đã khóa cấu hình lưu trữ: ${folder.name}`,
      }
    });

    revalidatePath("/admin/storage");
    return { success: true };
  } catch (err: any) {
    console.error("deleteStorageFolderAction error:", err);
    return { success: false, error: "Có lỗi khi khóa cấu hình lưu trữ." };
  }
}
