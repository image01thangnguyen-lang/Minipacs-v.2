const fs = require("fs");
const path = require("path");

const dashboardRoot = path.resolve(__dirname, "..");
const roots = [path.join(dashboardRoot, "app"), path.join(dashboardRoot, "components")];
let changedFiles = 0;
let changedSmallProps = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
      continue;
    }
    if (!/\.(tsx|jsx)$/.test(entry.name)) continue;

    const before = fs.readFileSync(filePath, "utf8");
    let source = before;

    // Card's size prop controls header density and Spin's size prop controls
    // only the glyph. Removing both lets the medium theme be authoritative.
    source = source.replace(/<(Card|Spin)\b(?:(?!>).)*?>/gs, (tag) =>
      tag.replace(/\s+size\s*=\s*(["'])small\1/g, ""),
    );

    source = source.replace(/<[A-Za-z0-9_.]+\b(?:(?!>).)*?>/gs, (tag) =>
      tag.replace(/\bsize\s*=\s*(["'])small\1/g, 'size="middle"'),
    );

    if (source !== before) {
      changedSmallProps += (before.match(/size\s*=\s*["']small["']/g) || []).length;
      fs.writeFileSync(filePath, source);
      changedFiles += 1;
    }
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root);
}

console.log(`Migrated ${changedSmallProps} small-size props in ${changedFiles} files.`);