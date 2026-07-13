import { z } from "zod";

const DurationSchema = z.string().regex(/^realtime$|^[1-9]\d*[smhd]$/);
const DimensionSchema = z.enum(["organizationId", "facilityId", "status", "priority", "modality", "slaStage", "severity", "reasonCode"]);

export const MetricDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/), version: z.number().int().positive(), owner: z.string().min(1),
  source: z.array(z.string().min(1)).min(1), type: z.enum(["GAUGE", "COUNTER", "HISTOGRAM", "RATIO"]),
  unit: z.enum(["studies", "events", "minutes", "percent", "messages"]), formula: z.string().min(1),
  dimensions: z.array(DimensionSchema), sourceTimestamp: z.string().min(1), exclusions: z.array(z.string()),
  timezone: z.literal("UTC"), freshness: DurationSchema, completeness: z.string().min(1),
  phiClass: z.enum(["NONE", "MINIMAL"]), compatibility: z.string().min(1), description: z.string().min(1),
}).strict();
export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;

export class MetricRegistry {
  private readonly metrics = new Map<string, MetricDefinition>();
  register(definition: MetricDefinition): void {
    const validated = MetricDefinitionSchema.parse(definition);
    const key = `${validated.id}@${validated.version}`;
    if (this.metrics.has(key)) throw new Error(`Metric ${key} is already registered.`);
    if (new Set(validated.dimensions).size !== validated.dimensions.length) throw new Error(`Metric ${key} has duplicate dimensions.`);
    this.metrics.set(key, validated);
  }
  get(id: string, version = 1): MetricDefinition | undefined { return this.metrics.get(`${id}@${version}`); }
  getAll(): readonly MetricDefinition[] { return Array.from(this.metrics.values()); }
}

const common = { version: 1, timezone: "UTC" as const, phiClass: "NONE" as const, compatibility: "Formula changes require a new version." };
const definitions: MetricDefinition[] = [
  { ...common, id: "queue_size", owner: "operations", source: ["ImagingStudy"], type: "GAUGE", unit: "studies", formula: "count(study_id) grouped by workflow state", dimensions: ["organizationId", "facilityId", "status", "priority", "modality"], sourceTimestamp: "ImagingStudy.updatedAt", exclusions: ["deleted records"], freshness: "5m", completeness: "Requires status and facility mapping", description: "Current scoped study queue size." },
  { ...common, id: "sla_breach_count", owner: "operations", source: ["ImagingStudy", "SlaPolicy"], type: "COUNTER", unit: "studies", formula: "count(stages exceeding resolved SLA target)", dimensions: ["organizationId", "facilityId", "slaStage", "priority", "modality"], sourceTimestamp: "stage end or evaluation time", exclusions: ["missing stage start", "cancelled studies"], freshness: "5m", completeness: "Missing stage timestamps are counted separately", description: "Scoped SLA breach count." },
  { ...common, id: "tat_percentile", owner: "analytics", source: ["ImagingStudy"], type: "HISTOGRAM", unit: "minutes", formula: "nearest-rank p50/p90/p95 of stage_end - stage_start", dimensions: ["organizationId", "facilityId", "slaStage", "priority", "modality"], sourceTimestamp: "stage end timestamp", exclusions: ["missing boundary", "negative duration"], freshness: "15m", completeness: "Valid pairs included; missing count retained", description: "Turnaround-time distribution." },
  { ...common, id: "study_throughput", owner: "operations", source: ["ImagingStudy"], type: "COUNTER", unit: "studies", formula: "count(studies finalized in source window)", dimensions: ["organizationId", "facilityId", "modality"], sourceTimestamp: "ImagingStudy.finalizedAt", exclusions: ["not finalized"], freshness: "15m", completeness: "Requires finalizedAt", description: "Completed-study throughput." },
  { ...common, id: "radiologist_workload", owner: "operations", source: ["Report"], type: "COUNTER", unit: "studies", formula: "count(distinct finalized report study_id)", dimensions: ["organizationId", "facilityId", "modality"], sourceTimestamp: "Report.finalizedAt", exclusions: ["draft", "superseded revision"], freshness: "15m", completeness: "Requires final report and scoped study", description: "Final reporting workload." },
  { ...common, id: "modality_utilization", owner: "operations", source: ["ImagingStudy"], type: "RATIO", unit: "percent", formula: "100 * observed scan minutes / configured available minutes", dimensions: ["organizationId", "facilityId", "modality"], sourceTimestamp: "ImagingStudy.scanEndedAt", exclusions: ["missing scan boundary", "unconfigured capacity"], freshness: "15m", completeness: "Estimated until capacity calendar is configured", description: "Modality utilization estimate." },
  { ...common, id: "critical_result_ack_time", owner: "clinical_safety", source: ["CriticalResult"], type: "HISTOGRAM", unit: "minutes", formula: "acknowledgedAt - createdAt", dimensions: ["organizationId", "facilityId", "severity"], sourceTimestamp: "CriticalResult.acknowledgedAt", exclusions: ["not acknowledged", "negative duration"], freshness: "5m", completeness: "Requires acknowledgedAt", description: "Critical-result acknowledgement latency." },
  { ...common, id: "qc_reject_rate", owner: "clinical_quality", source: ["QcIssue", "ImagingStudy"], type: "RATIO", unit: "percent", formula: "100 * rejected studies / eligible completed studies", dimensions: ["organizationId", "facilityId", "modality", "reasonCode"], sourceTimestamp: "QcIssue.createdAt", exclusions: ["cancelled QC issues"], freshness: "1h", completeness: "Requires denominator and facility mapping", description: "QC rejection rate." },
  { ...common, id: "data_quality_issue_count", owner: "data_owner", source: ["DataQualityIssue"], type: "GAUGE", unit: "events", formula: "count(open data-quality issues)", dimensions: ["organizationId", "facilityId", "severity"], sourceTimestamp: "DataQualityIssue.detectedAt", exclusions: ["resolved", "suppressed"], freshness: "5m", completeness: "Persisted issues only", description: "Open data-quality issues." },
  { ...common, id: "open_alert_count", owner: "operations", source: ["AlertEvent"], type: "GAUGE", unit: "events", formula: "count(open alert events)", dimensions: ["organizationId", "facilityId", "severity"], sourceTimestamp: "AlertEvent.triggeredAt", exclusions: ["resolved", "suppressed"], freshness: "5m", completeness: "Persisted alerts only", description: "Open alerts." },
  { ...common, id: "integration_failure_count", owner: "integration", source: ["IntegrationMessage"], type: "COUNTER", unit: "messages", formula: "count(messages in terminal failure state)", dimensions: ["organizationId", "facilityId"], sourceTimestamp: "IntegrationMessage.updatedAt", exclusions: ["pending retries"], freshness: "5m", completeness: "Persisted messages only", description: "Terminal integration failures." },
];
export const metricRegistry = new MetricRegistry();
definitions.forEach(definition => metricRegistry.register(definition));