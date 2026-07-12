import { createHash } from "crypto";
import { FeatureFlagConfig, RollbackAudit, RollbackRequestSchema, RolloutManifest, RolloutManifestSchema } from "./contracts";
import { assertRingTransition, decideRolloutGate } from "./gates";

export function checksumFlags(flags: FeatureFlagConfig[]): string {
  return createHash("sha256").update(JSON.stringify(flags)).digest("hex");
}

export function planPromotion(rawManifest: unknown, rawEvidence: unknown, now = new Date()): RolloutManifest {
  const manifest = RolloutManifestSchema.parse(rawManifest);
  assertRingTransition(manifest.currentRing, manifest.targetRing);
  const gate = decideRolloutGate(rawEvidence, manifest.targetRing);
  if (gate.decision !== "GO") throw new Error(`${gate.decision}:${gate.reasons.join(",")}`);
  if (new Set(manifest.approvedBy).size < 2) throw new Error("INDEPENDENT_APPROVALS_REQUIRED");
  return { ...manifest, previousRing: manifest.currentRing, currentRing: manifest.targetRing, updatedAt: now.toISOString() };
}

export function planRollback(rawManifest: unknown, now = new Date()): RolloutManifest {
  const manifest = RolloutManifestSchema.parse(rawManifest);
  return { ...manifest, previousRing: manifest.currentRing, currentRing: 0, targetRing: 0, updatedAt: now.toISOString() };
}

export function planCapabilityRollback(rawManifest: unknown, rawRequest: unknown, now = new Date()): { manifest: RolloutManifest; audit: RollbackAudit } {
  const manifest = RolloutManifestSchema.parse(rawManifest);
  const request = RollbackRequestSchema.parse(rawRequest);
  if (request.capability !== manifest.capability) throw new Error("CAPABILITY_MISMATCH");
  if (request.expectedUpdatedAt !== manifest.updatedAt || request.expectedConfigChecksum !== manifest.configChecksum) {
    throw new Error("STALE_ROLLBACK_REQUEST");
  }
  const occurredAt = now.toISOString();
  return {
    manifest: { ...manifest, previousRing: manifest.currentRing, currentRing: 0, targetRing: 0, updatedAt: occurredAt },
    audit: {
      requestId: request.requestId, capability: request.capability,
      actorHash: createHash("sha256").update(request.actorId).digest("hex").slice(0, 16),
      reasonCode: request.reasonCode, fromRing: manifest.currentRing, toRing: 0, occurredAt,
    },
  };
}