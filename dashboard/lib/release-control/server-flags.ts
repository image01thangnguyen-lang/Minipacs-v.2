import fs from "fs";
import path from "path";
import { FlagEvaluationRequestSchema, FlagDecision } from "./contracts";
import { evaluateFlagDecisions } from "./feature-flags";

export type ServerFlagActor = Readonly<{ userId: string }>;
export type ServerFlagResource = Readonly<{ facilityId: string }>;
export type ServerFlagDependencies = Readonly<{
  authenticate(): Promise<ServerFlagActor | null>;
  // Must load and authorize the resource server-side; never use client facility/role/scope.
  reauthorizeResource(actor: ServerFlagActor, resourceId: string): Promise<ServerFlagResource | null>;
  loadConfig(): Promise<unknown>;
  audit(decision: Pick<FlagDecision, "capability" | "enabled" | "reason">): void;
}>;

export async function evaluateScopedCapability(rawRequest: unknown, deps: ServerFlagDependencies): Promise<FlagDecision> {
  const request = FlagEvaluationRequestSchema.parse(rawRequest);
  const actor = await deps.authenticate();
  if (!actor) {
    const decision: FlagDecision = { capability: request.capability, enabled: false, reason: "SUBJECT_MISSING", bucket: null };
    deps.audit(decision);
    return decision;
  }
  const resource = await deps.reauthorizeResource(actor, request.resourceId);
  if (!resource?.facilityId) {
    const decision: FlagDecision = { capability: request.capability, enabled: false, reason: "SUBJECT_MISSING", bucket: null };
    deps.audit(decision);
    return decision;
  }
  const decisions = evaluateFlagDecisions(await deps.loadConfig(), { userId: actor.userId, facilityId: resource.facilityId });
  const decision = decisions[request.capability];
  // Deliberately omit user/resource/facility/bucket from audit to prevent PHI/scope metadata leakage.
  deps.audit({ capability: decision.capability, enabled: decision.enabled, reason: decision.reason });
  return decision;
}

export async function loadPhase7FlagConfig(): Promise<unknown> {
  const file = path.resolve(process.cwd(), "../config/release/phase7-flags.json");
  return JSON.parse(await fs.promises.readFile(file, "utf8"));
}