import { prisma } from "@/app/db";

export async function getInboundMapping() {
  const mappings = await prisma.hisFieldMapping.findMany({
    where: { direction: "INBOUND", isActive: true }
  });
  return mappings;
}

export async function getOutboundMapping() {
  const mappings = await prisma.hisFieldMapping.findMany({
    where: { direction: "OUTBOUND", isActive: true }
  });
  return mappings;
}

export function applyMapping(payload: any, mappings: any[]) {
  if (!payload || typeof payload !== "object") return payload;
  
  const result: any = { ...payload };
  for (const map of mappings) {
    if (payload[map.sourceField] !== undefined) {
      // Very basic transform implementation (could be eval or basic string map)
      let val = payload[map.sourceField];
      if (map.transformRule) {
        try {
          // Simplistic rule evaluation (e.g., M:Male, F:Female)
          const rules = JSON.parse(map.transformRule);
          if (rules[val] !== undefined) {
            val = rules[val];
          }
        } catch (e) {
          // ignore invalid rules
        }
      }
      result[map.targetField] = val;
      if (map.sourceField !== map.targetField) {
        delete result[map.sourceField];
      }
    }
  }
  return result;
}
