import { prisma } from "@/app/db";
import { getHisAdapter } from "./hisAdapter";
import { logHisSync } from "./hisAudit";
import { mapHisOrderToPrismaData } from "./hisPayloadMapper";
import { HisReportPayload } from "./types";

export async function syncOrderFromHis(accessionNumber: string, userId?: string) {
  const adapter = await getHisAdapter();
  if (!adapter) {
    return { success: false, error: "HIS Integration is disabled", status: "DISABLED" };
  }

  try {
    const response = await adapter.fetchOrder({ accessionNumber });
    
    if (!response.success || !response.data) {
      await prisma.worklistOrder.updateMany({
        where: { accessionNumber },
        data: { hisSyncStatus: "FAILED", hisLastError: response.error || "HIS returned no data" },
      });
      await prisma.imagingStudy.updateMany({
        where: { accessionNumber },
        data: { hisSyncStatus: "FAILED", hisLastError: response.error || "HIS returned no data" },
      });
      await logHisSync({
        direction: "INBOUND",
        action: "UPDATE_ORDER",
        status: "FAILED",
        entityType: "WorklistOrder",
        accessionNumber,
        errorCode: response.errorCode,
        errorMessage: response.error,
        requestSummary: response.rawRequest,
        responseSummary: response.rawResponse,
        actorUserId: userId,
      });
      return { success: false, error: response.error, status: "FAILED" };
    }

    const hisData = response.data;
    const mappedData = mapHisOrderToPrismaData(hisData);

    const order = await prisma.worklistOrder.findUnique({
      where: { accessionNumber }
    });

    if (!order) {
      return { success: false, error: "Order not found locally", status: "FAILED" };
    }

    // Only update fields that are safely overridable or missing
    await prisma.worklistOrder.update({
      where: { accessionNumber },
      data: {
        ...mappedData,
        hisSyncStatus: "SYNCED",
        hisLastSyncedAt: new Date(),
        hisPayloadJson: JSON.stringify(hisData),
      }
    });

    // Optionally update ImagingStudy if needed
    const study = await prisma.imagingStudy.findFirst({
      where: { accessionNumber }
    });

    if (study) {
      await prisma.imagingStudy.update({
        where: { id: study.id },
        data: {
          hisOrderId: mappedData.hisOrderId || study.hisOrderId,
          hisSyncStatus: "SYNCED",
          hisLastSyncedAt: new Date(),
        }
      });
    }

    await logHisSync({
      direction: "INBOUND",
      action: "UPDATE_ORDER",
      status: "SUCCESS",
      entityType: "WorklistOrder",
      entityId: order.id,
      accessionNumber,
      hisOrderId: hisData.hisOrderId,
      requestSummary: response.rawRequest,
      responseSummary: response.rawResponse,
      actorUserId: userId,
    });

    return { success: true, data: mappedData, status: "SYNCED" };
  } catch (error: any) {
    console.error("Error syncing order from HIS:", error);
    // Persist FAILED status so UI can show retry
    try {
      await prisma.worklistOrder.updateMany({
        where: { accessionNumber },
        data: { hisSyncStatus: "FAILED", hisLastError: error.message },
      });
      await prisma.imagingStudy.updateMany({
        where: { accessionNumber },
        data: { hisSyncStatus: "FAILED", hisLastError: error.message },
      });
      await logHisSync({
        direction: "INBOUND",
        action: "UPDATE_ORDER",
        status: "FAILED",
        entityType: "WorklistOrder",
        accessionNumber,
        errorMessage: error.message,
        actorUserId: userId,
      });
    } catch (dbErr) {
      console.error("Failed to persist HIS FAILED state:", dbErr);
    }
    return { success: false, error: error.message, status: "FAILED" };
  }
}

