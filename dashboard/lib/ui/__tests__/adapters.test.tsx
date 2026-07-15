import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomSelect } from "../../../app/components/CustomSelect";
import { CustomDatePicker, parseDateOnly } from "../../../app/components/CustomDatePicker";
import { StatusBadge } from "../../../app/components/ui/StatusBadge";

assert.equal(parseDateOnly("2026-07-14")?.format("YYYY-MM-DD"), "2026-07-14");
assert.equal(parseDateOnly("2026-02-29"), null);
assert.equal(parseDateOnly("14/07/2026"), null);

const selectMarkup = renderToStaticMarkup(
  <CustomSelect name="modality" value="CT" options={[{ value: "CT", label: "CT" }]} disabled />,
);
assert.match(selectMarkup, /type="hidden"/);
assert.match(selectMarkup, /name="modality"/);
assert.match(selectMarkup, /value="CT"/);
assert.doesNotMatch(selectMarkup, /ant-select-sm/);
assert.match(selectMarkup, /ant-select-disabled/);

const dateMarkup = renderToStaticMarkup(
  <CustomDatePicker name="studyDate" value="2026-07-14" disabled />,
);
assert.match(dateMarkup, /name="studyDate"/);
assert.match(dateMarkup, /value="2026-07-14"/);
assert.match(dateMarkup, /14\/07\/2026/);
assert.doesNotMatch(dateMarkup, /ant-picker-small/);

const badgeMarkup = renderToStaticMarkup(<StatusBadge domain="study" status="FINALIZED" />);
assert.match(badgeMarkup, /ant-tag/);
assert.match(badgeMarkup, /Đã ký/);

console.log("UI adapter contract tests passed");