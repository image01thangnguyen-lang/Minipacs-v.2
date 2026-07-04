import { HisAdapter, HisAdapterHealth, HisOrderQuery, HisSyncResult, HisOrderPayload, HisReportPayload, HisSendResultResponse } from "./types";
import { getActiveHisConfig } from "./hisConfigService";
import { logHisApiCall } from "./hisApiLogger";
import { decryptHisSecret } from "./hisCrypto";

export class RestHisAdapter implements HisAdapter {
  id = "rest";
  label = "REST API Adapter";

  isEnabled(): boolean {
    return true; // The adapter itself is enabled if instantiated
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const config = await getActiveHisConfig();
    const headers = new Headers(options.headers || {});
    
    if (config.authMode === "apiKey" && config.apiKeyEncrypted) {
      headers.set("x-api-key", decryptHisSecret(config.apiKeyEncrypted) || "");
    } else if (config.authMode === "bearer" && config.bearerTokenEncrypted) {
      headers.set("Authorization", `Bearer ${decryptHisSecret(config.bearerTokenEncrypted)}`);
    } else if (config.authMode === "basic" && config.basicUsername && config.basicPasswordEncrypted) {
      const b64 = Buffer.from(`${config.basicUsername}:${decryptHisSecret(config.basicPasswordEncrypted)}`).toString("base64");
      headers.set("Authorization", `Basic ${b64}`);
    }
    
    headers.set("Content-Type", "application/json");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 10000);

    try {
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  async healthCheck(): Promise<HisAdapterHealth> {
    const config = await getActiveHisConfig();
    if (!config.baseUrl) return { status: "ERROR", message: "No base URL configured" };

    const startTime = Date.now();
    let status = 500;
    let success = false;
    let errorMessage = "";

    try {
      const url = `${config.baseUrl}/health`;
      const res = await this.fetchWithAuth(url);
      status = res.status;
      success = res.ok;
      if (!success) {
        errorMessage = `HTTP ${status}: ${res.statusText}`;
      }
      
      await logHisApiCall({
        direction: "OUTBOUND",
        method: "GET",
        path: url,
        endpointKey: "healthCheck",
        statusCode: status,
        success,
        durationMs: Date.now() - startTime,
        actorType: "SYSTEM",
        errorMessage: errorMessage || undefined
      });

      return { status: success ? "OK" : "ERROR", message: errorMessage };
    } catch (error: any) {
      await logHisApiCall({
        direction: "OUTBOUND",
        method: "GET",
        path: `${config.baseUrl}/health`,
        endpointKey: "healthCheck",
        statusCode: 0,
        success: false,
        durationMs: Date.now() - startTime,
        actorType: "SYSTEM",
        errorMessage: error.message
      });
      return { status: "ERROR", message: error.message };
    }
  }

  async fetchOrder(query: HisOrderQuery): Promise<HisSyncResult<HisOrderPayload>> {
    const config = await getActiveHisConfig();
    if (!config.baseUrl) return { success: false, error: "No base URL configured" };

    const startTime = Date.now();
    let status = 500;
    let success = false;
    let errorMessage = "";
    const url = new URL(`${config.baseUrl}/orders`);
    if (query.accessionNumber) url.searchParams.append("accessionNumber", query.accessionNumber);
    if (query.patientId) url.searchParams.append("patientId", query.patientId);

    try {
      const res = await this.fetchWithAuth(url.toString(), { method: "GET" });
      status = res.status;
      success = res.ok;
      const data = await res.json().catch(() => null);

      if (!success) {
        errorMessage = data?.message || `HTTP ${status}`;
        await logHisApiCall({
          direction: "OUTBOUND",
          method: "GET",
          path: url.toString(),
          endpointKey: "fetchOrder",
          statusCode: status,
          success,
          durationMs: Date.now() - startTime,
          actorType: "SYSTEM",
          accessionNumber: query.accessionNumber,
          requestSummary: query,
          responseSummary: data,
          errorMessage
        });
        return { success: false, error: errorMessage, rawResponse: data };
      }

      await logHisApiCall({
        direction: "OUTBOUND",
        method: "GET",
        path: url.toString(),
        endpointKey: "fetchOrder",
        statusCode: status,
        success: true,
        durationMs: Date.now() - startTime,
        actorType: "SYSTEM",
        accessionNumber: query.accessionNumber,
        requestSummary: query,
        responseSummary: data
      });

      // Simple mapping assuming HIS returns exact fields or array
      const order = Array.isArray(data) ? data[0] : data;
      if (!order) return { success: false, error: "Order not found", errorCode: "HIS_NOT_FOUND" };

      return { success: true, data: order as HisOrderPayload };
    } catch (error: any) {
      await logHisApiCall({
        direction: "OUTBOUND",
        method: "GET",
        path: url.toString(),
        endpointKey: "fetchOrder",
        statusCode: 0,
        success: false,
        durationMs: Date.now() - startTime,
        actorType: "SYSTEM",
        accessionNumber: query.accessionNumber,
        requestSummary: query,
        errorMessage: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async sendResult(payload: HisReportPayload): Promise<HisSyncResult<HisSendResultResponse>> {
    const config = await getActiveHisConfig();
    if (!config.baseUrl) return { success: false, error: "No base URL configured" };

    const startTime = Date.now();
    let status = 500;
    let success = false;
    let errorMessage = "";
    const url = `${config.baseUrl}/reports`;

    try {
      const res = await this.fetchWithAuth(url, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      status = res.status;
      success = res.ok;
      const data = await res.json().catch(() => null);

      if (!success) {
        errorMessage = data?.message || `HTTP ${status}`;
      }

      await logHisApiCall({
        direction: "OUTBOUND",
        method: "POST",
        path: url,
        endpointKey: "sendResult",
        statusCode: status,
        success,
        durationMs: Date.now() - startTime,
        actorType: "SYSTEM",
        accessionNumber: payload.accessionNumber,
        studyInstanceUid: payload.studyInstanceUid,
        requestSummary: payload, // will be scrubbed
        responseSummary: data,
        errorMessage
      });

      if (!success) {
        return { success: false, error: errorMessage, rawResponse: data };
      }

      return { success: true, data: { status: "SUCCESS", hisMessageId: data?.messageId } };
    } catch (error: any) {
      await logHisApiCall({
        direction: "OUTBOUND",
        method: "POST",
        path: url,
        endpointKey: "sendResult",
        statusCode: 0,
        success: false,
        durationMs: Date.now() - startTime,
        actorType: "SYSTEM",
        accessionNumber: payload.accessionNumber,
        studyInstanceUid: payload.studyInstanceUid,
        requestSummary: payload,
        errorMessage: error.message
      });
      return { success: false, error: error.message };
    }
  }
}