export async function sendReportToHis(studyInstanceUid: string, userId?: string) {
  const adapter = await getHisAdapter();
  if (!adapter) {
    return { success: false, error: "HIS Integration is disabled", status: "DISABLED" };
  }

  try {
    const report = await prisma.report.findUnique({
      where: { studyInstanceUid },
      include: {
        imagingStudy: {
          include: { order: true }
        },
        doctor: {
          include: { doctorProfile: true }
        }
      }
    });

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    if (report.status !== "FINAL") {
      return { success: false, error: "Can only send FINAL reports" };
    }

    const payload: HisReportPayload = {
      hisOrderId: report.imagingStudy?.hisOrderId || report.imagingStudy?.order?.hisOrderId || undefined,
      accessionNumber: report.imagingStudy?.accessionNumber || undefined,
      studyInstanceUid,
      patientId: report.imagingStudy?.patientId || undefined,
      patientName: report.imagingStudy?.patientName || undefined,
      modality: report.imagingStudy?.modality || undefined,
      procedureCode: report.imagingStudy?.procedureCode || undefined,
      procedureDescription: report.imagingStudy?.procedureDescription || undefined,
      findings: report.findings || undefined,
      conclusion: report.conclusion || undefined,
      recommendation: report.recommendation || undefined,
      doctorName: report.doctor?.fullName || undefined,
      doctorLicenseNumber: report.doctor?.doctorProfile?.licenseNumber || undefined,
      finalizedAt: report.finalizedAt || undefined,
      reportHtml: report.findings || "", // Should render full HTML ideally
    };

    const response = await adapter.sendResult(payload);

    if (response.success && response.data?.status === "SUCCESS") {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          hisResultStatus: "SYNCED",
          hisResultSentAt: new Date(),
          hisResultMessageId: response.data.hisMessageId,
          hisResultError: null,
        }
      });
      if (report.imagingStudy) {
        await prisma.imagingStudy.update({
          where: { id: report.imagingStudy.id },
          data: {
            hisResultStatus: "SYNCED",
            hisLastResultSentAt: new Date(),
            hisLastError: null,
          }
        });
      }

      await logHisSync({
        direction: "OUTBOUND",
        action: "SEND_RESULT",
        status: "SUCCESS",
        entityType: "Report",
        entityId: report.id,
        studyInstanceUid,
        accessionNumber: payload.accessionNumber,
        hisOrderId: payload.hisOrderId,
        hisMessageId: response.data.hisMessageId,
        requestSummary: response.rawRequest,
        responseSummary: response.rawResponse,
        actorUserId: userId,
      });

      return { success: true, status: "SYNCED", messageId: response.data.hisMessageId };
    } else {
      const errorMsg = response.error || response.data?.error || "Unknown HIS error";
      
      await prisma.report.update({
        where: { id: report.id },
        data: {
          hisResultStatus: "FAILED",
          hisResultError: errorMsg,
        }
      });
      if (report.imagingStudy) {
        await prisma.imagingStudy.update({
          where: { id: report.imagingStudy.id },
          data: {
            hisResultStatus: "FAILED",
            hisLastError: errorMsg,
          }
        });
      }

      await logHisSync({
        direction: "OUTBOUND",
        action: "SEND_RESULT",
        status: "FAILED",
        entityType: "Report",
        entityId: report.id,
        studyInstanceUid,
        accessionNumber: payload.accessionNumber,
        hisOrderId: payload.hisOrderId,
        errorCode: response.errorCode,
        errorMessage: errorMsg,
        requestSummary: response.rawRequest,
        responseSummary: response.rawResponse,
        actorUserId: userId,
      });

      return { success: false, error: errorMsg, status: "FAILED" };
    }
  } catch (error: any) {
    console.error("Error sending report to HIS:", error);
    // Persist FAILED status so UI can show retry
    try {
      await prisma.report.updateMany({
        where: { studyInstanceUid },
        data: { hisResultStatus: "FAILED", hisResultError: error.message },
      });
      await prisma.imagingStudy.updateMany({
        where: { studyInstanceUid },
        data: { hisResultStatus: "FAILED", hisLastError: error.message },
      });
      await logHisSync({
        direction: "OUTBOUND",
        action: "SEND_RESULT",
        status: "FAILED",
        entityType: "Report",
        studyInstanceUid,
        errorMessage: error.message,
        actorUserId: userId,
      });
    } catch (dbErr) {
      console.error("Failed to persist HIS FAILED state:", dbErr);
    }
    return { success: false, error: error.message, status: "FAILED" };
  }
}
