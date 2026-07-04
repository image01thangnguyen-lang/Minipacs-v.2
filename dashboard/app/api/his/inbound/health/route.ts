import { NextRequest, NextResponse } from "next/server";
import { authenticateHisGateway } from "@/lib/his/hisGatewayAuth";
import { logHisApiCall } from "@/lib/his/hisApiLogger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const auth = await authenticateHisGateway(req);
  if (!auth.success) {
    await logHisApiCall({
      direction: "INBOUND",
      method: "GET",
      path: "/api/his/inbound/health",
      statusCode: auth.status,
      success: false,
      durationMs: Date.now() - startTime,
      actorType: "HIS_SYSTEM",
      errorMessage: auth.message
    });
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }

  await logHisApiCall({
    direction: "INBOUND",
    method: "GET",
    path: "/api/his/inbound/health",
    statusCode: 200,
    success: true,
    durationMs: Date.now() - startTime,
    actorType: "HIS_SYSTEM",
    responseSummary: { status: "OK" }
  });

  return NextResponse.json({ success: true, status: "OK", timestamp: new Date().toISOString() });
}
