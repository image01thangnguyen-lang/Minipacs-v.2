export const RELATED_STUDY_RANGES = ["ENCOUNTER", "30D", "1Y", "ALL"] as const;
export type RelatedStudyRange = typeof RELATED_STUDY_RANGES[number];

export type RelatedStudyDateFilter = {
  gte: Date;
  lte?: Date;
};

export function buildRelatedStudyDateFilter(
  range: RelatedStudyRange,
  anchorCreatedAt: Date,
  now: Date = new Date()
): RelatedStudyDateFilter | undefined {
  const dayMs = 24 * 60 * 60 * 1000;
  if (range === "ENCOUNTER") {
    return {
      gte: new Date(anchorCreatedAt.getTime() - dayMs),
      lte: new Date(anchorCreatedAt.getTime() + dayMs),
    };
  }
  if (range === "30D") return { gte: new Date(now.getTime() - 30 * dayMs), lte: now };
  if (range === "1Y") return { gte: new Date(now.getTime() - 365 * dayMs), lte: now };
  return undefined;
}