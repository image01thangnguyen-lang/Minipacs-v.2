import { ScopeDecisionReasonCode } from "./scope-decision";
import { AuthorizationMode } from "./authorization-mode";

export type TelemetryEvent = {
  eventName: "AUTHORIZATION_DECISION" | "DUAL_WRITE_DRIFT" | "UNCLASSIFIED_RESOURCE" | "DENIED_MUTATION" | "SHADOW_MISMATCH";
  mode: AuthorizationMode;
  capability?: string;
  reasonCode?: ScopeDecisionReasonCode;
  latencyMs?: number;
  userId?: never;
  resourceId?: never;
  isMutation?: boolean;
  baselineAllowed?: boolean;
  proposedAllowed?: boolean;
};

/**
 * Emits a PHI-scrubbed telemetry event for authorization observability.
 * Does NOT log patient name, DOB, accession, report text, HIS payload, or raw Prisma arguments.
 */
export function emitScopeTelemetry(event: TelemetryEvent) {
  // In a real production system, this would push to an OpenTelemetry collector,
  // Datadog, or ELK stack. For now, we output structured JSON to stdout.
  const payload = {
    timestamp: new Date().toISOString(),
    ...event
  };

  // Log as JSON to ensure it can be parsed by logging agents without sampling loss.
  console.log(JSON.stringify(payload));
}
