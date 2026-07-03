"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export async function getPrintTemplates() {
  await requirePermission("admin.catalogs");

  try {
    const templates = await prisma.printTemplate.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        facility: true,
        procedure: true,
        dicomNode: true,
      }
    });
    return templates;
  } catch (error: any) {
    throw new Error(error.message || "Failed to get print templates");
  }
}

export async function getTemplateReferences() {
  await requirePermission("admin.catalogs");
  
  try {
    const [facilities, procedures, nodes] = await Promise.all([
      prisma.facilityUnit.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.procedureCatalog.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.dicomNode.findMany({ where: { isActive: true }, orderBy: { aeTitle: 'asc' } })
    ]);
    return { facilities, procedures, nodes };
  } catch (error: any) {
    throw new Error(error.message || "Failed to get references");
  }
}

export async function createPrintTemplateAction(data: any) {
  await requirePermission("admin.catalogs");

  try {
    if (data.isDefault) {
      // Unset other default templates if this is global default
      await prisma.printTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const template = await prisma.printTemplate.create({
      data: {
        code: data.code || undefined,
        name: data.name,
        description: data.description,
        htmlContent: data.htmlContent || "",
        isDefault: data.isDefault || false,
        modality: data.modality,
        bodyPart: data.bodyPart,
        facilityId: data.facilityId || undefined,
        procedureCatalogId: data.procedureCatalogId || undefined,
        dicomNodeId: data.dicomNodeId || undefined,
        paperSize: data.paperSize || "A4",
        orientation: data.orientation || "PORTRAIT",
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: parseInt(data.sortOrder) || 0,
        metadataJson: data.metadataJson || undefined,
      }
    });

    revalidatePath("/admin/templates");
    return template;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error(`Mã template "${data.code}" đã tồn tại.`);
    }
    throw new Error(error.message || "Failed to create print template");
  }
}

export async function updatePrintTemplateAction(id: string, data: any) {
  await requirePermission("admin.catalogs");

  try {
    if (data.isDefault) {
      await prisma.printTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const template = await prisma.printTemplate.update({
      where: { id },
      data: {
        code: data.code || undefined,
        name: data.name,
        description: data.description,
        htmlContent: data.htmlContent,
        isDefault: data.isDefault,
        modality: data.modality,
        bodyPart: data.bodyPart,
        facilityId: data.facilityId || null,
        procedureCatalogId: data.procedureCatalogId || null,
        dicomNodeId: data.dicomNodeId || null,
        paperSize: data.paperSize,
        orientation: data.orientation,
        isActive: data.isActive,
        sortOrder: parseInt(data.sortOrder) || 0,
        metadataJson: data.metadataJson || null,
      }
    });

    revalidatePath("/admin/templates");
    return template;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error(`Mã template "${data.code}" đã tồn tại.`);
    }
    throw new Error(error.message || "Failed to update print template");
  }
}

export async function deletePrintTemplateAction(id: string) {
  await requirePermission("admin.catalogs");

  try {
    await prisma.printTemplate.update({
      where: { id },
      data: { isActive: false, isDefault: false }
    });
    revalidatePath("/admin/templates");
    return true;
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete print template");
  }
}
