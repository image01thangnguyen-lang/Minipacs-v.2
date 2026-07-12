import { NextRequest, NextResponse } from "next/server";
import { authenticateHisGateway } from "@/lib/his/hisGatewayAuth";
import { logHisApiCall } from "@/lib/his/hisApiLogger";
import { prisma } from "@/app/db";


export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  const auth = await authenticateHisGateway(req);
  if (!auth.success) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/orders/cancel", statusCode: auth.status, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: auth.message });
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/orders/cancel", statusCode: 400, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: "Invalid JSON" });
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  if (!body.accessionNumber && !body.hisOrderId) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/orders/cancel", statusCode: 400, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, requestSummary: body, errorMessage: "Missing accessionNumber or hisOrderId" });
    return NextResponse.json({ success: false, errorCode: "HIS_VALIDATION_ERROR", message: "Missing accessionNumber or hisOrderId" }, { status: 400 });
  }

  try {
    const order = await prisma.worklistOrder.findFirst({
      where: {
        OR: [
          ...(body.accessionNumber ? [{ accessionNumber: body.accessionNumber }] : []),
          ...(body.hisOrderId ? [{ hisOrderId: body.hisOrderId }] : [])
        ]
      },
      include: { imagingStudies: true }
    });

    if (!order) {
      await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/orders/cancel", statusCode: 404, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, requestSummary: body, errorMessage: "Order not found" });
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Determine if we can safely cancel
    let canCancel = true;
    let conflict = false;
    if (order.imagingStudies.length > 0) {
      canCancel = false;
      conflict = true;
      // We log conflict if there are images/studies
      await prisma.hisConflict.create({
        data: {
          entityType: "WorklistOrder",
          entityId: order.id,
          accessionNumber: order.accessionNumber,
          fieldName: "status",
          currentValue: "IN_PROGRESS / RECEIVED",
          incomingValue: "CANCELLED",
          status: "OPEN",
          resolutionNote: "HIS requested cancellation but images exist"
        }
      });
    }

    if (canCancel) {
      await prisma.worklistOrder.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          orderStatus: "CANCELLED",
          cancelledAt: new Date()
        }
      });
    }

    const responsePayload = {
      success: true,
      requestId,
      accessionNumber: order.accessionNumber,
      status: canCancel ? "CANCELLED" : "CONFLICT",
      conflict
    };

    await logHisApiCall({
      direction: "INBOUND",
      method: "POST",
      path: "/api/his/inbound/orders/cancel",
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
      path: "/api/his/inbound/orders/cancel",
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
