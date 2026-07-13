import { z } from "zod";

export const EventTypeSchema = z.enum([
  "STUDY_CREATED", "STUDY_STATUS_CHANGED", "REPORT_FINALIZED",
  "REPORT_ADDENDUM_CREATED", "CRITICAL_RESULT_ACKNOWLEDGED",
  "ALERT_TRIGGERED", "QC_ISSUE_RAISED", "SLA_BREACHED",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

const IdentifierSchema = z.string().trim().min(1).max(128);
const JsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type JsonValue = z.infer<typeof JsonPrimitiveSchema> | JsonValue[] | { [key: string]: JsonValue };
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([JsonPrimitiveSchema, z.array(JsonValueSchema), z.record(JsonValueSchema)]),
);

/** Canonical wire contract. Dates are ISO strings so JSON round-trips are deterministic. */
export const CanonicalEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventType: EventTypeSchema,
  eventVersion: z.literal(1),
  occurredAt: z.string().datetime({ offset: true }),
  recordedAt: z.string().datetime({ offset: true }),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
  idempotencyKey: IdentifierSchema,
  actor: z.object({ type: z.enum(["USER", "SERVICE"]), id: IdentifierSchema }).strict().optional(),
  organizationId: IdentifierSchema.optional(),
  facilityId: IdentifierSchema.optional(),
  entityType: IdentifierSchema,
  entityId: IdentifierSchema,
  reportRevision: z.number().int().nonnegative().optional(),
  // Generic events may carry only minimized data, never HIGH/raw clinical data.
  phiClass: z.enum(["NONE", "MINIMAL"]),
  payload: z.record(JsonValueSchema).default({}),
}).strict().superRefine((event, ctx) => {
  if (Date.parse(event.recordedAt) < Date.parse(event.occurredAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recordedAt"], message: "recordedAt must not precede occurredAt" });
  }
  const forbidden = Object.keys(event.payload).find(key => /patient|accession|report(body|text)|patientname/i.test(key));
  if (forbidden) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["payload", forbidden], message: "PHI-heavy payload keys are not allowed; use a protected entity reference" });
  }
});

export type CanonicalEventEnvelope = z.infer<typeof CanonicalEventEnvelopeSchema>;
export function validateEventEnvelope(event: unknown): CanonicalEventEnvelope {
  return CanonicalEventEnvelopeSchema.parse(event);
}