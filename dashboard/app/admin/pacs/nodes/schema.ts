import { z } from "zod";

export const dicomNodeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Vui lòng nhập tên thiết bị"),
  aeTitle: z.string().min(1, "Vui lòng nhập AE Title").max(16, "AE Title tối đa 16 ký tự"),
  ipAddress: z.string().min(1, "Vui lòng nhập địa chỉ IP"),
  port: z.number().int().min(1).max(65535),
  modality: z.string().min(1, "Vui lòng chọn Modality"),
  room: z.string().optional(),
  isActive: z.boolean().default(true),
  orthancAlias: z.string().min(1, "Vui lòng nhập Alias cho Orthanc"),
});

export type DicomNodeInput = z.infer<typeof dicomNodeSchema>;
