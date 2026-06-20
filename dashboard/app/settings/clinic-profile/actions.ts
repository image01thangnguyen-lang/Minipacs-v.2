"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const CLINIC_UPLOAD_DIR =
  process.env.NODE_ENV === "production"
    ? "/app/pacs_data/report_images"
    : path.resolve(process.cwd(), "../pacs_data/report_images");

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function emptyToNull(value: string) {
  return value || null;
}

function serializeClinicProfile(profile: any) {
  if (!profile) {
    return {
      id: "",
      name: "Mini PACS",
      legalName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      logoPath: "",
      headerText: "Hệ thống chẩn đoán hình ảnh",
      footerText: "Phiếu kết quả được phát hành từ hệ thống Mini PACS.",
      licenseNumber: "",
      defaultReportLanguage: "vi",
    };
  }

  return {
    id: profile.id,
    name: profile.name || "Mini PACS",
    legalName: profile.legalName || "",
    address: profile.address || "",
    phone: profile.phone || "",
    email: profile.email || "",
    website: profile.website || "",
    logoPath: profile.logoPath || "",
    headerText: profile.headerText || "",
    footerText: profile.footerText || "",
    licenseNumber: profile.licenseNumber || "",
    defaultReportLanguage: profile.defaultReportLanguage || "vi",
  };
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user;
}

async function saveClinicLogo(file: File | null) {
  if (!file || file.size === 0) return null;

  const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validMimeTypes.includes(file.type)) {
    throw new Error("Logo phải là ảnh JPG, PNG, WEBP hoặc GIF.");
  }

  await mkdir(CLINIC_UPLOAD_DIR, { recursive: true });

  const ext = (path.extname(file.name) || (file.type === "image/jpeg" ? ".jpg" : ".png")).toLowerCase();
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".png";
  const filename = `clinic-logo-${crypto.randomUUID()}${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(CLINIC_UPLOAD_DIR, filename), buffer);
  return `/api/images/${filename}`;
}

export async function getClinicProfile() {
  const profile = await prisma.clinicProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return serializeClinicProfile(profile);
}

export async function saveClinicProfileAction(formData: FormData) {
  const actor = await requireAdmin();

  const name = readText(formData, "name");
  if (!name) {
    throw new Error("Vui lòng nhập tên phòng khám.");
  }

  const existing = await prisma.clinicProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const logoPath = await saveClinicLogo(formData.get("logo") as File | null);

  const data = {
    name,
    legalName: emptyToNull(readText(formData, "legalName")),
    address: emptyToNull(readText(formData, "address")),
    phone: emptyToNull(readText(formData, "phone")),
    email: emptyToNull(readText(formData, "email")),
    website: emptyToNull(readText(formData, "website")),
    headerText: emptyToNull(readText(formData, "headerText")),
    footerText: emptyToNull(readText(formData, "footerText")),
    licenseNumber: emptyToNull(readText(formData, "licenseNumber")),
    defaultReportLanguage: readText(formData, "defaultReportLanguage") || "vi",
    ...(logoPath ? { logoPath } : {}),
  };

  const profile = existing
    ? await prisma.clinicProfile.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.clinicProfile.create({
        data: {
          ...data,
          logoPath: logoPath || null,
        },
      });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "CLINIC_PROFILE_UPDATED",
      entityType: "ClinicProfile",
      entityId: profile.id,
      message: `Updated clinic profile ${profile.name}`,
      metadataJson: JSON.stringify({
        logoUpdated: Boolean(logoPath),
        defaultReportLanguage: profile.defaultReportLanguage,
      }),
    },
  });

  revalidatePath("/settings/clinic-profile");
  revalidatePath("/");
  return serializeClinicProfile(profile);
}
