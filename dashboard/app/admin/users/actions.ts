"use server";

import { prisma } from "@/app/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import {
  getPermissionsForRole,
  hasPermission,
  normalizePermissions,
  normalizeRole,
  permissionLabels,
  roleDescriptions,
  roleLabels,
  rolePermissions,
  systemRoles,
  type PermissionKey,
  type SystemRole,
} from "@/lib/permissions";

type RoleProfileRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseRole: SystemRole;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
};

const SIGNATURE_UPLOAD_DIR =
  process.env.NODE_ENV === "production"
    ? "/app/pacs_data/report_images"
    : path.resolve(process.cwd(), "../pacs_data/report_images");

const DOCTOR_SECRETARY_ROLE = {
  code: "DOCTOR_SECRETARY",
  name: "Thư ký bác sĩ",
  description: "Chỉ tra cứu Archive và in lại kết quả theo phân công của bác sĩ.",
  baseRole: "RECEPTION" as SystemRole,
  permissions: ["archive.read"] as PermissionKey[],
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

async function requireAdmin() {
  return requirePermission("users.manage");
}

function normalizeRoleCode(value: string, fallbackName = "CUSTOM_ROLE") {
  const source = value || fallbackName;
  const normalized = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  return normalized || "CUSTOM_ROLE";
}

function readBaseRole(value: string): SystemRole {
  return normalizeRole(value);
}

function expandPermissionDependencies(values: string[]) {
  const permissions = new Set(normalizePermissions(values));
  if (permissions.has("reports.write")) permissions.add("reports.read");
  if (permissions.has("archive.deliver")) permissions.add("archive.read");
  if (permissions.has("statistics.doctorStats")) permissions.add("statistics.read");
  return normalizePermissions(Array.from(permissions));
}

function readPermissions(formData: FormData) {
  const values = formData.getAll("permissions").map(value => String(value));
  return expandPermissionDependencies(values);
}

function readIsActive(formData: FormData) {
  return formData.get("isActive") === "on";
}

async function ensureDefaultRoleProfiles() {
  for (const role of systemRoles) {
    await prisma.appRoleProfile.upsert({
      where: { code: role },
      update: {
        name: roleLabels[role],
        description: roleDescriptions[role],
        baseRole: role,
        permissions: rolePermissions[role],
        isSystem: true,
        isActive: true,
      },
      create: {
        code: role,
        name: roleLabels[role],
        description: roleDescriptions[role],
        baseRole: role,
        permissions: rolePermissions[role],
        isSystem: true,
        isActive: true,
      },
    });
  }

  const existingSecretary = await prisma.appRoleProfile.findUnique({
    where: { code: DOCTOR_SECRETARY_ROLE.code },
  });
  if (!existingSecretary) {
    await prisma.appRoleProfile.create({
      data: {
        ...DOCTOR_SECRETARY_ROLE,
        isSystem: false,
        isActive: true,
      },
    });
  }
}

async function resolveRoleProfile(roleProfileId: string) {
  await ensureDefaultRoleProfiles();
  if (!roleProfileId) throw new Error("Vui lòng chọn vai trò.");

  const roleProfile = await prisma.appRoleProfile.findUnique({
    where: { id: roleProfileId },
  });

  if (!roleProfile || !roleProfile.isActive) {
    throw new Error("Vai trò không tồn tại hoặc đã bị khóa.");
  }

  return roleProfile as RoleProfileRow;
}

async function assertSelfKeepsUserManagement(actorId: string, userId: string, roleProfile: RoleProfileRow, isActive: boolean) {
  if (actorId !== userId) return;
  if (!isActive) {
    throw new Error("Không thể tự khóa tài khoản đang đăng nhập.");
  }
  if (!hasPermission(roleProfile.code, "users.manage", roleProfile.permissions)) {
    throw new Error("Không thể tự gỡ quyền quản lý người dùng của tài khoản đang đăng nhập.");
  }
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
  await ensureDefaultRoleProfiles();

  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      roleProfileId: true,
      roleProfile: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      doctorProfile: true,
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });
}

export async function getRoleProfilesForAdmin() {
  await requireAdmin();
  await ensureDefaultRoleProfiles();

  return prisma.appRoleProfile.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: [
      { isSystem: "desc" },
      { name: "asc" },
    ],
  });
}

export async function createRoleProfileAction(formData: FormData) {
  const actor = await requireAdmin();
  await ensureDefaultRoleProfiles();

  const name = readText(formData, "name");
  const code = normalizeRoleCode(readText(formData, "code"), name);
  const description = readText(formData, "description");
  const baseRole = readBaseRole(readText(formData, "baseRole"));
  const permissions = readPermissions(formData);
  const isActive = readIsActive(formData);

  if (!name) throw new Error("Vui lòng nhập tên vai trò.");
  if (!permissions.length) throw new Error("Vai trò cần có ít nhất một quyền.");
  if (systemRoles.includes(code as SystemRole)) {
    throw new Error("Mã vai trò này đang được dùng cho vai trò hệ thống.");
  }

  const roleProfile = await prisma.appRoleProfile.create({
    data: {
      code,
      name,
      description: description || null,
      baseRole,
      permissions,
      isActive,
      isSystem: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "ROLE_PROFILE_CREATED",
      entityType: "AppRoleProfile",
      entityId: roleProfile.id,
      message: `Created role profile ${roleProfile.name}`,
      metadataJson: JSON.stringify({ code, baseRole, permissions }),
    },
  });

  revalidatePath("/admin/users");
  return roleProfile;
}

