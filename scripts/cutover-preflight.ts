import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

type RolloutMode = "OFF" | "SHADOW" | "ENFORCE";
type RolloutConfig = { mode: RolloutMode; approvedBy: string | null; ring: string };

function runPreflight() {
  console.log("=== Phase 2 Enforcement Cutover Preflight ===");

  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const configPath = path.join(repositoryRoot, "dashboard", "config", "authorization-rollout.json");
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Missing configuration file: ${configPath}`);
    process.exit(1);
  }

  const configRaw = fs.readFileSync(configPath, "utf-8");
  let config: RolloutConfig;
  try {
    config = JSON.parse(configRaw) as RolloutConfig;
  } catch (e) {
    console.error("❌ Invalid JSON in rollout config.");
    process.exit(1);
  }

  if (!["OFF", "SHADOW", "ENFORCE"].includes(config.mode)) {
    console.error(`❌ Invalid rollout mode: ${String(config.mode)}`);
    process.exit(1);
  }
  if (typeof config.ring !== "string" || !config.ring.trim()) {
    console.error("❌ Rollout blocked: ring must be a non-empty string.");
    process.exit(1);
  }
  if (config.mode === "ENFORCE" || config.mode === "SHADOW") {
    if (typeof config.approvedBy !== "string" || !config.approvedBy.trim()) {
      console.error(`❌ Rollout blocked! mode is ${config.mode} but approvedBy is empty.`);
      process.exit(1);
    }
  }

  console.log(`Current Config Mode: ${config.mode}`);
  console.log(`Approved By: ${config.approvedBy}`);
  console.log(`Ring: ${config.ring}`);

  console.log(config.mode === "OFF"
    ? "✅ CONFIG VALID (OFF). This does not approve SHADOW or ENFORCE cutover."
    : "✅ CONFIG VALID. Data readiness, soak evidence, and human sign-off remain mandatory.");
}

runPreflight();