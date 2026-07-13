import { randomUUID } from "node:crypto";

type InboxRecord = Readonly<{ id: string; payloadJson: string; retryCount: number; status: string }>;
type InboxRepository = Readonly<{
  create(args: { data: Record<string, unknown> }): Promise<InboxRecord>;
  findUnique(args: { where: Record<string, string> }): Promise<InboxRecord | null>;
  findMany(args: { where: Record<string, unknown>; orderBy: { receivedAt: "asc" }; take: number }): Promise<InboxRecord[]>;
  updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
}>;
export type InboxProcessorDependencies = Readonly<{ inboxMessage: InboxRepository; enterpriseInteropEnabled(): boolean; now(): Date }>;
const MAX_PAYLOAD_BYTES = 1024 * 1024;
const LOCK_MS = 60_000;
export function safeInboxErrorCode(error: unknown): string {
  if (error instanceof SyntaxError) return "MALFORMED_PAYLOAD";
  if (error instanceof Error && /^[A-Z][A-Z0-9_]{2,63}$/.test(error.message)) return error.message;
  return "PROCESSING_ERROR";
}

export class InboxProcessor {
  constructor(private readonly deps: InboxProcessorDependencies) {}
  private enabled(): void { if (!this.deps.enterpriseInteropEnabled()) throw new Error("ENTERPRISE_INTEROP_DISABLED"); }

  async receiveMessage(input: Readonly<{ payloadJson: string; idempotencyKey: string; sourceEndpointId: string; correlationId: string; orderingKey?: string }>) {
    this.enabled();
    if (!input.idempotencyKey.trim() || !input.correlationId.trim() || !input.sourceEndpointId.trim()) throw new Error("MESSAGE_IDENTITY_REQUIRED");
    if (Buffer.byteLength(input.payloadJson, "utf8") > MAX_PAYLOAD_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
    try { return await this.deps.inboxMessage.create({ data: { ...input, orderingKey: input.orderingKey ?? null, status: "PENDING", availableAt: this.deps.now() } }); }
    catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return this.deps.inboxMessage.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      throw error;
    }
  }

  /** Conditional update atomically claims a candidate; concurrent workers cannot both own it. */
  async processInboxBatch(batchSize: number, maxRetries: number, processorFn: (payload: unknown, message: InboxRecord) => Promise<void>): Promise<number> {
    this.enabled();
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100 || !Number.isInteger(maxRetries) || maxRetries < 1) throw new Error("INVALID_BATCH_OPTIONS");
    const now = this.deps.now();
    const claimable = [{ status: "PENDING", availableAt: { lte: now } }, { status: "PROCESSING", lockedUntil: { lt: now } }];
    const candidates = await this.deps.inboxMessage.findMany({ where: { OR: claimable }, orderBy: { receivedAt: "asc" }, take: batchSize });
    let claimed = 0;
    for (const msg of candidates) {
      const claimToken = randomUUID();
      const claim = await this.deps.inboxMessage.updateMany({ where: { id: msg.id, OR: claimable }, data: { status: "PROCESSING", claimToken, lockedUntil: new Date(now.getTime() + LOCK_MS) } });
      if (claim.count !== 1) continue;
      claimed += 1;
      try {
        await processorFn(JSON.parse(msg.payloadJson), msg);
        await this.deps.inboxMessage.updateMany({ where: { id: msg.id, claimToken }, data: { status: "COMPLETED", processedAt: this.deps.now(), claimToken: null, lockedUntil: null, lastErrorCode: null } });
      } catch (error) {
        const retryCount = (msg.retryCount ?? 0) + 1;
        const failed = retryCount >= maxRetries;
        const delayMs = Math.min(900_000, 1000 * 2 ** Math.min(retryCount - 1, 10));
        await this.deps.inboxMessage.updateMany({ where: { id: msg.id, claimToken }, data: {
          retryCount, status: failed ? "DEAD_LETTER" : "PENDING", availableAt: new Date(this.deps.now().getTime() + delayMs),
          claimToken: null, lockedUntil: null, lastErrorCode: safeInboxErrorCode(error),
        } });
      }
    }
    return claimed;
  }
}