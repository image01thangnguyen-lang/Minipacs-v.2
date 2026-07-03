export interface HisAdapterHealth {
  status: "OK" | "ERROR";
  message?: string;
}

export interface HisOrderQuery {
  accessionNumber?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface HisOrderPayload {
  hisOrderId?: string;
  patientId?: string;
  patientName?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  accessionNumber?: string;
  procedureCode?: string;
  procedureDescription?: string;
  modality?: string;
  bodyPart?: string;
  referringPhysician?: string;
  referringDepartment?: string;
  paymentStatus?: string;
  priority?: string;
}

export interface HisReportPayload {
  hisOrderId?: string;
  accessionNumber?: string;
  studyInstanceUid?: string;
  patientId?: string;
  patientName?: string;
  modality?: string;
  procedureCode?: string;
  procedureDescription?: string;
  findings?: string;
  conclusion?: string;
  recommendation?: string;
  doctorName?: string;
  doctorLicenseNumber?: string;
  finalizedAt?: Date;
  reportHtml?: string;
  pdfUrl?: string;
}

export interface HisSendResultResponse {
  hisMessageId?: string;
  status: "SUCCESS" | "FAILED";
  error?: string;
}

export interface HisSyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  rawRequest?: any;
  rawResponse?: any;
}

export interface HisAdapter {
  id: string;
  label: string;
  isEnabled(): boolean;
  healthCheck(): Promise<HisAdapterHealth>;
  fetchOrder(query: HisOrderQuery): Promise<HisSyncResult<HisOrderPayload>>;
  sendResult(payload: HisReportPayload): Promise<HisSyncResult<HisSendResultResponse>>;
  cancelResult?(payload: HisReportPayload): Promise<HisSyncResult<HisSendResultResponse>>;
}
