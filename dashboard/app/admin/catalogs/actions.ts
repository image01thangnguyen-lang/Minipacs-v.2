"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { revalidatePath } from "next/cache";

// --- Service Types ---
export async function getServiceTypes() {
  await requirePermission("admin.catalogs");
  return prisma.serviceTypeCatalog.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function createServiceType(data: FormData) {
  await requirePermission("admin.catalogs");

  const code = data.get("code") as string;
  const name = data.get("name") as string;
  const description = data.get("description") as string;
  const defaultModality = data.get("defaultModality") as string;
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;
  const isActive = data.get("isActive") === "on";

  if (!code || !name) throw new Error("Code and name are required.");

  const exists = await prisma.serviceTypeCatalog.findUnique({ where: { code } });
  if (exists) throw new Error(`Service type with code ${code} already exists.`);

  const result = await prisma.serviceTypeCatalog.create({
    data: {
      code,
      name,
      description,
      defaultModality,
      sortOrder,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}

export async function updateServiceType(data: FormData) {
  await requirePermission("admin.catalogs");

  const id = data.get("id") as string;
  const name = data.get("name") as string;
  const description = data.get("description") as string;
  const defaultModality = data.get("defaultModality") as string;
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;
  const isActive = data.get("isActive") === "on";

  if (!id || !name) throw new Error("ID and name are required.");

  const result = await prisma.serviceTypeCatalog.update({
    where: { id },
    data: {
      name,
      description,
      defaultModality,
      sortOrder,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}

// --- Procedures ---
export async function getProcedures() {
  await requirePermission("admin.catalogs");
  return prisma.procedureCatalog.findMany({
    include: {
      serviceType: true,
    },
    orderBy: [
      { serviceTypeId: "asc" },
      { sortOrder: "asc" },
    ],
  });
}

export async function createProcedure(data: FormData) {
  await requirePermission("admin.catalogs");

  const code = data.get("code") as string;
  const name = data.get("name") as string;
  const serviceTypeId = data.get("serviceTypeId") as string;
  const modality = data.get("modality") as string;
  const bodyPart = data.get("bodyPart") as string;
  const defaultPrice = parseFloat(data.get("defaultPrice") as string) || null;
  const hisCode = data.get("hisCode") as string;
  const insuranceCode = data.get("insuranceCode") as string;
  const requiresContrast = data.get("requiresContrast") === "on";
  const isNonDicomEligible = data.get("isNonDicomEligible") === "on";
  const isActive = data.get("isActive") === "on";

  if (!code || !name) throw new Error("Code and name are required.");

  const exists = await prisma.procedureCatalog.findUnique({ where: { code } });
  if (exists) throw new Error(`Procedure with code ${code} already exists.`);

  const result = await prisma.procedureCatalog.create({
    data: {
      code,
      name,
      serviceTypeId: serviceTypeId || null,
      modality: modality || null,
      bodyPart: bodyPart || null,
      defaultPrice,
      hisCode: hisCode || null,
      insuranceCode: insuranceCode || null,
      requiresContrast,
      isNonDicomEligible,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}

export async function updateProcedure(data: FormData) {
  await requirePermission("admin.catalogs");

  const id = data.get("id") as string;
  const name = data.get("name") as string;
  const serviceTypeId = data.get("serviceTypeId") as string;
  const modality = data.get("modality") as string;
  const bodyPart = data.get("bodyPart") as string;
  const defaultPrice = parseFloat(data.get("defaultPrice") as string) || null;
  const hisCode = data.get("hisCode") as string;
  const insuranceCode = data.get("insuranceCode") as string;
  const requiresContrast = data.get("requiresContrast") === "on";
  const isNonDicomEligible = data.get("isNonDicomEligible") === "on";
  const isActive = data.get("isActive") === "on";

  if (!id || !name) throw new Error("ID and name are required.");

  const result = await prisma.procedureCatalog.update({
    where: { id },
    data: {
      name,
      serviceTypeId: serviceTypeId || null,
      modality: modality || null,
      bodyPart: bodyPart || null,
      defaultPrice,
      hisCode: hisCode || null,
      insuranceCode: insuranceCode || null,
      requiresContrast,
      isNonDicomEligible,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}

// --- ICD ---
export async function getIcds() {
  await requirePermission("admin.catalogs");
  return prisma.icdCatalog.findMany({
    orderBy: { code: "asc" },
  });
}

export async function createIcd(data: FormData) {
  await requirePermission("admin.catalogs");

  const code = data.get("code") as string;
  const name = data.get("name") as string;
  const chapter = data.get("chapter") as string;
  const groupCode = data.get("groupCode") as string;
  const description = data.get("description") as string;
  const isActive = data.get("isActive") === "on";

  if (!code || !name) throw new Error("Code and name are required.");

  const exists = await prisma.icdCatalog.findUnique({ where: { code } });
  if (exists) throw new Error(`ICD code ${code} already exists.`);

  const result = await prisma.icdCatalog.create({
    data: {
      code,
      name,
      chapter: chapter || null,
      groupCode: groupCode || null,
      description: description || null,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}

export async function updateIcd(data: FormData) {
  await requirePermission("admin.catalogs");

  const id = data.get("id") as string;
  const name = data.get("name") as string;
  const chapter = data.get("chapter") as string;
  const groupCode = data.get("groupCode") as string;
  const description = data.get("description") as string;
  const isActive = data.get("isActive") === "on";

  if (!id || !name) throw new Error("ID and name are required.");

  const result = await prisma.icdCatalog.update({
    where: { id },
    data: {
      name,
      chapter: chapter || null,
      groupCode: groupCode || null,
      description: description || null,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}

// --- Supplies ---
export async function getSupplies() {
  await requirePermission("admin.catalogs");
  return prisma.supplyCatalog.findMany({
    orderBy: { code: "asc" },
  });
}

export async function createSupply(data: FormData) {
  await requirePermission("admin.catalogs");

  const code = data.get("code") as string;
  const name = data.get("name") as string;
  const unit = data.get("unit") as string;
  const description = data.get("description") as string;
  const defaultPrice = parseFloat(data.get("defaultPrice") as string) || null;
  const isActive = data.get("isActive") === "on";

  if (!code || !name) throw new Error("Code and name are required.");

  const exists = await prisma.supplyCatalog.findUnique({ where: { code } });
  if (exists) throw new Error(`Supply code ${code} already exists.`);

  const result = await prisma.supplyCatalog.create({
    data: {
      code,
      name,
      unit: unit || null,
      description: description || null,
      defaultPrice,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}

export async function updateSupply(data: FormData) {
  await requirePermission("admin.catalogs");

  const id = data.get("id") as string;
  const name = data.get("name") as string;
  const unit = data.get("unit") as string;
  const description = data.get("description") as string;
  const defaultPrice = parseFloat(data.get("defaultPrice") as string) || null;
  const isActive = data.get("isActive") === "on";

  if (!id || !name) throw new Error("ID and name are required.");

  const result = await prisma.supplyCatalog.update({
    where: { id },
    data: {
      name,
      unit: unit || null,
      description: description || null,
      defaultPrice,
      isActive,
    },
  });

  revalidatePath("/admin/catalogs");
  return result;
}
