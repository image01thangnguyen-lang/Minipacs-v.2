import { prisma } from "@/app/db";

export function scrubPayload(payload: any): string {
  if (!payload) return "";
  
  try {
    const copy = JSON.parse(JSON.stringify(payload));
    
    // Remove potential secrets/tokens if they exist
    if (copy.token) copy.token = "***SCRUBBED***";
    if (copy.password) copy.password = "***SCRUBBED***";
    if (copy.authorization) copy.authorization = "***SCRUBBED***";
    if (copy.apiKey) copy.apiKey = "***SCRUBBED***";
    
    // For large payloads like HTML or PDF in reports, truncate them to save space in logs
    if (copy.reportHtml && copy.reportHtml.length > 500) {
      copy.reportHtml = copy.reportHtml.substring(0, 500) + "... [TRUNCATED]";
    }
    if (copy.pdfUrl) {
      // PDF URL might contain SAS tokens
      copy.pdfUrl = "[PDF_URL_PROVIDED]";
    }

    return JSON.stringify(copy);
  } catch (err) {
    return "Error scrubbing payload";
  }
}

interface AuditLogOptions {
  direction: "INBOUND" | "OUTBOUND";
  action: string;
  status: "SUCCESS" | "FAILED" | "CONFLICT" | "SKIPPED";
  entityType: string;
  entityId?: string;
  studyInstanceUid?: string;
  accessionNumber?: string;
  hisOrderId?: string;
  hisMessageId?: string;
  requestSummary?: any;
  responseSummary?: any;
  errorCode?: string;
  errorMessage?: string;
  actorUserId?: string;
}

export async function logHisSync(options: AuditLogOptions) {
  try {
    await prisma.hisSyncLog.create({
      data: {
        direction: options.direction,
        action: options.action,
        status: options.status,
        entityType: options.entityType,
        entityId: options.entityId,
        studyInstanceUid: options.studyInstanceUid,
        accessionNumber: options.accessionNumber,
        hisOrderId: options.hisOrderId,
        hisMessageId: options.hisMessageId,
        requestSummaryJson: scrubPayload(options.requestSummary),
        responseSummaryJson: scrubPayload(options.responseSummary),
        errorCode: options.errorCode,
        errorMessage: options.errorMessage,
        actorUserId: options.actorUserId,
      }
    });
  } catch (error) {
    console.error("Failed to write HisSyncLog:", error);
  }
}
