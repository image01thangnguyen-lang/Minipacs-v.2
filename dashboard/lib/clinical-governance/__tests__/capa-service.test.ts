import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { CapaService } from '../capa-service';

void (async () => {
  let state = 'INVESTIGATING';
  const tx: any = { capaCase: {
    findUnique: async () => ({ id: 'c1', committeeId: 'q1', status: state, actions: [{ status: 'COMPLETED' }] }),
    updateMany: async ({ where, data }: any) => { if (where.status !== state) return { count: 0 }; state = data.status; return { count: 1 }; },
    findUniqueOrThrow: async () => ({ id: 'c1', status: state }),
    create: async ({ data }: any) => ({ id: 'created', ...data }) },
    qualityCommittee: { findUnique: async () => ({ isActive: true }) },
    peerReview: { findUnique: async () => ({ id: 'pr1' }) },
    qualityCommitteeMember: { findUnique: async () => ({ role: 'CHAIR', isActive: true }) }, capaTransition: { create: async () => ({}) } };
  const service = new CapaService({ ...tx, $transaction: async (fn: any) => fn(tx) } as PrismaClient);
  assert.equal((await service.linkPeerReviewToCapa('q1', 'pr1', ' Finding ', 'u1')).title, 'Finding');
  assert.equal((await service.closeCase('c1', 'verified', 'evidence', 'u1')).status, 'CLOSED');
  await assert.rejects(() => service.closeCase('c1', 'verified', 'evidence', 'u1'), /INVALID_CAPA_TRANSITION/);
  state = 'OPEN';
  await assert.rejects(() => service.closeCase('c1', 'verified', 'evidence', 'u1'), /INVALID_CAPA_TRANSITION/);
  console.log('clinical-governance CAPA tests passed');
})().catch(e => { console.error(e); process.exitCode = 1; });