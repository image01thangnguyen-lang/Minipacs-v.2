"use server";

import { prisma } from "@/app/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { normalizeRole as normalizeAppRole, type AppRole } from "@/lib/permissions";

type RoleValue = AppRole;

const SIGNATURE_UPLOAD_DIR =
  process.env.NODE_ENV === "production"
    ? "/app/pacs_data/report_images"
    : path.resolve(process.cwd(), "../pacs_data/report_images");

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

async function requireAdmin() {
  return requirePermission("users.manage");
}

function readRole(value: string): RoleValue {
  return normalizeAppRole(value);
}

async function saveSignature(file: File | null) {
  if (!file || file.size === 0) return null;

  const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validMimeTypes.includes(file.type)) {
    throw new Error("Chữ ký phải là ảnh JPG, PNG, WEBP hoặc GIF.");
  }

  await mkdir(SIGNATURE_UPLOAD_DIR, { recursive: true });

  const ext = (path.extname(file.name) || (file.type === "image/jpeg" ? ".jpg" : ".png")).toLowerCase();
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".png";
  const filename = `signature-${crypto.randomUUID()}${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(SIGNATURE_UPLOAD_DIR, filename), buffer);

  return `/api/images/${filename}`;
}

export async function getUsersForAdmin() {
  await requireAdmin();

  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      doctorProfile: true,
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });
}

export async function createUserAction(formData: FormData) {
  const actor = await requireAdmin();

  const username = readText(formData, "username").toLowerCase();
  const fullName = readText(formData, "fullName");
  const password = readText(formData, "password");
  const role = readRole(readText(formData, "role"));

  if (!username || !fullName || !password) {
    throw new Error("Vui lòng nhập đủ username, họ tên và mật khẩu.");
  }

  if (password.length < 6) {
    throw new Error("Mật khẩu cần tối thiểu 6 ký tự.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const signaturePath = role === "DOCTOR"
    ? await saveSignature(formData.get("signature") as File | null)
    : null;

  const user = await prisma.user.create({
    data: {
      username,
      fullName,
      password: hashedPassword,
      role,
      isActive: true,
    },
  });

  if (role === "DOCTOR") {
    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        title: readText(formData, "title") || null,
        specialty: readText(formData, "specialty") || null,
        licenseNumber: readText(formData, "licenseNumber") || null,
        signatureImagePath: signaturePath,
        isSigningDoctor: formData.get("isSigningDoctor") === "on",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      message: `Created user ${username}`,
      metadataJson: JSON.stringify({ role }),
    },
  });

  revalidatePath("/admin/users");
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireAdmin();

  const userId = readText(formData, "userId");
  const fullName = readText(formData, "fullName");
  const role = readRole(readText(formData, "role"));
  const password = readText(formData, "password");
  const isActive = formData.get("isActive") === "on";

  if (!userId || !fullName) {
    throw new Error("Thiếu thông tin người dùng.");
  }

  if (actor.id === userId && !isActive) {
    throw new Error("Không thể tự khóa tài khoản đang đăng nhập.");
  }

  if (actor.id === userId && role !== "ADMIN") {
    throw new Error("Không thể tự gỡ quyền Admin của tài khoản đang đăng nhập.");
  }

  const updateData: any = {
    fullName,
    role,
    isActive,
  };

  if (password) {
    if (password.length < 6) {
      throw new Error("Mật khẩu mới cần tối thiểu 6 ký tự.");
    }
    updateData.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  const signaturePath = await saveSignature(formData.get("signature") as File | null);
  const shouldHaveDoctorProfile = role === "DOCTOR";

  if (shouldHaveDoctorProfile) {
    await prisma.doctorProfile.upsert({
      where: { userId },
      update: {
        title: readText(formData, "title") || null,
        specialty: readText(formData, "specialty") || null,
        licenseNumber: readText(formData, "licenseNumber") || null,
        isSigningDoctor: formData.get("isSigningDoctor") === "on",
        ...(signaturePath ? { signatureImagePath: signaturePath } : {}),
      },
      create: {
        userId,
        title: readText(formData, "title") || null,
        specialty: readText(formData, "specialty") || null,
        licenseNumber: readText(formData, "licenseNumber") || null,
        isSigningDoctor: formData.get("isSigningDoctor") === "on",
        signatureImagePath: signaturePath,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: userId,
      message: `Updated user ${userId}`,
      metadataJson: JSON.stringify({ role, isActive, signatureUpdated: Boolean(signaturePath) }),
    },
  });

  revalidatePath("/admin/users");
}
