const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "app");
const allowFullViewport = new Set([
  "login/page.tsx",
  "share/[token]/page.tsx",
  "report/[studyInstanceUid]/page.tsx",
  "non-dicom/page.tsx",
]);
const violations = [];

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
}

walk(root);
if (violations.length) {
  console.error("UI style guard failed:\n" + violations.map(v => `- ${v}`).join("\n"));
  process.exit(1);
}
console.log("UI style guard passed.");