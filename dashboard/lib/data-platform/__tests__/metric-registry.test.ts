import assert from "node:assert/strict";
import { MetricRegistry, metricRegistry } from "../metric-registry";

const registry = new MetricRegistry();
const definition = {
  id: "test_metric", version: 1, owner: "test", source: ["TestSource"], type: "COUNTER" as const,
  unit: "events" as const, formula: "count(*)", dimensions: ["status" as const], sourceTimestamp: "createdAt",
  exclusions: [], timezone: "UTC" as const, freshness: "5m", completeness: "All persisted rows",
  phiClass: "NONE" as const, compatibility: "Formula changes require a new version.", description: "Test metric.",
};
registry.register(definition);
assert.equal(registry.get("test_metric")?.id, "test_metric");
assert.throws(() => registry.register(definition), /already registered/);
assert.equal(metricRegistry.getAll().length, 11);
assert.throws(() => registry.register({ ...definition, id: "duplicate_dimensions", dimensions: ["status", "status"] }), /duplicate dimensions/);
console.log("metric-registry tests passed");
