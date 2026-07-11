"use server";

import { prisma } from "../db";
import { auth } from "@/auth";
import {
  WorkspacePreferences,
  WorkspacePreferencesSchema,
  WorkspacePreferencesUpdateSchema,
  WorkspacePreferencesUpdate,
  defaultWorkspacePreferences,
} from "../../lib/preferences/workspace-preferences";

/**
 * Lấy workspace preferences của user hiện tại
 */
export async function getWorkspacePreferencesAction(): Promise<WorkspacePreferences> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const pref = await prisma.workspaceUserPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!pref) {
    return defaultWorkspacePreferences;
  }

  try {
    const payload = JSON.parse(pref.preferencesJson);
    const parsed = WorkspacePreferencesSchema.safeParse(payload);
    if (parsed.success) {
      return parsed.data;
    }
    // Nếu schema parse fail (do data rác hoặc thay đổi format quá lớn), trả về default
    return defaultWorkspacePreferences;
  } catch (e) {
    return defaultWorkspacePreferences;
  }
}

/**
 * Cập nhật workspace preferences cho user hiện tại
 */
export async function updateWorkspacePreferencesAction(
  updates: WorkspacePreferencesUpdate
): Promise<WorkspacePreferences> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedUpdates = WorkspacePreferencesUpdateSchema.parse(updates);

  // A serializable transaction prevents two tabs from both reading the same
  // snapshot and silently overwriting each other's partial preference update.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async tx => {
        const stored = await tx.workspaceUserPreference.findUnique({
          where: { userId: session.user.id },
        });
        let parsed: ReturnType<typeof WorkspacePreferencesSchema.safeParse> | null = null;
        if (stored) {
          try {
            parsed = WorkspacePreferencesSchema.safeParse(JSON.parse(stored.preferencesJson));
          } catch {
            // Corrupt legacy JSON is treated as absent and repaired by this write.
          }
        }
        const current = parsed?.success ? parsed.data : defaultWorkspacePreferences;
        const nextValid = WorkspacePreferencesSchema.parse({
          ...current,
          ...validatedUpdates,
          columns: { ...current.columns, ...validatedUpdates.columns },
          layout: { ...current.layout, ...validatedUpdates.layout },
          version: 2,
        });

        await tx.workspaceUserPreference.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            schemaVersion: nextValid.version,
            preferencesJson: JSON.stringify(nextValid),
          },
          update: {
            schemaVersion: nextValid.version,
            preferencesJson: JSON.stringify(nextValid),
          },
        });
        return nextValid;
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (attempt === 2 || !(error instanceof Error && "code" in error && error.code === "P2034")) {
        throw error;
      }
    }
  }

  throw new Error("Unable to update workspace preferences");
}

export async function resetWorkspacePreferencesAction(): Promise<WorkspacePreferences> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.workspaceUserPreference.deleteMany({
    where: { userId: session.user.id },
  });
  return defaultWorkspacePreferences;
}
