import { NextRequest, NextResponse } from "next/server";
import { authenticateHisGateway } from "@/lib/his/hisGatewayAuth";
import { logHisApiCall } from "@/lib/his/hisApiLogger";
import { getInboundMapping, applyMapping } from "@/lib/his/hisMappingService";
import { detectHisConflict } from "@/lib/his/hisConflictService";
import { prisma } from "@/app/db";


export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  const auth = await authenticateHisGateway(req);
  if (!auth.success) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/orders/upsert", statusCode: auth.status, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: auth.message });
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/orders/upsert", statusCode: 400, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: "Invalid JSON" });
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  if (!body.accessionNumber && !body.hisOrderId) {
    await logHisApiCall({
      direction: "INBOUND",
      method: "POST",
      path: "/api/his/inbound/orders/upsert",
      statusCode: 400,
      success: false,
      durationMs: Date.now() - startTime,
      actorType: "HIS_SYSTEM",
      requestId,
      requestSummary: body,
      errorMessage: "Missing accessionNumber or hisOrderId",
      errorCode: "HIS_VALIDATION_ERROR"
    });
    return NextResponse.json({ success: false, errorCode: "HIS_VALIDATION_ERROR", message: "Missing accessionNumber or hisOrderId" }, { status: 400 });
  }

  const mappings = await getInboundMapping();
  const mappedData = applyMapping(body, mappings);

  try {
    let order = await prisma.worklistOrder.findFirst({
      where: {
        OR: [
          ...(mappedData.accessionNumber ? [{ accessionNumber: mappedData.accessionNumber }] : []),
          ...(mappedData.hisOrderId ? [{ hisOrderId: mappedData.hisOrderId }] : [])
        ]
      }
    });

    let conflict = false;

    if (order) {
      // Check for conflicts
      if (mappedData.patientName && order.patientName !== mappedData.patientName) {
        conflict = await detectHisConflict("WorklistOrder", order.id, order.accessionNumber, null, "patientName", order.patientName, mappedData.patientName) || conflict;
      }
      if (mappedData.modality && order.modality !== mappedData.modality) {
        conflict = await detectHisConflict("WorklistOrder", order.id, order.accessionNumber, null, "modality", order.modality, mappedData.modality) || conflict;
      }
      
      await prisma.worklistOrder.update({
        where: { id: order.id },
        data: {
          hisSyncStatus: "SYNCED",
          hisLastSyncedAt: new Date(),
          hisPayloadJson: JSON.stringify(mappedData),
          // We intentionally don't blind-overwrite patientName or modality here if there's conflict
          // Update safe fields
          phone: mappedData.phone || order.phone,
          paymentStatus: mappedData.paymentStatus || order.paymentStatus,
          priority: mappedData.priority || order.priority,
          hisOrderId: mappedData.hisOrderId || order.hisOrderId,
        }
      });
    } else {
      order = await prisma.worklistOrder.create({
        data: {
          accessionNumber: mappedData.accessionNumber || `ACC-${Date.now()}`,
          patientId: mappedData.patientId || `PID-${Date.now()}`,
          patientName: mappedData.patientName || "Unknown",
          modality: mappedData.modality || "OT",
          procedureCode: mappedData.procedureCode,
          procedureDescription: mappedData.procedureDescription,
          priority: mappedData.priority || "ROUTINE",
          hisOrderId: mappedData.hisOrderId,
          hisSyncStatus: "SYNCED",
          hisLastSyncedAt: new Date(),
          hisPayloadJson: JSON.stringify(mappedData),
          status: "PENDING",
          orderStatus: "REQUESTED"
        }
      });
    }

    const responsePayload = {
      success: true,
      requestId,
      accessionNumber: order.accessionNumber,
      worklistOrderId: order.id,
      status: "SYNCED",
      conflict
    };

    await logHisApiCall({
      direction: "INBOUND",
      method: "POST",
      path: "/api/his/inbound/orders/upsert",
      statusCode: 200,
      success: true,
      durationMs: Date.now() - startTime,
      actorType: "HIS_SYSTEM",
      requestId,
      accessionNumber: order.accessionNumber,
      requestSummary: body,
      responseSummary: responsePayload
    });

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    await logHisApiCall({
      direction: "INBOUND",
      method: "POST",
      path: "/api/his/inbound/orders/upsert",
      statusCode: 500,
      success: false,
      durationMs: Date.now() - startTime,
      actorType: "HIS_SYSTEM",
      requestId,
      requestSummary: body,
      errorMessage: error.message
    });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
