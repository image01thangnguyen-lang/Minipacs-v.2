"use server";

import { prisma } from "@/app/db";
import { getUserPermissionsAction } from "@/app/actions";
import { getHisAdapter } from "@/lib/his/hisAdapter";
import { encryptHisSecret, decryptHisSecret } from "@/lib/his/hisCrypto";
import { resolveConflict as resolveConflictService } from "@/lib/his/hisConflictService";
import { revalidatePath } from "next/cache";

export async function saveHisConfigAction(data: any) {
  const { permissions, userId } = await getUserPermissionsAction();
  if (!permissions.includes("his.manage")) {
    return { success: false, error: "Access Denied" };
  }

  try {
    // Find current config to copy masked values if needed
    const currentConfig = await prisma.hisConnectionConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    // Inactive all existing
    await prisma.hisConnectionConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new
    const configData: any = {
      name: data.name || "Default",
      mode: data.mode,
      baseUrl: data.baseUrl,
      authMode: data.authMode,
      timeoutMs: data.timeoutMs ? parseInt(data.timeoutMs) : 10000,
      retryMax: data.retryMax ? parseInt(data.retryMax) : 0,
      isActive: data.isActive !== false,
      createdByUserId: userId,
    };

    if (data.apiKey && data.apiKey !== "********") {
      configData.apiKeyEncrypted = encryptHisSecret(data.apiKey);
    } else if (data.apiKey === "********" && currentConfig) {
      configData.apiKeyEncrypted = currentConfig.apiKeyEncrypted;
    }

    if (data.bearerToken && data.bearerToken !== "********") {
      configData.bearerTokenEncrypted = encryptHisSecret(data.bearerToken);
    } else if (data.bearerToken === "********" && currentConfig) {
      configData.bearerTokenEncrypted = currentConfig.bearerTokenEncrypted;
    }

    if (data.basicUsername) configData.basicUsername = data.basicUsername;

    if (data.basicPassword && data.basicPassword !== "********") {
      configData.basicPasswordEncrypted = encryptHisSecret(data.basicPassword);
    } else if (data.basicPassword === "********" && currentConfig) {
      configData.basicPasswordEncrypted = currentConfig.basicPasswordEncrypted;
    }

    const config = await prisma.hisConnectionConfig.create({
      data: configData
    });

    revalidatePath("/admin/his");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testHisConnectionAction() {
  const { permissions } = await getUserPermissionsAction();
  if (!permissions.includes("his.manage")) {
    return { success: false, error: "Access Denied" };
  }

  const adapter = await getHisAdapter();
  if (!adapter) {
    return { success: false, error: "HIS Adapter is not configured or disabled" };
  }

  const result = await adapter.healthCheck();
  return { success: result.status === "OK", message: result.message };
}

export async function getHisLogsAction(filters: any) {
  const { permissions } = await getUserPermissionsAction();
  if (!permissions.includes("his.apiLogs")) {
    return { success: false, error: "Access Denied" };
  }

  const logs = await prisma.hisApiCallLog.findMany({
    where: {
      direction: filters.direction || undefined,
      success: filters.success !== undefined ? filters.success : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return { success: true, logs };
}

export async function saveFieldMappingAction(data: any) {
  const { permissions } = await getUserPermissionsAction();
  if (!permissions.includes("his.mapping")) {
    return { success: false, error: "Access Denied" };
  }

  try {
    const mapping = await prisma.hisFieldMapping.create({
      data: {
        name: data.name,
        direction: data.direction,
        sourceField: data.sourceField,
        targetField: data.targetField,
        transformRule: data.transformRule,
        isRequired: data.isRequired || false,
        isActive: data.isActive !== false,
      }
    });
    revalidatePath("/admin/his");
    return { success: true, mapping };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveConflictAction(conflictId: string, resolution: "ACCEPTED" | "IGNORED" | "MERGED", note?: string) {
  const { permissions, userId } = await getUserPermissionsAction();
  if (!permissions.includes("his.conflictReview")) {
    return { success: false, error: "Access Denied" };
  }

  try {
    await resolveConflictService(conflictId, resolution, userId, note);
    revalidatePath("/admin/his");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function tryApiRequestAction(method: string, path: string, payload: any) {
  const { permissions } = await getUserPermissionsAction();
  if (!permissions.includes("his.apiTest")) {
    return { success: false, error: "Access Denied" };
  }

  // To simulate an inbound request, we would normally use fetch to our own API
  // Or we can just call it locally if we want. Let's do a fetch to localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const config = await prisma.hisConnectionConfig.findFirst({ where: { isActive: true } });
    const headers: any = { "Content-Type": "application/json" };

    if (config?.authMode === "apiKey") headers["x-api-key"] = decryptHisSecret(config.apiKeyEncrypted);
    else if (config?.authMode === "bearer") headers["Authorization"] = `Bearer ${decryptHisSecret(config.bearerTokenEncrypted)}`;
    else if (config?.authMode === "basic") headers["Authorization"] = `Basic ${Buffer.from(`${config.basicUsername}:${decryptHisSecret(config.basicPasswordEncrypted)}`).toString("base64")}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: method !== "GET" ? JSON.stringify(payload) : undefined
    });

    const data = await res.json().catch(() => null);
    return { success: true, status: res.status, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
