"use server";

import { prisma } from "@/dashboard/app/db"; // Assuming this exports Prisma client
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

export const worklistSchema = z.object({
  patientName: z.string().min(1, "Vui lòng nhập tên bệnh nhân"),
  patientId: z.string().min(1, "Vui lòng nhập mã bệnh nhân"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  referringPhysician: z.string().optional(),
  modality: z.string().min(1, "Vui lòng chọn loại máy chụp"),
});

export async function createWorklistAction(data: z.infer<typeof worklistSchema>) {
  try {
    const validatedData = worklistSchema.parse(data);
    
    // Generate unique Accession Number
    const timestamp = new Date().getTime().toString().slice(-6);
    const accessionNumber = `ACC${timestamp}${Math.floor(Math.random() * 1000)}`;
    
    // Convert DOB if necessary
    const dobDate = validatedData.dob ? new Date(validatedData.dob) : new Date("1900-01-01");
    // Format DOB for DICOM (YYYYMMDD)
    const dicomDob = validatedData.dob ? validatedData.dob.replace(/-/g, "") : "";

    const order = await prisma.worklistOrder.create({
      data: {
        patientName: validatedData.patientName,
        patientId: validatedData.patientId,
        dob: dobDate,
        gender: validatedData.gender,
        referringPhysician: validatedData.referringPhysician,
        modality: validatedData.modality,
        accessionNumber,
      }
    });

    // Generate JSON for Orthanc
    // Orthanc Worklist Plugin uses specific tags
    const dicomJson = {
        "0010,0010": validatedData.patientName,   // PatientName
        "0010,0020": validatedData.patientId,     // PatientID
        "0010,0030": dicomDob,                   // PatientBirthDate
        "0010,0040": validatedData.gender || "O", // PatientSex
        "0008,0050": accessionNumber,            // AccessionNumber
        "0008,0090": validatedData.referringPhysician || "", // ReferringPhysicianName
        "0040,0100": [{                          // ScheduledProcedureStepSequence
          "0008,0060": validatedData.modality,   // Modality
          "0040,0001": "AETITLE",                // ScheduledStationAETitle
          "0040,0002": new Date().toISOString().slice(0,10).replace(/-/g, ""), // ScheduledProcedureStepStartDate
          "0040,0003": "000000.000",             // ScheduledProcedureStepStartTime
          "0040,0006": "Dr. " + (validatedData.referringPhysician || ""), // ScheduledPerformingPhysicianName
          "0040,0007": "Study_" + accessionNumber, // ScheduledProcedureStepDescription
          "0040,0009": "STEP_" + accessionNumber // ScheduledProcedureStepID
        }],
        "0020,000D": "1.2.840.113619.2." + timestamp + "." + accessionNumber, // StudyInstanceUID
        "0040,1001": accessionNumber,            // RequestedProcedureID
        "0032,1060": "Routine procedure"         // RequestedProcedureDescription
    };

    // Save to pacs_data/worklists inside docker (or locally!)
    // Assuming workspace root is mapped to ./pacs_data/worklists in compose,
    // the container mounts it to /app/pacs_data/worklists.
    // In dev mode (Next.js run), it's inside root folder.
    const rootPath = process.cwd();
    const worklistsDir = path.join(rootPath, "pacs_data", "worklists");

    // Ensure dir exists
    await fs.mkdir(worklistsDir, { recursive: true });

    // Save JSON file
    const filePath = path.join(worklistsDir, `${accessionNumber}.wl.json`);
    await fs.writeFile(filePath, JSON.stringify(dicomJson, null, 2), "utf8");

    return { success: true, accessionNumber };
  } catch (err: any) {
    console.error("Error creating worklist:", err);
    return { success: false, error: err.message };
  }
}
