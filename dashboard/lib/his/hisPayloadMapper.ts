import { HisOrderPayload } from "./types";

export function mapHisOrderToPrismaData(hisData: HisOrderPayload) {
  const data: any = {};

  if (hisData.hisOrderId) data.hisOrderId = hisData.hisOrderId;
  if (hisData.patientId) data.patientId = hisData.patientId;
  if (hisData.patientName) data.patientName = hisData.patientName;
  if (hisData.dob) {
    const d = new Date(hisData.dob);
    if (!isNaN(d.getTime())) data.dob = d;
  }
  
  if (hisData.gender) {
    const g = hisData.gender.toUpperCase();
    if (["M", "F", "O"].includes(g)) data.gender = g;
  }
  
  if (hisData.phone) data.phone = hisData.phone;
  if (hisData.procedureCode) data.procedureCode = hisData.procedureCode;
  if (hisData.procedureDescription) data.procedureDescription = hisData.procedureDescription;
  
  // Notice we might NOT blindly overwrite modality if we already have DICOM images
  // The caller will decide if they want to apply this
  if (hisData.modality) data.modality = hisData.modality;
  
  if (hisData.bodyPart) data.bodyPart = hisData.bodyPart;
  if (hisData.referringPhysician) data.referringPhysician = hisData.referringPhysician;
  if (hisData.referringDepartment) data.referringDepartment = hisData.referringDepartment;
  if (hisData.paymentStatus) data.paymentStatus = hisData.paymentStatus;
  
  if (hisData.priority) {
    const p = hisData.priority.toUpperCase();
    if (["ROUTINE", "URGENT", "STAT"].includes(p)) data.priority = p;
  }

  return data;
}
