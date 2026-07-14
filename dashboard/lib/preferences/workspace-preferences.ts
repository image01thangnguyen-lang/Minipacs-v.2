import { z } from "zod";

export const WORKSPACE_COLUMN_IDS = [
  "patient",
  "patientBirthDate",
  "patientSex",
  "ageAtStudy",
  "description",
  "procedureDescription",
  "modality",
  "bodyPart",
  "status",
  "assigned",
  "referringPhysician",
  "referringDepartment",
  "technologist",
  "date",
  "machine",
  "images",
] as const;

export const WorkspaceColumnIdSchema = z.enum(WORKSPACE_COLUMN_IDS);

// Default columns priority: trạng thái nhanh, thời gian, máy, PID/visit, họ tên, tuổi, giới tính, bộ phận, chỉ định, trạng thái, BS đọc.
const DEFAULT_COLUMNS: Array<typeof WorkspaceColumnIdSchema._type> = [
  "status",
  "date",
  "machine",
  "patient",
  "ageAtStudy",
  "patientSex",
  "modality",
  "bodyPart",
  "procedureDescription",
  "assigned"
];

const WorkspaceColumnsSchema = z.object({
  visible: z.array(WorkspaceColumnIdSchema).max(WORKSPACE_COLUMN_IDS.length)
    .refine(values => new Set(values).size === values.length, "Duplicate visible column")
    .default(DEFAULT_COLUMNS),
  order: z.array(WorkspaceColumnIdSchema).length(WORKSPACE_COLUMN_IDS.length)
    .refine(values => new Set(values).size === WORKSPACE_COLUMN_IDS.length, "Column order must be a permutation")
    .default([...WORKSPACE_COLUMN_IDS]),
  widths: z.record(WorkspaceColumnIdSchema, z.number().int().min(64).max(640)).default({}),
}).strict();

export const WorkspaceLayoutSchema = z.object({
  leftCollapsed: z.boolean().default(false),
  leftWidth: z.number().int().min(260).max(480).default(320),
  rightWidth: z.number().int().min(300).max(600).default(450),
  relatedHeight: z.number().int().min(150).max(600).default(250),
}).strict();

export const WorkspacePreferencesSchema = z.object({
  // Migrate legacy versions up to version 3
  version: z.preprocess(value => (value === 1 || value === 2) ? 3 : value, z.literal(3).default(3)),
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
