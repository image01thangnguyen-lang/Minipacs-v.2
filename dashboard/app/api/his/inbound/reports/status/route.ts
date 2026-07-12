import { NextRequest, NextResponse } from "next/server";
import { authenticateHisGateway } from "@/lib/his/hisGatewayAuth";
import { logHisApiCall } from "@/lib/his/hisApiLogger";
import { prisma } from "@/app/db";


export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  const auth = await authenticateHisGateway(req);
  if (!auth.success) {
    await logHisApiCall({ direction: "INBOUND", method: "GET", path: "/api/his/inbound/reports/status", statusCode: auth.status, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: auth.message });
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }

  const accessionNumber = req.nextUrl.searchParams.get("accessionNumber");
  const hisOrderId = req.nextUrl.searchParams.get("hisOrderId");

  if (!accessionNumber && !hisOrderId) {
    await logHisApiCall({ direction: "INBOUND", method: "GET", path: "/api/his/inbound/reports/status", statusCode: 400, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, errorMessage: "Missing accessionNumber or hisOrderId" });
    return NextResponse.json({ success: false, errorCode: "HIS_VALIDATION_ERROR", message: "Missing accessionNumber or hisOrderId" }, { status: 400 });
  }

  try {
    const study = await prisma.imagingStudy.findFirst({
      where: {
        OR: [
          ...(accessionNumber ? [{ accessionNumber }] : []),
          ...(hisOrderId ? [{ hisOrderId }] : [])
        ]
      },
      include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } }
    });

    if (!study || !study.reports || study.reports.length === 0) {
      await logHisApiCall({ direction: "INBOUND", method: "GET", path: "/api/his/inbound/reports/status", statusCode: 404, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, requestSummary: { accessionNumber, hisOrderId }, errorMessage: "Report not found" });
      return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    }

    const report = study.reports[0];

    const responsePayload = {
      success: true,
      requestId,
      studyInstanceUid: study.studyInstanceUid,
      accessionNumber: study.accessionNumber,
      status: report.status,
      finalizedAt: report.finalizedAt
    };

    await logHisApiCall({
      direction: "INBOUND",
      method: "GET",
      path: "/api/his/inbound/reports/status",
      statusCode: 200,
      success: true,
      durationMs: Date.now() - startTime,
      actorType: "HIS_SYSTEM",
      requestId,
      accessionNumber: study.accessionNumber || undefined,
      studyInstanceUid: study.studyInstanceUid,
      requestSummary: { accessionNumber, hisOrderId },
      responseSummary: responsePayload
    });

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    await logHisApiCall({ direction: "INBOUND", method: "GET", path: "/api/his/inbound/reports/status", statusCode: 500, success: false, durationMs: Date.now() - startTime, actorType: "HIS_SYSTEM", requestId, requestSummary: { accessionNumber, hisOrderId }, errorMessage: error.message });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
