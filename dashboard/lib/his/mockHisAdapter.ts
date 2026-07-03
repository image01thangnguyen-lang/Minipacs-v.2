import { HisAdapter, HisAdapterHealth, HisOrderPayload, HisOrderQuery, HisReportPayload, HisSendResultResponse, HisSyncResult } from "./types";

export class MockHisAdapter implements HisAdapter {
  id = "mock";
  label = "Mock HIS Adapter";

  isEnabled(): boolean {
    return true; // We assume if this is instantiated, it's enabled
  }

  async healthCheck(): Promise<HisAdapterHealth> {
    return {
      status: "OK",
      message: "Mock HIS is healthy",
    };
  }

  async fetchOrder(query: HisOrderQuery): Promise<HisSyncResult<HisOrderPayload>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!query.accessionNumber && !query.patientId) {
      return {
        success: false,
        error: "Missing search criteria",
        errorCode: "INVALID_QUERY",
      };
    }

    // Mock response based on accession
    return {
      success: true,
      data: {
        hisOrderId: `HIS-ORD-${Math.floor(Math.random() * 10000)}`,
        patientId: query.patientId || "PID-MOCK-1",
        patientName: "MOCK PATIENT NAME",
        accessionNumber: query.accessionNumber,
        referringDepartment: "KHAM-BENH",
        procedureCode: "XQ-01",
        procedureDescription: "X-Quang Ngực Thẳng",
        paymentStatus: "PAID",
      },
      rawRequest: { query },
      rawResponse: { status: "success", mockData: true },
    };
  }

  async sendResult(payload: HisReportPayload): Promise<HisSyncResult<HisSendResultResponse>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Randomly fail sometimes for testing retry if needed
    // But mostly succeed
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return {
        success: true,
        data: {
          hisMessageId: `MSG-${Date.now()}`,
          status: "SUCCESS",
        },
        rawRequest: payload,
        rawResponse: { status: "OK", receivedAt: new Date().toISOString() },
      };
    } else {
      return {
        success: false,
        error: "Mock HIS rejected the result",
        errorCode: "MOCK_REJECT",
        data: {
          status: "FAILED",
        },
        rawRequest: payload,
        rawResponse: { status: "ERROR", reason: "Random mock failure" },
      };
    }
  }

  async cancelResult(payload: HisReportPayload): Promise<HisSyncResult<HisSendResultResponse>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: {
        hisMessageId: `CANCEL-${Date.now()}`,
        status: "SUCCESS",
      },
    };
  }
}
