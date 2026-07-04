import { NextRequest } from "next/server";
import { getActiveHisConfig } from "./hisConfigService";
import { decryptHisSecret } from "./hisCrypto";
import crypto from "crypto";

function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch(e) {
    return false;
  }
}

export async function authenticateHisGateway(req: NextRequest) {
  const config = await getActiveHisConfig();

  if (!config || !config.isActive || config.mode === "disabled") {
    return { success: false, status: 503, message: "HIS Integration is disabled or not configured." };
  }

  const { authMode, apiKeyEncrypted, bearerTokenEncrypted, basicUsername, basicPasswordEncrypted, hmacSecretEncrypted } = config;

  if (authMode === "none") {
    return { success: true };
  }

  const authHeader = req.headers.get("authorization");

  if (authMode === "apiKey") {
    const apiKey = req.headers.get("x-api-key") || authHeader?.replace("ApiKey ", "");
    const expectedKey = decryptHisSecret(apiKeyEncrypted);
    if (!safeCompare(apiKey, expectedKey)) {
      return { success: false, status: 401, message: "Invalid API Key" };
    }
  } else if (authMode === "bearer") {
    const token = authHeader?.replace("Bearer ", "");
    const expectedToken = decryptHisSecret(bearerTokenEncrypted);
    if (!safeCompare(token, expectedToken)) {
      return { success: false, status: 401, message: "Invalid Bearer Token" };
    }
  } else if (authMode === "basic") {
    const b64auth = (authHeader || "").split(" ")[1] || "";
    const [user, password] = Buffer.from(b64auth, "base64").toString().split(":");
    const expectedPassword = decryptHisSecret(basicPasswordEncrypted);
    if (user !== basicUsername || !safeCompare(password, expectedPassword)) {
      return { success: false, status: 401, message: "Invalid Basic Auth" };
    }
  } else if (authMode === "hmac") {
    return { success: false, status: 501, message: "HMAC auth not fully implemented yet" };
  } else {
    return { success: false, status: 401, message: "Unsupported Auth Mode" };
  }

  return { success: true };
}
