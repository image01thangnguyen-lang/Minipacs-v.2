import { logger } from "./logger";

// Keep cardinality low: only accept specific bounded values for tags
export type MetricTags = {
  action?: "load_worklist" | "search_worklist" | "save_draft" | "sign_report";
  status?: "success" | "failure" | "timeout";
  errorType?: "validation" | "authorization" | "dependency" | "internal";
};

export type LatencyMetricName = "worklist_legacy_latency" | "worklist_scoped_latency";
export type CountMetricName = "worklist_request_count" | "report_action_count";
export type ErrorMetricName = "worklist_error_count" | "report_action_error_count";

/**
 * Standardized metric recorder.
 * Outputs metric data formatted for ingestion by Datadog or Prometheus.
 */
export const metrics = {
  /**
   * Record a duration/latency metric in milliseconds.
   */
  recordLatency: (metricName: LatencyMetricName, latencyMs: number, tags?: MetricTags) => {
    if (!Number.isFinite(latencyMs) || latencyMs < 0) return;
    logger.info("METRIC_LATENCY", {
      metric: metricName,
      value: latencyMs,
      unit: "ms",
      tags: tags || {},
    });
  },

  /**
   * Increment a counter metric.
   */
  recordCount: (metricName: CountMetricName, count: number = 1, tags?: MetricTags) => {
    if (!Number.isInteger(count) || count < 0) return;
    logger.info("METRIC_COUNT", {
      metric: metricName,
      value: count,
      unit: "count",
      tags: tags || {},
    });
  },

  /**
   * Record an error occurrence.
   */
  recordError: (metricName: ErrorMetricName, tags?: MetricTags) => {
    logger.error("METRIC_ERROR", {
      metric: metricName,
      value: 1,
      unit: "error",
      tags: tags || {},
    });
  }
};
