import { z } from "zod";

export const WORKSPACE_COLUMN_IDS = [
  "patient",
  "description",
  "modality",
  "status",
  "assigned",
  "date",
  "images",
] as const;

export const WorkspaceColumnIdSchema = z.enum(WORKSPACE_COLUMN_IDS);
const DEFAULT_COLUMNS = [...WORKSPACE_COLUMN_IDS];

const WorkspaceColumnsSchema = z.object({
  visible: z.array(WorkspaceColumnIdSchema).max(WORKSPACE_COLUMN_IDS.length)
    .refine(values => new Set(values).size === values.length, "Duplicate visible column")
    .default(DEFAULT_COLUMNS),
  order: z.array(WorkspaceColumnIdSchema).length(WORKSPACE_COLUMN_IDS.length)
    .refine(values => new Set(values).size === WORKSPACE_COLUMN_IDS.length, "Column order must be a permutation")
    .default(DEFAULT_COLUMNS),
  widths: z.record(WorkspaceColumnIdSchema, z.number().int().min(64).max(640)).default({}),
}).strict();

export const WorkspaceLayoutSchema = z.object({
  leftCollapsed: z.boolean().default(false),
  leftWidth: z.number().int().min(260).max(480).default(320),
  rightWidth: z.number().int().min(300).max(600).default(450),
  relatedHeight: z.number().int().min(150).max(600).default(250),
}).strict();

export const WorkspacePreferencesSchema = z.object({
  // Version 1 did not contain layout preferences. Normalize it to the current
  // version while parsing so callers never have to branch on legacy data.
  version: z.preprocess(value => value === 1 ? 2 : value, z.literal(2).default(2)),
  density: z.enum(["compact", "comfortable"]).default("comfortable"),
  columns: WorkspaceColumnsSchema.default({}),
  layout: WorkspaceLayoutSchema.default({}),
}).strict();

export const WorkspacePreferencesUpdateSchema = WorkspacePreferencesSchema.partial()
  .extend({ 
    columns: WorkspaceColumnsSchema.partial().optional(),
    layout: WorkspaceLayoutSchema.partial().optional(),
  })
  .strict();

export type WorkspacePreferences = z.infer<typeof WorkspacePreferencesSchema>;
export type WorkspacePreferencesUpdate = z.input<typeof WorkspacePreferencesUpdateSchema>;

export const defaultWorkspacePreferences: WorkspacePreferences = WorkspacePreferencesSchema.parse({});
