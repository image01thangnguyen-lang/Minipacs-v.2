export type AuthorizationMode = "OFF" | "SHADOW" | "ENFORCE";

/**
 * Get current global authorization mode.
 * Defaults to OFF for safety. In production, this can be controlled via env var.
 */
export function getAuthorizationMode(): AuthorizationMode {
  const mode = process.env.AUTHORIZATION_MODE;
  if (mode === "ENFORCE") return "ENFORCE";
  if (mode === "SHADOW") return "SHADOW";
  return "OFF";
}
