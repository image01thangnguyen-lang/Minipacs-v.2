export interface QueueReference {
  id: string;
  priority: string | null;
  createdAt: Date;
  source: "PACS" | "HIS";
}

export function compareQueueReferences(a: QueueReference, b: QueueReference) {
  const priorityRank = (priority: string | null) => {
    if (priority === "STAT") return 2;
    if (priority === "URGENT") return 1;
    return 0;
  };

  const priorityDifference = priorityRank(b.priority) - priorityRank(a.priority);
  if (priorityDifference !== 0) return priorityDifference;

  const dateDifference = b.createdAt.getTime() - a.createdAt.getTime();
  if (dateDifference !== 0) return dateDifference;

  const idDifference = a.id.localeCompare(b.id);
  if (idDifference !== 0) return idDifference;
  return a.source.localeCompare(b.source);
}

export function mergeQueueBucketPage(
  pacs: Omit<QueueReference, "source">[],
  his: Omit<QueueReference, "source">[],
  skip: number,
  take: number
) {
  return [
    ...pacs.map(item => ({ ...item, source: "PACS" as const })),
    ...his.map(item => ({ ...item, source: "HIS" as const })),
  ]
    .sort(compareQueueReferences)
    .slice(skip, skip + take);
}

export function getStudyStuckSince(study: {
  status: string;
  checkedInAt?: Date | null;
  scanStartedAt?: Date | null;
  scanEndedAt?: Date | null;
  receivedAt?: Date | null;
  firstOpenedAt?: Date | null;
  order?: { createdAt: Date } | null;
}) {
  switch (study.status) {
    case "ORDERED":
      return study.order?.createdAt ?? null;
    case "READY_FOR_SCAN":
      return study.checkedInAt ?? null;
    case "IN_PROGRESS":
      return study.scanStartedAt ?? null;
    case "STABLE":
    case "NEEDS_QC":
      return study.scanEndedAt ?? null;
    case "RECEIVED":
    case "READY_TO_READ":
      return study.receivedAt ?? null;
    case "READING":
      return study.firstOpenedAt ?? null;
    default:
      return null;
  }
}

export function getWorklistStuckSince(order: {
  orderStatus: string;
  createdAt: Date;
  scheduledDate: Date;
  arrivedAt?: Date | null;
}, now = new Date()) {
  switch (order.orderStatus) {
    case "REQUESTED":
      return order.createdAt;
    case "SCHEDULED":
      return order.scheduledDate <= now ? order.scheduledDate : null;
    case "ARRIVED":
      return order.arrivedAt ?? null;
    default:
      return null;
  }
}
