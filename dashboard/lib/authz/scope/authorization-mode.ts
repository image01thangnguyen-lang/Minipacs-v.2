import * as fs from "fs";
import * as path from "path";

export type AuthorizationMode = "OFF" | "SHADOW" | "ENFORCE";

let cachedMode: AuthorizationMode | null = null;
let lastCheck = 0;

/**
 * Get current global authorization mode.
 * Reads from environment variable or rollout config file.
 */
export function getAuthorizationMode(): AuthorizationMode {
  // Respect ENV var first if set explicitly
  const envMode = process.env.AUTHORIZATION_MODE;
  if (envMode === "ENFORCE") return "ENFORCE";
  if (envMode === "SHADOW") return "SHADOW";
  if (envMode === "OFF") return "OFF";

  // Cache config for 60 seconds to avoid disk IO on every request
  const now = Date.now();
  if (cachedMode && now - lastCheck < 60000) {
    return cachedMode;
  }

  try {
    const configPath = path.join(process.cwd(), "config", "authorization-rollout.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(raw);
      if (config.mode === "ENFORCE" || config.mode === "SHADOW") {
        cachedMode = config.mode;
      } else {
        cachedMode = "OFF";
      }
    } else {
      cachedMode = "OFF";
    }
  } catch (e) {
    cachedMode = "OFF"; // Preserve legacy baseline when rollout configuration is unavailable.
  }

  lastCheck = now;
  return cachedMode || "OFF";
}
