import { NextRequest, NextResponse } from "next/server";
import { authenticateHisGateway } from "@/lib/his/hisGatewayAuth";
import { logHisApiCall } from "@/lib/his/hisApiLogger";
import { prisma } from "@/app/db";


export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  const auth = await authenticateHisGateway(req);
  if (!auth.success) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/ack", statusCode: auth.status, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: auth.message });
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/ack", statusCode: 400, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: "Invalid JSON" });
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  if (!body.accessionNumber && !body.studyInstanceUid) {
    await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/ack", statusCode: 400, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, requestSummary: body, errorMessage: "Missing accessionNumber or studyInstanceUid" });
    return NextResponse.json({ success: false, errorCode: "HIS_VALIDATION_ERROR", message: "Missing accessionNumber or studyInstanceUid" }, { status: 400 });
  }

  try {
    const study = await prisma.imagingStudy.findFirst({
      where: {
        OR: [
          ...(body.accessionNumber ? [{ accessionNumber: body.accessionNumber }] : []),
          ...(body.studyInstanceUid ? [{ studyInstanceUid: body.studyInstanceUid }] : [])
        ]
      },
      include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } }
    });

    if (!study || !study.reports || study.reports.length === 0) {
      await logHisApiCall({ direction: "INBOUND", method: "POST", path: "/api/his/inbound/ack", statusCode: 404, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, requestSummary: body, errorMessage: "Report not found" });
      return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    }

    const report = study.reports[0];

    await prisma.report.update({
      where: { id: report.id },
      data: {
        hisResultStatus: "SYNCED"
      }
    });

    await prisma.imagingStudy.update({
      where: { id: study.id },
      data: {
        hisResultStatus: "SYNCED"
      }
    });

    const responsePayload = {
      success: true,
      requestId,
      status: "ACKNOWLEDGED"
    };

    await logHisApiCall({
      direction: "INBOUND",
      method: "POST",
      path: "/api/his/inbound/ack",
      statusCode: 200,
      success: true,
      durationMs: Date.now() - startTime,
      actorType: "HIS_SYSTEM",
      requestId,
      accessionNumber: study.accessionNumber || undefined,
      studyInstanceUid: study.studyInstanceUid,
      requestSummary: body,
      responseSummary: responsePayload
    });

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    await logHisApiCall({
      direction: "INBOUND",
      method: "POST",
      path: "/api/his/inbound/ack",
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
