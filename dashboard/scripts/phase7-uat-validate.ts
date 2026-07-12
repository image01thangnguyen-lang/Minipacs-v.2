import fs from "fs";
import path from "path";
import { parseSyntheticUatFixture, validateUatEvidence } from "../lib/release-control/uat-fixtures";

const evidencePath = process.argv[2];
if (!evidencePath) throw new Error("USAGE: phase7-uat-validate.ts <evidence.json>");
const fixture = parseSyntheticUatFixture(JSON.parse(fs.readFileSync(path.resolve(__dirname, "../prisma/uat-phase7-fixtures.json"), "utf8")));
const evidence = validateUatEvidence(JSON.parse(fs.readFileSync(path.resolve(evidencePath), "utf8")), fixture);
console.log(JSON.stringify({ ok: true, runId: evidence.runId, revision: evidence.revision, resultCount: evidence.results.length, defectCount: evidence.defects.length }));