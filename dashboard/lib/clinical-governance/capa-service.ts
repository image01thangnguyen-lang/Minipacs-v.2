import type { CapaCase, PrismaClient } from '@prisma/client';

export type CapaStatus = 'OPEN' | 'INVESTIGATING' | 'CLOSED';
const ALLOWED: Record<CapaStatus, readonly CapaStatus[]> = { OPEN: ['INVESTIGATING'], INVESTIGATING: ['CLOSED'], CLOSED: [] };

export class CapaService {
  constructor(private readonly prisma: PrismaClient) {}

  public async linkPeerReviewToCapa(committeeId: string, peerReviewId: string, title: string, actorId: string): Promise<CapaCase> {
    if (!title.trim()) throw new Error('CAPA_TITLE_REQUIRED');
    return this.prisma.$transaction(async tx => {
      const committee = await tx.qualityCommittee.findUnique({ where: { id: committeeId }, select: { isActive: true } });
      if (!committee?.isActive) throw new Error('QUALITY_COMMITTEE_NOT_ACTIVE');
      const member = await tx.qualityCommitteeMember.findUnique({
        where: { committeeId_userId: { committeeId, userId: actorId } },
      });
      if (!member?.isActive || !['CHAIR', 'MEMBER'].includes(member.role)) {
        throw new Error('UNAUTHORIZED_COMMITTEE_ACTION');
      }
      const source = await tx.peerReview.findUnique({ where: { id: peerReviewId }, select: { id: true } });
      if (!source) throw new Error('PEER_REVIEW_NOT_FOUND');
      const created = await tx.capaCase.create({ data: { committeeId, peerReviewId, title: title.trim(), status: 'OPEN' } });
      await tx.capaTransition.create({ data: { caseId: created.id, fromStatus: 'NONE', toStatus: 'OPEN', actorUserId: actorId } });
      return created;
    });
  }

  public async transitionCase(caseId: string, next: CapaStatus, actorId: string, evidence?: string, closureReason?: string): Promise<CapaCase> {
    return this.prisma.$transaction(async tx => {
      const current = await tx.capaCase.findUnique({ where: { id: caseId }, include: { actions: true } });
      if (!current) throw new Error('CAPA_CASE_NOT_FOUND');
      const member = await tx.qualityCommitteeMember.findUnique({ where: { committeeId_userId: { committeeId: current.committeeId, userId: actorId } } });
      if (!member?.isActive || !['CHAIR', 'MEMBER'].includes(member.role)) throw new Error('UNAUTHORIZED_COMMITTEE_ACTION');
      const from = current.status as CapaStatus;
      if (!ALLOWED[from]?.includes(next)) throw new Error(`INVALID_CAPA_TRANSITION:${from}->${next}`);
      if (next === 'CLOSED') {
        if (!evidence?.trim() || !closureReason?.trim()) throw new Error('CAPA_CLOSURE_EVIDENCE_REQUIRED');
        if (current.actions.some(a => !['COMPLETED', 'CANCELLED'].includes(a.status))) throw new Error('INCOMPLETE_CAPA_ACTIONS');
      }
      const changed = await tx.capaCase.updateMany({ where: { id: caseId, status: from }, data: {
        status: next, evidenceJson: next === 'CLOSED' ? evidence : undefined,
        closureReason: next === 'CLOSED' ? closureReason : undefined,
        closedAt: next === 'CLOSED' ? new Date() : undefined, closedByUserId: next === 'CLOSED' ? actorId : undefined } });
      if (changed.count !== 1) throw new Error('CAPA_CONCURRENT_MODIFICATION');
      await tx.capaTransition.create({ data: { caseId, fromStatus: from, toStatus: next, actorUserId: actorId, evidence } });
      return tx.capaCase.findUniqueOrThrow({ where: { id: caseId } });
    });
  }

  public closeCase(caseId: string, reason: string, evidence: string, actorId: string): Promise<CapaCase> {
    return this.transitionCase(caseId, 'CLOSED', actorId, evidence, reason);
  }
}