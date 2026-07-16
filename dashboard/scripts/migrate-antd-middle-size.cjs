const fs = require("fs");
const path = require("path");

const dashboardRoot = path.resolve(__dirname, "..");
const roots = [path.join(dashboardRoot, "app"), path.join(dashboardRoot, "components")];
let changedFiles = 0;
let changedSmallProps = 0;
let changedTypography = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
      continue;
    }
    if (!/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) continue;

    const before = fs.readFileSync(filePath, "utf8");
    let source = before;

    if (/\.(tsx|jsx)$/.test(entry.name)) {
      // Card's size prop controls header density and Spin's size prop controls
      // only the glyph. Removing both lets the medium theme be authoritative.
      source = source.replace(/<(Card|Spin)\b(?:(?!>).)*?>/gs, (tag) =>
        tag.replace(/\s+size\s*=\s*(["'])small\1/g, ""),
      );

      source = source.replace(/<[A-Za-z0-9_.]+\b(?:(?!>).)*?>/gs, (tag) =>
        tag.replace(/\bsize\s*=\s*(["'])small\1/g, 'size="middle"'),
      );
    }

    // Ant Design's middle typography baseline is 14px. Legacy Tailwind and
    // inline styles previously bypassed ConfigProvider with 9-13px text.
    source = source
      .replace(/\btext-\[(?:[0-9]|1[0-3])px\]/g, "text-sm")
      .replace(/\btext-xs\b/g, "text-sm")
      .replace(/(fontSize\s*:\s*["'])(?:[0-9]|1[0-3])px(["'])/g, "$114px$2")
      .replace(/(font-size\s*:\s*)(?:[0-9]|1[0-3])px\b/g, "$114px");

    if (source !== before) {
      changedSmallProps += (before.match(/size\s*=\s*["']small["']/g) || []).length;
      changedTypography += (before.match(/\btext-\[(?:[0-9]|1[0-3])px\]|\btext-xs\b|fontSize\s*:\s*["'](?:[0-9]|1[0-3])px["']|font-size\s*:\s*(?:[0-9]|1[0-3])px\b/g) || []).length;
      fs.writeFileSync(filePath, source);
      changedFiles += 1;
    }
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root);
}

console.log(`Migrated ${changedFiles} files: ${changedSmallProps} small-size props and ${changedTypography} typography declarations.`);