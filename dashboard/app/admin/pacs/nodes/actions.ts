"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { orthancClient, DicomModalityConfig } from "@/lib/orthancClient";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const adminRoles = new Set(["ADMIN"]);

async function requireAdminAccess() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!adminRoles.has(session.user.role)) redirect("/");
  return session.user;
}

export const dicomNodeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Vui lòng nhập tên thiết bị"),
  aeTitle: z.string().min(1, "Vui lòng nhập AE Title").max(16, "AE Title tối đa 16 ký tự"),
  ipAddress: z.string().min(1, "Vui lòng nhập địa chỉ IP"),
  port: z.number().int().min(1).max(65535),
  modality: z.string().min(1, "Vui lòng chọn Modality"),
  room: z.string().optional(),
  isActive: z.boolean().default(true),
  orthancAlias: z.string().min(1, "Vui lòng nhập Alias cho Orthanc"),
});

export type DicomNodeInput = z.infer<typeof dicomNodeSchema>;

export async function getNodesAction() {
  await requireAdminAccess();
  return prisma.dicomNode.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertNodeAction(data: DicomNodeInput) {
  const actor = await requireAdminAccess();
  
  try {
    const validData = dicomNodeSchema.parse(data);
    
    // Check for alias uniqueness in DB if creating new
    if (!validData.id) {
      const existing = await prisma.dicomNode.findUnique({
        where: { orthancAlias: validData.orthancAlias }
      });
      if (existing) {
        return { success: false, error: "Alias này đã tồn tại trong hệ thống." };
      }
    }

    // Call Orthanc API to set Modality
    const config: DicomModalityConfig = {
      AET: validData.aeTitle,
      Host: validData.ipAddress,
      Port: validData.port,
      Manufacturer: "Generic",
      AllowEcho: true,
      AllowFind: true,
      AllowMove: true,
      AllowStore: true
    };

    try {
      await orthancClient.putModality(validData.orthancAlias, config);
    } catch (orthancError: any) {
      console.error("Orthanc putModality error:", orthancError);
      return { 
        success: false, 
        error: `Không thể lưu cấu hình lên Orthanc: ${orthancError.message}. Hãy chắc chắn DicomModalitiesInDatabase được bật.` 
      };
    }

    // Save to DB
    let node;
    if (validData.id) {
      node = await prisma.dicomNode.update({
        where: { id: validData.id },
        data: {
          name: validData.name,
          aeTitle: validData.aeTitle,
          ipAddress: validData.ipAddress,
          port: validData.port,
          modality: validData.modality,
          room: validData.room || null,
          isActive: validData.isActive,
        }
      });
    } else {
      node = await prisma.dicomNode.create({
        data: {
          name: validData.name,
          aeTitle: validData.aeTitle,
          ipAddress: validData.ipAddress,
          port: validData.port,
          modality: validData.modality,
          room: validData.room || null,
          isActive: validData.isActive,
          orthancAlias: validData.orthancAlias,
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: validData.id ? "DICOM_NODE_UPDATED" : "DICOM_NODE_CREATED",
        entityType: "DicomNode",
        entityId: node.id,
        message: `Đã ${validData.id ? "cập nhật" : "tạo"} Dicom Node ${node.name} (${node.aeTitle})`,
      }
    });

    revalidatePath("/admin/pacs/nodes");
    return { success: true, node };
  } catch (err: any) {
    console.error("upsertNodeAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteNodeAction(id: string) {
  const actor = await requireAdminAccess();
  
  try {
    const node = await prisma.dicomNode.findUnique({ where: { id } });
    if (!node) return { success: false, error: "Node không tồn tại." };

    try {
      await orthancClient.deleteModality(node.orthancAlias);
    } catch (orthancError: any) {
      console.error("Orthanc deleteModality error:", orthancError);
      // We continue deleting from DB even if Orthanc fails, or maybe we shouldn't.
      // Usually better to warn user but still allow cleanup.
    }

    await prisma.dicomNode.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "DICOM_NODE_DELETED",
        entityType: "DicomNode",
        entityId: node.id,
        message: `Đã xóa Dicom Node ${node.name} (${node.aeTitle})`,
      }
    });

    revalidatePath("/admin/pacs/nodes");
    return { success: true };
  } catch (err: any) {
    console.error("deleteNodeAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function pingNodeAction(id: string) {
  const actor = await requireAdminAccess();
  
  try {
    const node = await prisma.dicomNode.findUnique({ where: { id } });
    if (!node) return { success: false, error: "Node không tồn tại." };

    let status = "UNKNOWN";
    let message = "";
    
    try {
      const response = await orthancClient.pingModality(node.orthancAlias);
      status = "OK";
      message = "Ping successful";
    } catch (err: any) {
      status = "FAILED";
      message = err.message || "Ping failed";
    }

    const updatedNode = await prisma.dicomNode.update({
      where: { id },
      data: {
        lastEchoStatus: status,
        lastEchoMessage: message,
        lastEchoAt: new Date(),
      }
    });

    revalidatePath("/admin/pacs/nodes");
    return { success: true, node: updatedNode };
  } catch (err: any) {
    console.error("pingNodeAction error:", err);
    return { success: false, error: err.message };
  }
}
