import { z } from "zod";

// --- Validations & Enums ---

export const WORKLIST_CONTRACT_VERSION = 1 as const;

const IsoDateTimeSchema = z.string().datetime({ offset: true });
const IanaTimezoneSchema = z.string().min(1).max(100).refine((timezone) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid IANA timezone" });

const FilterValueSchema = z.string().trim().min(1).max(128);

export const SortDirectionSchema = z.enum(["asc", "desc"]);

export const WorklistSortKeySchema = z.enum([
  "createdAt",
  "scheduledAt",
  "patientName",
  "priority",
  "status"
]);

export type WorklistSortKey = z.infer<typeof WorklistSortKeySchema>;

// Array fields are bounded and de-duplicated to prevent massive/redundant IN clauses.
const LimitedStringArraySchema = z.array(FilterValueSchema)
  .max(50)
  .refine((values) => new Set(values).size === values.length, {
    message: "Filter values must be unique",
  })
  .optional();

export const WorklistQueryRequestSchema = z.object({
  version: z.literal(WORKLIST_CONTRACT_VERSION).default(WORKLIST_CONTRACT_VERSION),
  q: z.string().trim().min(1).max(200).optional(),
  
  // Date boundaries
  from: IsoDateTimeSchema,
  to: IsoDateTimeSchema,
  timezone: IanaTimezoneSchema,
  
  // Facets
  statuses: LimitedStringArraySchema,
  facilityUnitIds: LimitedStringArraySchema,
  dicomNodeIds: LimitedStringArraySchema,
  consultationStatuses: LimitedStringArraySchema,
  priorities: LimitedStringArraySchema,
  modality: LimitedStringArraySchema,
  assignedDoctorIds: LimitedStringArraySchema,
  hisStatuses: LimitedStringArraySchema,
  
  // Pagination & Sorting
  sort: z.object({
    key: WorklistSortKeySchema,
    direction: SortDirectionSchema
  }).default({ key: "createdAt", direction: "desc" }),
  
  // Opaque, signed/versioned cursor contents are implemented by the PR2 boundary.
  cursor: z.string().min(1).max(2048).optional(),
  limit: z.number().int().min(1).max(100).default(50)
}).strict().superRefine((query, ctx) => {
  const from = Date.parse(query.from);
  const to = Date.parse(query.to);
  if (from >= to) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "to must be after from" });
    return;
  }

  const maximumRangeMs = 366 * 24 * 60 * 60 * 1000;
  if (to - from > maximumRangeMs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "Date range must not exceed 366 days",
    });
  }
});

export type WorklistQueryRequest = z.infer<typeof WorklistQueryRequestSchema>;

// --- Output Contract ---

export interface WorklistRow {
  // Technical IDs
  id: string;
  studyInstanceUid: string;
  orderId?: string;
  
  // Display fields
  patientName: string;
  patientId: string;
  accessionNumber: string;
  modality: string;
  bodyPart?: string;
  priority: string;
  status: string;
  
  // Time fields
  createdAt: string;
  scheduledAt?: string;
  receivedAt?: string;
  finalizedAt?: string;
  
  // Facility / Equipment
  performingUnitId?: string;
  facilityName?: string;
  machineName?: string;
  stationAeTitle?: string;
  
  // People
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  
  // Integration
  hisSyncStatus?: string;
  
  // Authorization
  allowedActions: string[];

  // Compatibility fields consumed by the current dashboard adapter
  isNonDicom?: boolean;
  nonDicomExamId?: string;
  slaStatus?: string;
}

export interface WorklistQueryResponse {
  version: typeof WORKLIST_CONTRACT_VERSION;
  rows: WorklistRow[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string;
  };
  appliedQuery: WorklistQueryRequest;
  dataFreshness: "FRESH" | "STALE" | "UNKNOWN";
  error?: {
    code: "INVALID_QUERY" | "UNAUTHORIZED" | "FORBIDDEN" | "UNAVAILABLE" | "INTERNAL";
    message: string;
    retryable: boolean;
  };
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface WorklistFacetResponse {
  version: typeof WORKLIST_CONTRACT_VERSION;
  statuses: FacetCount[];
  facilityUnitIds: FacetCount[];
  // Extensible for future facets like consultationStatuses, priorities, modality
  appliedQuery: WorklistQueryRequest;
  dataFreshness: "FRESH" | "STALE" | "UNKNOWN";
}
