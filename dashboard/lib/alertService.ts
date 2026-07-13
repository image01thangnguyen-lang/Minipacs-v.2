import { prisma } from "@/app/db";

export async function getAlertRules() {
  return prisma.alertRule.findMany({
    orderBy: { createdAt: 'desc' },
  });
}
