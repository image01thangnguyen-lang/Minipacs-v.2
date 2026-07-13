import { prisma } from "@/app/db";

export async function getControlThresholdPolicies() {
  return prisma.controlThresholdPolicy.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSlaPolicies() {
  return prisma.slaPolicy.findMany({
    orderBy: { createdAt: 'desc' },
  });
}
