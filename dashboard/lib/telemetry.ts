import { z } from "zod";
import { logger } from "./telemetry/logger";
import { metrics } from "./telemetry/metrics";

const ShadowRunTelemetrySchema = z.object({
  legacyLatencyMs: z.number().finite().nonnegative().max(3_600_000),
  scopedLatencyMs: z.number().finite().nonnegative().max(3_600_000),
  legacyRowsCount: z.number().int().nonnegative().max(1_000_000),
  scopedRowsCount: z.number().int().nonnegative().max(1_000_000),
  legacySucceeded: z.boolean(),
  scopedSucceeded: z.boolean(),
}).strict();

export type ShadowRunTelemetryData = z.infer<typeof ShadowRunTelemetrySchema>;

/**
 * Logs telemetry data for the shadow run, ensuring all sensitive data is scrubbed.
 */
export function logShadowRunTelemetry(data: ShadowRunTelemetryData): void {
  const validatedMetrics = ShadowRunTelemetrySchema.parse(data);
  const isCountParity =
    validatedMetrics.legacySucceeded &&
    validatedMetrics.scopedSucceeded &&
    validatedMetrics.legacyRowsCount === validatedMetrics.scopedRowsCount;

  logger.info("WORKLIST_SHADOW_RUN", {
    ...validatedMetrics,
    isCountParity,
  });

  metrics.recordLatency("worklist_legacy_latency", validatedMetrics.legacyLatencyMs);
  metrics.recordLatency("worklist_scoped_latency", validatedMetrics.scopedLatencyMs);
}
