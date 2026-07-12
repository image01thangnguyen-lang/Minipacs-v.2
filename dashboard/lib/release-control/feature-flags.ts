import { createHash } from "crypto";
import {
  CAPABILITIES,
  FeatureFlagConfig,
  FeatureFlagConfigSchema,
  FlagDecision,
  ReleaseCapability,
} from "./contracts";

export type FlagSubject = Readonly<{ userId: string; facilityId: string }>;

export function stableBucket(capability: ReleaseCapability, subject: FlagSubject): number {
  const digest = createHash("sha256")
    .update(`${capability}:${subject.facilityId}:${subject.userId}`)
    .digest();
  return digest.readUInt32BE(0) % 100;
}

export function parseFlagConfigs(input: unknown): FeatureFlagConfig[] {
  const parsed = FeatureFlagConfigSchema.array().max(CAPABILITIES.length).parse(input);
  const names = new Set(parsed.map(flag => flag.capability));
  if (names.size !== parsed.length) throw new Error("DUPLICATE_CAPABILITY");
  for (const flag of parsed) {
    if (flag.dependencies.includes(flag.capability)) throw new Error("CYCLIC_DEPENDENCY");
    if (flag.dependencies.some(dependency => !names.has(dependency))) {
      throw new Error("MISSING_DEPENDENCY");
    }
  }
  const visiting = new Set<ReleaseCapability>();
  const visited = new Set<ReleaseCapability>();
  const byName = new Map(parsed.map(flag => [flag.capability, flag]));
  const visit = (name: ReleaseCapability): void => {
    if (visiting.has(name)) throw new Error("CYCLIC_DEPENDENCY");
    if (visited.has(name)) return;
    visiting.add(name);
    for (const dependency of byName.get(name)?.dependencies || []) visit(dependency);
    visiting.delete(name);
    visited.add(name);
  };
  names.forEach(name => visit(name));
  return parsed;
}

export function evaluateFlagDecisions(rawConfigs: unknown, subject: FlagSubject | null): Readonly<Record<ReleaseCapability, FlagDecision>> {
  const decisions = Object.fromEntries(CAPABILITIES.map(capability => [capability, {
    capability, enabled: false, reason: subject?.userId && subject.facilityId ? "CONFIG_MISSING" : "SUBJECT_MISSING", bucket: null,
  }])) as Record<ReleaseCapability, FlagDecision>;
  if (!subject?.userId || !subject.facilityId) return decisions;
  let configs: FeatureFlagConfig[];
  try { configs = parseFlagConfigs(rawConfigs); } catch { 
    for (const capability of CAPABILITIES) decisions[capability] = { capability, enabled: false, reason: "CONFIG_INVALID", bucket: null };
    return decisions;
  }
  const pending = new Map(configs.map(config => [config.capability, config]));
  for (let pass = 0; pass < CAPABILITIES.length; pass += 1) {
    for (const [name, config] of Array.from(pending.entries())) {
      if (config.dependencies.some(dependency => pending.has(dependency))) continue;
      const bucket = stableBucket(name, subject);
      let reason: FlagDecision["reason"] = "ENABLED";
      if (config.denyFacilityIds.includes(subject.facilityId)) reason = "FACILITY_DENIED";
      else if (!config.enabled) reason = "FLAG_DISABLED";
      else if (!config.dependencies.every(dependency => decisions[dependency].enabled)) reason = "DEPENDENCY_DISABLED";
      else if (!config.allowFacilityIds.includes(subject.facilityId) && bucket >= config.percentage) reason = "OUTSIDE_COHORT";
      decisions[name] = { capability: name, enabled: reason === "ENABLED", reason, bucket };
      pending.delete(name);
    }
  }
  return decisions;
}

export function evaluateFlags(
  rawConfigs: unknown,
  subject: FlagSubject | null,
): Readonly<Record<ReleaseCapability, boolean>> {
  const decisions = evaluateFlagDecisions(rawConfigs, subject);
  return Object.fromEntries(CAPABILITIES.map(name => [name, decisions[name].enabled])) as Record<ReleaseCapability, boolean>;
}