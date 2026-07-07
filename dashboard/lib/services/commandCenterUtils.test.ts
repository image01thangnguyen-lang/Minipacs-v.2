import {
  compareQueueReferences,
  getStudyStuckSince,
  getWorklistStuckSince,
  mergeQueueBucketPage,
  QueueReference,
} from "./commandCenterUtils";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run(name: string, test: () => void) {
  try {
    test();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

run("queue references sort by clinical priority before date", () => {
  const refs: QueueReference[] = [
    { id: "routine", priority: "ROUTINE", createdAt: new Date("2026-07-07T12:00:00Z"), source: "PACS" },
    { id: "urgent", priority: "URGENT", createdAt: new Date("2026-07-07T10:00:00Z"), source: "HIS" },
    { id: "stat", priority: "STAT", createdAt: new Date("2026-07-07T09:00:00Z"), source: "PACS" },
  ];

  refs.sort(compareQueueReferences);
  assert(refs.map(item => item.id).join(",") === "stat,urgent,routine", "priority order is incorrect");
});

run("cross-source queue pagination applies the offset after merging", () => {
  const pacs = [
    { id: "p1", priority: "STAT", createdAt: new Date("2026-07-07T12:00:00Z") },
    { id: "p2", priority: "STAT", createdAt: new Date("2026-07-07T10:00:00Z") },
  ];
  const his = [
    { id: "h1", priority: "STAT", createdAt: new Date("2026-07-07T11:00:00Z") },
    { id: "h2", priority: "STAT", createdAt: new Date("2026-07-07T09:00:00Z") },
  ];

  const page = mergeQueueBucketPage(pacs, his, 1, 2);
  assert(page.map(item => item.id).join(",") === "h1,p2", "cross-source page is incorrect");
});

run("ORDERED study without an order is not assigned a fake stuck timestamp", () => {
  assert(getStudyStuckSince({ status: "ORDERED", order: null }) === null, "missing order must remain not measurable");
});

run("future SCHEDULED order is not stuck", () => {
  const now = new Date("2026-07-07T12:00:00Z");
  const value = getWorklistStuckSince({
    orderStatus: "SCHEDULED",
    createdAt: new Date("2026-07-01T00:00:00Z"),
    scheduledDate: new Date("2026-07-08T12:00:00Z"),
  }, now);
  assert(value === null, "future schedule must not be marked stuck");
});

run("overdue SCHEDULED order uses scheduledDate", () => {
  const scheduledDate = new Date("2026-07-07T08:00:00Z");
  const value = getWorklistStuckSince({
    orderStatus: "SCHEDULED",
    createdAt: new Date("2026-07-01T00:00:00Z"),
    scheduledDate,
  }, new Date("2026-07-07T12:00:00Z"));
  assert(value?.getTime() === scheduledDate.getTime(), "scheduledDate must be used for overdue schedules");
});

run("ARRIVED order uses arrivedAt", () => {
  const arrivedAt = new Date("2026-07-07T09:00:00Z");
  const value = getWorklistStuckSince({
    orderStatus: "ARRIVED",
    createdAt: new Date("2026-07-01T00:00:00Z"),
    scheduledDate: new Date("2026-07-07T08:00:00Z"),
    arrivedAt,
  });
  assert(value?.getTime() === arrivedAt.getTime(), "arrivedAt must be used for arrived orders");
});
