import { z } from "zod";

export const priorityValues = ["ROUTINE", "URGENT", "STAT"] as const;

export const worklistSchema = z.object({
  patientName: z.string().min(1, "Vui lòng nhập tên bệnh nhân"),
  patientId: z.string().min(1, "Vui lòng nhập mã bệnh nhân"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  referringPhysician: z.string().optional(),
  referringDepartment: z.string().optional(),
  sourceFacility: z.string().optional(),
  modality: z.string().min(1, "Vui lòng chọn loại máy chụp"),
  bodyPart: z.string().optional(),
  procedureCode: z.string().optional(),
  procedureDescription: z.string().optional(),
  price: z.coerce.number().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  paymentStatus: z.string().optional(),
  priority: z.enum(priorityValues).default("ROUTINE"),
  scheduledDateTime: z.string().optional(),
  scheduledStationAeTitle: z.string().optional(),
  scheduledStationName: z.string().optional(),
  notes: z.string().optional(),
});

export type WorklistInput = z.infer<typeof worklistSchema>;
