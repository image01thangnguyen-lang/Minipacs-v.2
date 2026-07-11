"use server";
import { z } from "zod";

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
export async function logShadowRunTelemetry(data: ShadowRunTelemetryData) {
  try {
    // This server boundary accepts only aggregate numeric/boolean metadata.
    // Query text, filters, IDs and raw payloads are deliberately not accepted.
    const metrics = ShadowRunTelemetrySchema.parse(data);
    const event = {
      event: "WORKLIST_SHADOW_RUN" as const,
      ...metrics,
      isCountParity:
        metrics.legacySucceeded &&
        metrics.scopedSucceeded &&
        metrics.legacyRowsCount === metrics.scopedRowsCount,
      timestamp: new Date().toISOString(),
    };
    // In production, this might be sent to DataDog, CloudWatch, or a telemetry endpoint.
    // For now, we log to console (stdout) which is typically collected by APM agents.
    console.log(JSON.stringify(event));
  } catch (error) {
    console.error("Failed to log shadow run telemetry", error);
  }
}
