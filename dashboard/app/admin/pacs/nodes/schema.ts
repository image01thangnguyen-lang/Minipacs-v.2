import { z } from "zod";

export const dicomNodeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Vui lòng nhập tên thiết bị"),
  aeTitle: z.string().optional(),
  ipAddress: z.string().optional(),
  port: z.number().int().optional(),
  modality: z.string().min(1, "Vui lòng chọn Modality"),
  room: z.string().optional(),
  isActive: z.boolean().default(true),
  orthancAlias: z.string().min(1, "Vui lòng nhập Alias cho Orthanc"),

  // Phase 3 extensions
  isNonDicom: z.boolean().default(false).optional(),
  facilityId: z.string().optional(),
  defaultFolderId: z.string().optional(),
  defaultShareFolderId: z.string().optional(),
  defaultUploadFolderId: z.string().optional(),
  defaultProcedureCatalogId: z.string().optional(),
  defaultPrintTemplateId: z.string().optional(),
  defaultReportTemplateTextId: z.string().optional(),
  serviceTypeId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.isNonDicom) {
    if (!data.aeTitle) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng nhập AE Title", path: ["aeTitle"] });
    if (!data.ipAddress) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng nhập IP", path: ["ipAddress"] });
    if (!data.port) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng nhập Port", path: ["port"] });
  }
});

export type DicomNodeInput = z.infer<typeof dicomNodeSchema>;
