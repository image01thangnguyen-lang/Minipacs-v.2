import { createHmac, timingSafeEqual } from "crypto";
import { WORKLIST_CONTRACT_VERSION, WorklistQueryRequest } from "./contract";

export type WorklistCursor = {
  v: typeof WORKLIST_CONTRACT_VERSION;
  id: string;
  sortKey: WorklistQueryRequest["sort"]["key"];
  sortDirection: WorklistQueryRequest["sort"]["direction"];
};

function cursorSecret(): string {
  const secret = process.env.WORKLIST_CURSOR_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("Worklist cursor signing secret is not configured");
  }
  return secret || "worklist-development-only-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", cursorSecret()).update(payload).digest("base64url");
}

export function encodeWorklistCursor(cursor: WorklistCursor): string {
  const payload = Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeWorklistCursor(value: string, sort: WorklistQueryRequest["sort"]): WorklistCursor {
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) throw new Error("INVALID_CURSOR");
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("INVALID_CURSOR");

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as WorklistCursor;
    if (parsed.v !== WORKLIST_CONTRACT_VERSION || typeof parsed.id !== "string" || !parsed.id || parsed.sortKey !== sort.key || parsed.sortDirection !== sort.direction) {
      throw new Error("INVALID_CURSOR");
    }
    return parsed;
  } catch {
    throw new Error("INVALID_CURSOR");
  }
}