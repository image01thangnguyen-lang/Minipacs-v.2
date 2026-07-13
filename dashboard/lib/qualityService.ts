import { prisma } from "@/app/db";

export async function getPeerReviews() {
  return prisma.peerReview.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      report: true,
      reviewer: true,
      originalDoctor: true,
    },
  });
}

export async function getCriticalResults() {
  return prisma.criticalResult.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getQcIssues() {
  return prisma.qcIssue.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      createdByUser: true,
    },
  });
}
