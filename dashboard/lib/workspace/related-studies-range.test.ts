import assert from "node:assert/strict";
import { buildRelatedStudyDateFilter } from "./related-studies-range";

const dayMs = 24 * 60 * 60 * 1000;
const anchor = new Date("2026-07-01T12:00:00.000Z");
const now = new Date("2026-07-11T12:00:00.000Z");

const encounter = buildRelatedStudyDateFilter("ENCOUNTER", anchor, now)!;
assert.equal(encounter.gte.getTime(), anchor.getTime() - dayMs);
assert.equal(encounter.lte?.getTime(), anchor.getTime() + dayMs);

const thirtyDays = buildRelatedStudyDateFilter("30D", anchor, now)!;
assert.equal(thirtyDays.gte.getTime(), now.getTime() - 30 * dayMs);
assert.equal(thirtyDays.lte, now);

const oneYear = buildRelatedStudyDateFilter("1Y", anchor, now)!;
assert.equal(oneYear.gte.getTime(), now.getTime() - 365 * dayMs);
assert.equal(oneYear.lte, now);

assert.equal(buildRelatedStudyDateFilter("ALL", anchor, now), undefined);
console.log("related-studies range tests passed");