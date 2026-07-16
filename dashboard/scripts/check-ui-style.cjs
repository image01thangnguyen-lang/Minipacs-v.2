const fs = require("fs");
const path = require("path");

const dashboardRoot = path.join(__dirname, "..");
const roots = [path.join(dashboardRoot, "app"), path.join(dashboardRoot, "components")];
const allowFullViewport = new Set([
  "app/login/page.tsx",
  "app/share/[token]/page.tsx",
  "app/report/[studyInstanceUid]/page.tsx",
  "app/non-dicom/page.tsx",
]);
// Temporary, exact legacy debt. Never allowlist a whole file.
// ADR: Phase-0 Tailwind coexistence; review: 2026-10-01; owner: UI platform.
const literalWhiteAllowlist = new Map([
  ["app/globals.css", new Set([
    "--vin-text-primary: #ffffff;",
    "--vin-status-new-text: #ffffff;",
    "--vin-status-approved-text: #ffffff;",
  ])],
]);
const violations = [];
const mediumControls = ["Button", "Input", "InputNumber", "Select", "DatePicker", "Table"];

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
  const relative = path.relative(dashboardRoot, file).replace(/\\/g, "/");
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

  for (const component of mediumControls) {
    for (const tag of openingTags(text, component)) {
      if (/\bsize\s*=\s*["']small["']/.test(tag)) {
        violations.push(`${relative}: AntD ${component} must use the provider default or size="middle", not size="small"`);
      }
    }
  }

  if (/\btext-\[(?:[0-9]|1[0-3])px\]|\btext-xs\b/.test(text)) {
    violations.push(`${relative}: text below the 14px middle-size baseline is forbidden`);
  }
  if (/fontSize\s*:\s*["'](?:[0-9]|1[0-3])px["']|font-size\s*:\s*(?:[0-9]|1[0-3])px\b/.test(text)) {
    violations.push(`${relative}: inline/CSS font size below the 14px middle-size baseline is forbidden`);
  }
  for (const tag of openingTags(text, "Space")) {
    if (/\bsize\s*=\s*["']small["']/.test(tag)) {
      violations.push(`${relative}: AntD Space must not use small spacing`);
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

for (const root of roots) {
  if (fs.existsSync(root)) walk(root);
}
if (violations.length) {
  console.error("UI style guard failed:\n" + violations.map(v => `- ${v}`).join("\n"));
  process.exit(1);
}
console.log("UI style guard passed.");