import { prisma } from "@/app/db";

export async function getDataQualityIssues() {
  return prisma.dataQualityIssue.findMany({
    orderBy: { detectedAt: 'desc' },
    take: 50,
  });
}
