import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dashboardDirectory = path.join(repositoryRoot, "dashboard");

console.log("=== Phase 2 authorization regression ===");
console.log("Running the checked-in authorization test suite in ENFORCE mode.");

const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", `npm test`]
  : ["test"];
const result = spawnSync(command, args, {
  cwd: dashboardDirectory,
  env: { ...process.env, AUTHORIZATION_MODE: "ENFORCE" },
  stdio: "inherit",
});

if (result.error) {
  console.error(`Unable to start regression suite: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`Authorization regression failed with exit code ${result.status ?? "unknown"}.`);
  process.exit(result.status ?? 1);
}

console.log("Authorization regression passed.");