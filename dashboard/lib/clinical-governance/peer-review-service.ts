import { createHash } from 'crypto';
import type { PeerReviewProgram, PrismaClient } from '@prisma/client';

export class PeerReviewService {
  constructor(private readonly prisma: PrismaClient) {}

  public shouldSample(studyInstanceUid: string, program: PeerReviewProgram): boolean {
    if (!Number.isFinite(program.samplePercentage) || program.samplePercentage < 0 || program.samplePercentage > 100) {
      throw new Error('INVALID_SAMPLE_PERCENTAGE');
    }
    if (!program.isActive || program.samplePercentage === 0) return false;
    if (program.samplePercentage === 100) return true;
    const digest = createHash('sha256').update(`${program.id}:v${program.version}:${studyInstanceUid}`).digest();
    return (digest.readUInt32BE(0) / 0x1_0000_0000) * 100 < program.samplePercentage;
  }

  public async isExcluded(programId: string, doctorId: string, procedureCode?: string): Promise<boolean> {
    const rules = await this.prisma.peerReviewExclusionRule.findMany({ where: { programId } });
    return rules.some(rule => rule.excludeDoctorId === doctorId || (!!procedureCode && rule.excludeProcedure === procedureCode));
  }

  public selectReviewer(studyUid: string, originalDoctorId: string, reviewers: string[]): string | null {
    const eligible = Array.from(new Set(reviewers)).filter(id => id && id !== originalDoctorId);
    if (!eligible.length) return null;
    return eligible.sort((a, b) => {
      const sa = createHash('sha256').update(`${studyUid}:${a}`).digest('hex');
      const sb = createHash('sha256').update(`${studyUid}:${b}`).digest('hex');
      return sb.localeCompare(sa) || a.localeCompare(b);
    })[0];
  }

  public async assignReview(programId: string, reportId: string, studyInstanceUid: string,
    originalDoctorId: string, reviewers: string[], reportRevision = 0, procedureCode?: string): Promise<string | null> {
    const program = await this.prisma.peerReviewProgram.findUnique({ where: { id: programId } });
    if (!program?.isActive) throw new Error('PEER_REVIEW_PROGRAM_NOT_ACTIVE');
    if (await this.isExcluded(programId, originalDoctorId, procedureCode)) return null;
    if (!this.shouldSample(studyInstanceUid, program)) return null;
    const reviewerUserId = this.selectReviewer(studyInstanceUid, originalDoctorId, reviewers);
    if (!reviewerUserId) return null;
    const samplingKey = `${program.id}:v${program.version}:${reportId}:r${reportRevision}`;
    const review = await this.prisma.peerReview.upsert({
      where: { samplingKey }, update: {},
      create: { reportId, studyInstanceUid, reviewerUserId, originalDoctorId, programId,
        programVersion: program.version, reportRevision, samplingKey, status: 'ASSIGNED',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    return review.id;
  }
}