import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { CanonicalEventEnvelope, validateEventEnvelope } from "./event-contracts";

export interface WorkerRuntimeConfig { workerId: string; leaseId: string; leaseDurationMs: number; maxRetries: number; batchSize: number; baseRetryDelayMs?: number }
export type OutboxProcessor = (event: CanonicalEventEnvelope, tx: Prisma.TransactionClient) => Promise<void>;
export const retryDelayMs = (attempt: number, base = 1000) => Math.min(base * 2 ** Math.max(0, attempt - 1), 900_000);
export const safeErrorCode = (error: unknown) => error instanceof Error && /^[A-Za-z][\w.-]{0,63}$/.test(error.name) ? error.name : "PROCESSING_ERROR";

export class WorkerRuntime {
  private fence: number | null = null;
  constructor(private prisma: PrismaClient, private config: WorkerRuntimeConfig) {
    if (config.leaseDurationMs <= 0 || config.maxRetries <= 0 || config.batchSize <= 0) throw new Error("INVALID_WORKER_CONFIG");
  }
  async acquireLease(): Promise<boolean> {
    const now = new Date(), expiresAt = new Date(now.getTime() + this.config.leaseDurationMs);
    const old = await this.prisma.workerLease.findUnique({ where: { id: this.config.leaseId } });
    if (!old) try {
      const row = await this.prisma.workerLease.create({ data: { id: this.config.leaseId, ownerId: this.config.workerId, expiresAt, version: 1 } });
      this.fence = row.version; return true;
    } catch { return false; }
    if (old.expiresAt > now && old.ownerId !== this.config.workerId) return false;
    const won = await this.prisma.workerLease.updateMany({ where: { id: old.id, version: old.version }, data: { ownerId: this.config.workerId, expiresAt, version: { increment: 1 } } });
    if (won.count !== 1) return false; this.fence = old.version + 1; return true;
  }
  async processOutboxBatch(processor: OutboxProcessor): Promise<number> {
    if (!(await this.acquireLease())) return 0;
    const now = new Date();
    const rows = await this.prisma.outboxMessage.findMany({ where: { availableAt: { lte: now }, OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedUntil: { lt: now } }] }, orderBy: [{ occurredAt: "asc" }, { id: "asc" }], take: this.config.batchSize });
    let count = 0;
    for (const row of rows) {
      const claimToken = randomUUID();
      const claim = await this.prisma.outboxMessage.updateMany({ where: { id: row.id, OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedUntil: { lt: new Date() } }] }, data: { status: "PROCESSING", claimToken, lockedUntil: new Date(Date.now() + this.config.leaseDurationMs) } });
      if (claim.count !== 1) continue;
      try {
        const fresh = await this.prisma.workerLease.findFirst({ where: { id: this.config.leaseId, ownerId: this.config.workerId, version: this.fence!, expiresAt: { gt: new Date() } } });
        if (!fresh) throw new Error("LEASE_LOST");
        const event = validateEventEnvelope(row.payload);
        await this.prisma.$transaction(async tx => {
          const duplicate = await tx.domainEvent.findUnique({ where: { eventId: event.eventId } });
          if (!duplicate) {
            await processor(event, tx);
            await tx.domainEvent.create({ data: { eventId: event.eventId, eventType: event.eventType, eventVersion: event.eventVersion, idempotencyKey: event.idempotencyKey, payload: event as Prisma.InputJsonValue, correlationId: event.correlationId, causationId: event.causationId, actorType: event.actor?.type, actorId: event.actor?.id, organizationId: event.organizationId, facilityId: event.facilityId, entityType: event.entityType, entityId: event.entityId, reportRevision: event.reportRevision, phiClass: event.phiClass, occurredAt: new Date(event.occurredAt), recordedAt: new Date(event.recordedAt) } });
          }
          const done = await tx.outboxMessage.updateMany({ where: { id: row.id, status: "PROCESSING", claimToken }, data: { status: "COMPLETED", processedAt: new Date(), claimToken: null, lockedUntil: null, lastErrorCode: null } });
          if (done.count !== 1) throw new Error("CLAIM_LOST");
        }); count++;
      } catch (error) {
        const retryCount = row.retryCount + 1;
        await this.prisma.outboxMessage.updateMany({ where: { id: row.id, claimToken }, data: { status: retryCount >= this.config.maxRetries ? "FAILED" : "PENDING", retryCount, availableAt: new Date(Date.now() + retryDelayMs(retryCount, this.config.baseRetryDelayMs)), claimToken: null, lockedUntil: null, lastErrorCode: safeErrorCode(error) } });
      }
    }
    return count;
  }
}