export async function updateRoleProfileAction(formData: FormData) {
  const actor = await requireAdmin();
  await ensureDefaultRoleProfiles();

  const roleProfileId = readText(formData, "roleProfileId");
  if (!roleProfileId) throw new Error("Thiếu mã vai trò.");

  const existing = await prisma.appRoleProfile.findUnique({
    where: { id: roleProfileId },
    include: {
      users: {
        select: { id: true },
      },
    },
  });

  if (!existing) throw new Error("Vai trò không tồn tại.");

  const name = readText(formData, "name");
  const description = readText(formData, "description");
  const baseRole = existing.isSystem ? existing.baseRole : readBaseRole(readText(formData, "baseRole"));
  const permissions = existing.isSystem ? getPermissionsForRole(existing.baseRole) : readPermissions(formData);
  const isActive = existing.isSystem ? true : readIsActive(formData);

  if (!name) throw new Error("Vui lòng nhập tên vai trò.");
  if (!permissions.length) throw new Error("Vai trò cần có ít nhất một quyền.");

  const actorUsesThisRole = existing.users.some(user => user.id === actor.id);
  if (actorUsesThisRole && (!isActive || !permissions.includes("users.manage"))) {
    throw new Error("Không thể chỉnh vai trò hiện tại làm mất quyền quản lý người dùng của chính bạn.");
  }

  const roleProfile = await prisma.appRoleProfile.update({
    where: { id: roleProfileId },
    data: {
      name,
      description: description || null,
      baseRole,
      permissions,
      isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "ROLE_PROFILE_UPDATED",
      entityType: "AppRoleProfile",
      entityId: roleProfile.id,
      message: `Updated role profile ${roleProfile.name}`,
      metadataJson: JSON.stringify({ code: roleProfile.code, baseRole, permissions, isActive }),
    },
  });

  revalidatePath("/admin/users");
  return roleProfile;
}

export async function createUserAction(formData: FormData) {
  const actor = await requireAdmin();

  const username = readText(formData, "username").toLowerCase();
  const fullName = readText(formData, "fullName");
  const password = readText(formData, "password");
  const roleProfile = await resolveRoleProfile(readText(formData, "roleProfileId"));
  const role = roleProfile.baseRole;

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
      roleProfileId: roleProfile.id,
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
      metadataJson: JSON.stringify({ role, roleProfileId: roleProfile.id, roleCode: roleProfile.code }),
    },
  });

  revalidatePath("/admin/users");
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireAdmin();

  const userId = readText(formData, "userId");
  const fullName = readText(formData, "fullName");
  const roleProfile = await resolveRoleProfile(readText(formData, "roleProfileId"));
  const role = roleProfile.baseRole;
  const password = readText(formData, "password");
  const isActive = readIsActive(formData);

  if (!userId || !fullName) {
    throw new Error("Thiếu thông tin người dùng.");
  }

  await assertSelfKeepsUserManagement(actor.id, userId, roleProfile, isActive);

  const updateData: any = {
    fullName,
    role,
    roleProfileId: roleProfile.id,
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
      metadataJson: JSON.stringify({
        role,
        roleProfileId: roleProfile.id,
        roleCode: roleProfile.code,
        isActive,
        signatureUpdated: Boolean(signaturePath),
      }),
    },
  });

  revalidatePath("/admin/users");
}

export async function getPermissionDictionaryForAdmin() {
  await requireAdmin();
  return {
    permissionLabels,
  };
}

export async function importUsersDryRunAction(formData: FormData) {
  await requireAdmin();
  await ensureDefaultRoleProfiles();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("Vui lòng chọn file CSV.");
  }

  const text = await file.text();
  const rows = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (rows.length < 2) {
    throw new Error("File CSV trống hoặc không đúng định dạng (cần có dòng tiêu đề).");
  }

  const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
  const usernameIdx = headers.indexOf("username");
  const fullNameIdx = headers.indexOf("fullname");
  const roleIdx = headers.indexOf("role");

  if (usernameIdx === -1 || fullNameIdx === -1 || roleIdx === -1) {
    throw new Error("File CSV thiếu một trong các cột bắt buộc: username, fullname, role.");
  }

  const roleProfiles = await prisma.appRoleProfile.findMany({ where: { isActive: true } });
  const existingUsers = await prisma.user.findMany({ select: { username: true } });
  const existingUsernames = new Set(existingUsers.map(u => u.username.toLowerCase()));

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(",").map(c => c.trim());
    if (cols.length < headers.length) continue;

    const username = cols[usernameIdx];
    const fullName = cols[fullNameIdx];
    const roleCode = cols[roleIdx];

    const errors = [];
    if (!username) errors.push("Thiếu username");
    else if (existingUsernames.has(username.toLowerCase())) errors.push("Username đã tồn tại");
    else if (username.length < 3) errors.push("Username quá ngắn");

    if (!fullName) errors.push("Thiếu fullname");

    let roleName = roleCode;
    if (!roleCode) {
      errors.push("Thiếu role");
    } else {
      const rp = roleProfiles.find(r => r.code === roleCode || r.name === roleCode);
      if (!rp) {
        errors.push("Role không tồn tại");
      } else {
        roleName = rp.name;
      }
    }

    if (errors.length > 0) {
      errorCount++;
      results.push({ row: i + 1, username, fullName, role: roleName, status: "Lỗi", message: errors.join(", ") });
    } else {
      successCount++;
      results.push({ row: i + 1, username, fullName, role: roleName, status: "Hợp lệ", message: "OK" });
    }
  }

  return { successCount, errorCount, results };
}
