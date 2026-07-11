export const WORKLIST_MODES = ["LEGACY", "SHADOW", "SCOPED"] as const;

export type WorklistMode = (typeof WORKLIST_MODES)[number];

/**
 * Resolves the cutover mode fail-safe. An absent or malformed flag must never
 * silently enable shadow traffic or switch the user-visible read path.
 */
export function resolveWorklistMode(
  configuredMode: string | undefined,
  legacyScopedFlag?: string,
): WorklistMode {
  const normalized = configuredMode?.trim().toUpperCase();
  if (WORKLIST_MODES.includes(normalized as WorklistMode)) {
    return normalized as WorklistMode;
  }

  if (legacyScopedFlag === "true") return "SCOPED";
  return "LEGACY";
}
