import assert from "node:assert/strict";
import { InboxProcessor, safeInboxErrorCode } from "../inbox-processor";
async function main() {
  const now = new Date("2026-07-13T12:00:00Z"); const updates: any[] = [];
  const deps: any = { enterpriseInteropEnabled: () => true, now: () => now, inboxMessage: {
    create: async ({ data }: any) => ({ id: "m-1", retryCount: 0, ...data }), findUnique: async () => null,
    findMany: async () => [{ id: "m-1", retryCount: 0, payloadJson: '{"ok":true}', status: "PENDING" }],
    updateMany: async (args: any) => { updates.push(args); return { count: 1 }; },
  } };
  const inbox = new InboxProcessor(deps);
  assert.equal((await inbox.receiveMessage({ payloadJson: "{}", idempotencyKey: "k", sourceEndpointId: "ep", correlationId: "c" }) as any).status, "PENDING");
  assert.equal(await inbox.processInboxBatch(10, 3, async p => assert.deepEqual(p, { ok: true })), 1);
  assert.equal(updates[0].data.status, "PROCESSING"); assert.equal(updates[1].data.status, "COMPLETED");
  updates.length = 0; await inbox.processInboxBatch(10, 1, async () => { throw new Error("raw patient detail"); });
  assert.equal(updates[1].data.status, "DEAD_LETTER"); assert.equal(updates[1].data.lastErrorCode, "PROCESSING_ERROR");
  assert.equal(safeInboxErrorCode(new SyntaxError()), "MALFORMED_PAYLOAD");
  deps.inboxMessage.updateMany = async () => ({ count: 0 });
  assert.equal(await inbox.processInboxBatch(10, 3, async () => assert.fail()), 0);
  console.log("inbox-processor tests passed");
}
void main();