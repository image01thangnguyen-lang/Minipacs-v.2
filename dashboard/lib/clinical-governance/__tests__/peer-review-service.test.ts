import assert from 'node:assert/strict';
import type { PeerReviewProgram, PrismaClient } from '@prisma/client';
import { PeerReviewService } from '../peer-review-service';

const program = { id: 'p1', version: 1, isActive: true, samplePercentage: 100 } as PeerReviewProgram;
const db: any = { peerReviewProgram: { findUnique: async () => program }, peerReviewExclusionRule: { findMany: async () => [] },
  peerReview: { upsert: async ({ create }: any) => ({ id: 'review-1', ...create }) } };
const service = new PeerReviewService(db as PrismaClient);
assert.equal(service.shouldSample('s1', program), service.shouldSample('s1', program));
assert.equal(service.shouldSample('s1', { ...program, samplePercentage: 0 }), false);
assert.equal(service.shouldSample('s1', { ...program, samplePercentage: 100 }), true);
assert.throws(() => service.shouldSample('s1', { ...program, samplePercentage: 101 }), /INVALID_SAMPLE/);
assert.equal(service.selectReviewer('s1', 'a', ['a']), null);
assert.equal(service.selectReviewer('s1', 'x', ['b', 'a', 'b']), service.selectReviewer('s1', 'x', ['a', 'b']));
void (async () => {
  assert.equal(await service.assignReview('p1', 'r1', 's1', 'author', ['reviewer'], 3), 'review-1');
  const noSampleDb: any = { ...db, peerReviewProgram: { findUnique: async () => ({ ...program, samplePercentage: 0 }) } };
  assert.equal(await new PeerReviewService(noSampleDb as PrismaClient).assignReview('p1', 'r1', 's1', 'author', ['reviewer']), null);
  console.log('clinical-governance peer review tests passed');
})().catch(e => { console.error(e); process.exitCode = 1; });