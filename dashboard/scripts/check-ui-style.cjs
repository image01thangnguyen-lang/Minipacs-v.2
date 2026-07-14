const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "app");
const allowFullViewport = new Set([
  "login/page.tsx",
  "share/[token]/page.tsx",
  "report/[studyInstanceUid]/page.tsx",
  "non-dicom/page.tsx",
]);
// Temporary, exact legacy debt. Never allowlist a whole file.
// ADR: Phase-0 Tailwind coexistence; review: 2026-10-01; owner: UI platform.
const literalWhiteAllowlist = new Map([
  ["globals.css", new Set([
    "--vin-text-primary: #ffffff;",
    "--vin-status-new-text: #ffffff;",
    "--vin-status-approved-text: #ffffff;",
  ])],
]);
const violations = [];
const compactControls = ["Button", "Input", "InputNumber", "Select", "DatePicker"];

function openingTags(text, component) {
  return text.match(new RegExp(`<${component}\\b(?:(?!>).)*>`, "gs")) ?? [];
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) inspect(full);
  }
}

function inspect(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");
  const rules = [
    [/(?:bg|text|border)-vin-(?:bg|background)(?:\b|-)/g, "legacy/undefined vin background token"],
    [/(?:bg|text|border)-vin-accent-hover/g, "use canonical vin-accentHover Tailwind token"],
  ];
  if (!allowFullViewport.has(relative)) rules.push([/min-h-screen/g, "nested route must not own min-h-screen"]);
  for (const [regex, message] of rules) {
    if (regex.test(text)) violations.push(`${relative}: ${message}`);
  }

  const allowedWhiteLines = literalWhiteAllowlist.get(relative) ?? new Set();
  for (const line of text.split(/\r?\n/)) {
    if (/#(?:fff|ffffff)\b/i.test(line) && !allowedWhiteLines.has(line.trim())) {
      violations.push(`${relative}: literal white colors are forbidden; use clinical theme tokens`);
    }
  }

  for (const tag of openingTags(text, "Table")) {
    if (!/\bsize\s*=\s*["']small["']/.test(tag)) {
      violations.push(`${relative}: AntD Table must explicitly declare size="small"`);
    }
  }

  for (const component of compactControls) {
    for (const tag of openingTags(text, component)) {
      if (!/\bsize\s*=\s*["']small["']/.test(tag)) {
        violations.push(`${relative}: AntD ${component} must explicitly declare size="small"`);
      }
    }
  }

  for (const tag of openingTags(text, "Space")) {
    if (/\bsize\s*=\s*["'](?:middle|large)["']/.test(tag)) {
      violations.push(`${relative}: AntD Space must not use middle/large spacing`);
    }
  }

  if (/import\s*\{[^}]*\b(?:message|notification)\b[^}]*\}\s*from\s*["']antd["']/.test(text)
      && /\b(?:message|notification)\.(?!use[A-Z])\w+\s*\(/.test(text)) {
    violations.push(`${relative}: use AntD App/hook context instead of static feedback APIs`);
  }
  if (/\bModal\.(?:info|success|error|warning|confirm)\s*\(/.test(text)) {
    violations.push(`${relative}: use AntD App context instead of static Modal APIs`);
  }
}

walk(root);
if (violations.length) {
  console.error("UI style guard failed:\n" + violations.map(v => `- ${v}`).join("\n"));
  process.exit(1);
}
console.log("UI style guard passed.");