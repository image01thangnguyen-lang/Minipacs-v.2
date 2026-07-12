"use server";

import { prisma } from "@/app/db";
import { orthancClient, DicomModalityConfig } from "@/lib/orthancClient";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { dicomNodeSchema, type DicomNodeInput } from "./schema";

async function requireAdminAccess() {
  return requirePermission("pacs.manage");
}

export async function getNodesAction() {
  await requireAdminAccess();
  return prisma.dicomNode.findMany({
    include: { facility: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getNodeReferencesAction() {
  await requireAdminAccess();
  const [
    facilities,
    procedures,
    storageFolders,
    shareFolders,
    uploadFolders,
    printTemplates,
    reportTemplates,
    serviceTypes
  ] = await Promise.all([
    prisma.facilityUnit.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.procedureCatalog.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.storageFolderConfig.findMany({ where: { isActive: true, type: "NORMAL" }, orderBy: { name: 'asc' } }),
    prisma.storageFolderConfig.findMany({ where: { isActive: true, type: "SHARE" }, orderBy: { name: 'asc' } }),
    prisma.storageFolderConfig.findMany({ where: { isActive: true, type: "UPLOAD" }, orderBy: { name: 'asc' } }),
    prisma.printTemplate.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.reportTemplateText.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.serviceTypeCatalog.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);
  return { facilities, procedures, storageFolders, shareFolders, uploadFolders, printTemplates, reportTemplates, serviceTypes };
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

    const nodeAeTitle = validData.isNonDicom ? (validData.aeTitle || `NON_DICOM_${Date.now()}`) : validData.aeTitle!;
    const nodeIpAddress = validData.isNonDicom ? (validData.ipAddress || "127.0.0.1") : validData.ipAddress!;
    const nodePort = validData.isNonDicom ? (validData.port || 0) : validData.port!;

    // Call Orthanc API to set Modality only if DICOM
    if (!validData.isNonDicom) {
      const config: DicomModalityConfig = {
        AET: nodeAeTitle,
        Host: nodeIpAddress,
        Port: nodePort,
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
    }

    const updateData = {
      name: validData.name,
      aeTitle: nodeAeTitle,
      ipAddress: nodeIpAddress,
      port: nodePort,
      modality: validData.modality,
      room: validData.room || null,
      isActive: validData.isActive,
      // Phase 3 additions
      isNonDicom: validData.isNonDicom,
      facilityId: validData.facilityId || null,
      defaultFolderId: validData.defaultFolderId || null,
      defaultShareFolderId: validData.defaultShareFolderId || null,
      defaultUploadFolderId: validData.defaultUploadFolderId || null,
      defaultProcedureCatalogId: validData.defaultProcedureCatalogId || null,
      defaultPrintTemplateId: validData.defaultPrintTemplateId || null,
      defaultReportTemplateTextId: validData.defaultReportTemplateTextId || null,
      serviceTypeId: validData.serviceTypeId || null,
    };

    // Save to DB
    let node;
    if (validData.id) {
      node = await prisma.dicomNode.update({
        where: { id: validData.id },
        data: updateData
      });
    } else {
      node = await prisma.dicomNode.create({
        data: {
          ...updateData,
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

    // Only delete from Orthanc if it's a DICOM node
    if (!node.isNonDicom) {
      try {
        await orthancClient.deleteModality(node.orthancAlias);
      } catch (orthancError: any) {
        console.error("Orthanc deleteModality error:", orthancError);
      }
    }

    // Soft delete instead of hard delete to preserve config relations
    await prisma.dicomNode.update({
      where: { id },
      data: { isActive: false }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "DICOM_NODE_DELETED",
        entityType: "DicomNode",
        entityId: node.id,
        message: `Đã vô hiệu hóa (soft-delete) Dicom Node ${node.name} (${node.aeTitle})`,
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
