import { prisma } from "@/app/db";

export async function getActiveHisConfig() {
  const config = await prisma.hisConnectionConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" }
  });

  if (!config) {
    // Return mock config or disabled if DB is empty
    return {
      mode: process.env.HIS_INTEGRATION_MODE || "disabled",
      authMode: "none",
      isActive: true,
      apiKeyEncrypted: process.env.HIS_API_KEY || null,
      bearerTokenEncrypted: process.env.HIS_BEARER_TOKEN || null,
      basicUsername: process.env.HIS_BASIC_USERNAME || null,
      basicPasswordEncrypted: process.env.HIS_BASIC_PASSWORD || null,
      hmacSecretEncrypted: process.env.HIS_HMAC_SECRET || null,
      timeoutMs: parseInt(process.env.HIS_TIMEOUT_MS || "10000", 10),
      retryMax: parseInt(process.env.HIS_RETRY_MAX || "0", 10),
      baseUrl: process.env.HIS_BASE_URL || null,
    };
  }

  return config;
}

export async function testHisConnection(config: any) {
  // Try to ping the HIS Base URL if provided
  if (!config.baseUrl) return { success: false, message: "No Base URL configured" };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 5000);
    
    // Attempt a basic GET or HEAD request just to see if the host is reachable
    // In reality, this depends on the adapter type
    const response = await fetch(config.baseUrl, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return { success: true, status: response.status, message: "Connection successful" };
  } catch (error: any) {
    return { success: false, message: error.message || "Connection failed" };
  }
}
