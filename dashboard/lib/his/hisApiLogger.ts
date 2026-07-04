import { prisma } from "@/app/db";

interface HisLogPayload {
  direction: "INBOUND" | "OUTBOUND";
  method: string;
  path: string;
  endpointKey?: string;
  statusCode?: number;
  success: boolean;
  durationMs?: number;
  requestId?: string;
  correlationId?: string;
  remoteIp?: string;
  actorType?: string;
  actorUserId?: string;
  accessionNumber?: string;
  studyInstanceUid?: string;
  reportId?: string;
  hisOrderId?: string;
  hisMessageId?: string;
  requestSummary?: any;
  responseSummary?: any;
  errorCode?: string;
  errorMessage?: string;
}

export function scrubHisPayload(payload: any) {
  if (!payload) return null;
  const scrubbed = JSON.parse(JSON.stringify(payload));
  
  // Mask sensitive fields
  const sensitiveKeys = ["password", "token", "secret", "authorization", "apiKey", "x-api-key"];
  
  function recurse(obj: any) {
    if (typeof obj !== "object" || obj === null) return;
    for (const key in obj) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        obj[key] = "***MASKED***";
      } else if (typeof obj[key] === "object") {
        recurse(obj[key]);
      }
    }
  }
  
  recurse(scrubbed);
  return scrubbed;
}

export async function logHisApiCall(payload: HisLogPayload) {
  try {
    const requestJson = payload.requestSummary ? JSON.stringify(scrubHisPayload(payload.requestSummary)) : null;
    const responseJson = payload.responseSummary ? JSON.stringify(scrubHisPayload(payload.responseSummary)) : null;

    const log = await prisma.hisApiCallLog.create({
      data: {
        direction: payload.direction,
        method: payload.method,
        path: payload.path,
        endpointKey: payload.endpointKey,
        statusCode: payload.statusCode,
        success: payload.success,
        durationMs: payload.durationMs,
        requestId: payload.requestId,
        correlationId: payload.correlationId,
        remoteIp: payload.remoteIp,
        actorType: payload.actorType,
        actorUserId: payload.actorUserId,
        accessionNumber: payload.accessionNumber,
        studyInstanceUid: payload.studyInstanceUid,
        reportId: payload.reportId,
        hisOrderId: payload.hisOrderId,
        hisMessageId: payload.hisMessageId,
        requestSummaryJson: requestJson,
        responseSummaryJson: responseJson,
        errorCode: payload.errorCode,
        errorMessage: payload.errorMessage,
      }
    });
    return log;
  } catch (error) {
    console.error("Failed to log HIS API Call", error);
  }
}
